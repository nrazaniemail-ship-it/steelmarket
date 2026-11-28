const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const PAGE='https://nrazaniemail-ship-it.github.io/fooladban/';
const API='https://fooladban-steel-api.n-razaniemail.workers.dev';
const SHEET='pivan-hot-rolled-sheet-2mm-mobarakeh-1250x2500-tehran';
const COIL='ahanonline-hot-rolled-coil-2mm-mobarakeh-1250-factory';
const products=[
 {id:SHEET,catalogId:'hot-rolled-sheet',productKey:'hot-rolled-sheet',name:'ورق گرم (سیاه)-تخت',sourceName:'پیوان',sourceRef:'pivan',market:'ایران',marketScope:'iran',sourceKind:'free_market',specification:'ضخامت ۲ میلی‌متر · عرض ۱۲۵۰ میلی‌متر · طول ۲۵۰۰ میلی‌متر',delivery:'انبار تهران',currency:'IRT',measureUnit:'kg',unit:'IRT/kg',url:'https://pivan.co/',mode:'auto',history:[],checkedAt:0,lastSuccessAt:0,threshold:0},
 {id:COIL,catalogId:'hot-rolled-coil',productKey:'hot-rolled-coil',name:'ورق گرم (سیاه)-کلاف',sourceName:'آهن آنلاین',sourceRef:'ahanonline',market:'ایران',marketScope:'iran',sourceKind:'free_market',specification:'ضخامت ۲ میلی‌متر · عرض ۱۲۵۰ میلی‌متر · کلاف',delivery:'کارخانه',currency:'IRT',measureUnit:'kg',unit:'IRT/kg',url:'https://ahanonline.com/product-category/انواع-ورق/ورق-سیاه/',mode:'auto',history:[],checkedAt:0,lastSuccessAt:0,threshold:0}
];

async function getJson(url){
 const response=await fetch(url,{cache:'no-store'});
 assert.equal(response.status,200,url+' returned HTTP '+response.status);
 assert.match(response.headers.get('cache-control')||'',/no-store/i,url+' must be non-cacheable');
 return response.json();
}
function rowsOf(value){return Array.isArray(value)?value:(value?.results||[])}
function fa(value){return Number(value).toLocaleString('fa-IR',{maximumFractionDigits:2})}
function sourceDate(value){
 const parts=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).formatToParts(new Date(Number(value)));
 const p=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return p.day+'-'+p.month+'-'+p.year+'، '+p.hour+':'+p.minute;
}

(async()=>{
 const sourceRows=rowsOf(await getJson(API+'/public/sources'));
 const obsSheet=rowsOf(await getJson(API+'/public/observations?product_key=hot-rolled-sheet'));
 const obsCoil=rowsOf(await getJson(API+'/public/observations?product_key=hot-rolled-coil'));
 const sourceSheet=sourceRows.find(x=>x.id===SHEET);
 const sourceCoil=sourceRows.find(x=>x.id===COIL);
 assert.ok(sourceSheet&&sourceSheet.enabled,'Live API must expose enabled Pivan sheet source');
 assert.ok(sourceCoil&&sourceCoil.enabled,'Live API must expose enabled Ahanonline coil source');
 assert.equal(sourceSheet.product_key,'hot-rolled-sheet');
 assert.equal(sourceCoil.product_key,'hot-rolled-coil');
 const latestSheet=obsSheet.filter(x=>x.source_id===SHEET).sort((a,b)=>Number(a.observed_at)-Number(b.observed_at)).at(-1);
 const latestCoil=obsCoil.filter(x=>x.source_id===COIL).sort((a,b)=>Number(a.observed_at)-Number(b.observed_at)).at(-1);
 assert.ok(latestSheet&&Number(latestSheet.raw_price)>0,'D1 must expose a positive sheet observation');
 assert.ok(latestCoil&&Number(latestCoil.raw_price)>0,'D1 must expose a positive coil observation');

 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage();
 const pageErrors=[];
 const apiResponses=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 page.on('response',response=>{
  if(response.url().startsWith(API+'/'))apiResponses.push({url:response.url(),status:response.status(),cache:response.headers()['cache-control']||'',fromSW:response.fromServiceWorker()});
 });
 try{
  await context.addInitScript(({products,api})=>{
   localStorage.setItem('fooladban.v1',JSON.stringify({products,events:[],deletedIds:[],settings:{interval:15,auto:false,alerts:false,proxy:'',apiUrl:api,fxRates:{}}}));
   localStorage.setItem('fooladban.market-config.v1',JSON.stringify({selected:['hot-rolled-sheet','hot-rolled-coil'],order:['hot-rolled-sheet','hot-rolled-coil'],cardOrder:[],hiddenVariants:[],sources:[]}));
  },{products,api:API});
  await page.goto(PAGE,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.querySelectorAll('#mcDashboardPicks .mc-dashboard-card').length===2,{timeout:45000});
  await page.waitForFunction(ids=>{
   const state=JSON.parse(localStorage.getItem('fooladban.v1')||'{}');
   return ids.every(id=>state.products?.find(p=>p.id===id)?.history?.length>0);
  },[SHEET,COIL],{timeout:60000});
  await page.waitForFunction(()=>document.querySelectorAll('#mcDashboardPicks .mc-dashboard-record').length===2,{timeout:20000});

  await page.evaluate(async()=>{await navigator.serviceWorker.ready});
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:30000});
  const swState=await page.evaluate(async()=>{
   const reg=await navigator.serviceWorker.ready;
   const names=await caches.keys();
   const entries=[];
   for(const name of names){const cache=await caches.open(name);for(const request of await cache.keys())entries.push(request.url)}
   return {scope:reg.scope,script:reg.active?.scriptURL||'',names,entries};
  });
  assert.ok(swState.script.endsWith('/fooladban/sw.js'),'Expected the deployed Fooladban service worker to be active');
  assert.ok(swState.names.includes('fooladban-shell-v3.8'),'Expected the new shell cache version to be installed');
  assert.ok(swState.entries.some(x=>x.includes('/fooladban/index.html')),'The app shell must be cached for offline navigation');
  assert.ok(swState.entries.every(x=>!x.startsWith(API+'/')),'The service worker must never cache cross-origin API responses');

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.title.includes('فولادبان')&&!!document.querySelector('#mcDashboardPicks'),{timeout:20000});
  await context.setOffline(false);
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:30000});
  await page.waitForFunction(ids=>{
   const state=JSON.parse(localStorage.getItem('fooladban.v1')||'{}');
   return ids.every(id=>state.products?.find(p=>p.id===id)?.history?.length>0);
  },[SHEET,COIL],{timeout:60000});

  const liveState=await page.evaluate(()=>JSON.parse(localStorage.getItem('fooladban.v1')||'{}'));
  const sheetProduct=liveState.products.find(x=>x.id===SHEET);
  const coilProduct=liveState.products.find(x=>x.id===COIL);
  const sheetLast=sheetProduct.history.at(-1);
  const coilLast=coilProduct.history.at(-1);
  assert.equal(Number(sheetLast.price),Number(latestSheet.raw_price),'Sheet history must map only its own latest D1 observation');
  assert.equal(Number(coilLast.price),Number(latestCoil.raw_price),'Coil history must map only its own latest D1 observation');
  assert.notEqual(sheetProduct.productKey,coilProduct.productKey,'The two products must retain separate product keys');

  const sheetCard=page.locator('#mcDashboardPicks .mc-dashboard-card[data-catalog-id="hot-rolled-sheet"]');
  const coilCard=page.locator('#mcDashboardPicks .mc-dashboard-card[data-catalog-id="hot-rolled-coil"]');
  for(const card of [sheetCard,coilCard]){
   if(await card.locator('[data-toggle-watch]').getAttribute('aria-expanded')!=='true')await card.locator('[data-toggle-watch]').click();
  }
  const initial=await page.evaluate(()=>[...document.querySelectorAll('#mcDashboardPicks .mc-dashboard-card')].map(card=>({id:card.dataset.catalogId,text:card.querySelector('.mc-dashboard-record')?.innerText||''})));
  const sheetText=initial.find(x=>x.id==='hot-rolled-sheet')?.text||'';
  const coilText=initial.find(x=>x.id==='hot-rolled-coil')?.text||'';
  assert.ok(sheetText.includes(fa(latestSheet.raw_price)),'Sheet card must display the live D1 sheet price');
  assert.ok(coilText.includes(fa(latestCoil.raw_price)),'Coil card must display the live D1 coil price');
  assert.ok(sheetText.includes(sourceDate(latestSheet.observed_at)),'Sheet card must display its own D1 observation date');
  assert.ok(coilText.includes(sourceDate(latestCoil.observed_at)),'Coil card must display its own D1 observation date');
  assert.ok(sheetText.includes('پیوان'),'Sheet card must identify its own provider');
  assert.ok(coilText.includes('آهن آنلاین'),'Coil card must identify its own provider');
  assert.ok(!sheetText.includes(fa(latestCoil.raw_price))||Number(latestSheet.raw_price)===Number(latestCoil.raw_price),'Sheet card must not display coil-only price');
  assert.ok(!coilText.includes(fa(latestSheet.raw_price))||Number(latestSheet.raw_price)===Number(latestCoil.raw_price),'Coil card must not display sheet-only price');

  const beforeSheet=await page.evaluate(id=>JSON.parse(localStorage.getItem('fooladban.v1')).products.find(p=>p.id===id).history.length,SHEET);
  const beforeCoil=await page.evaluate(id=>JSON.stringify(JSON.parse(localStorage.getItem('fooladban.v1')).products.find(p=>p.id===id).history),COIL);
  const sheetResponsePromise=page.waitForResponse(r=>r.url().startsWith(API+'/public/price?')&&new URL(r.url()).searchParams.get('product_key')==='hot-rolled-sheet',{timeout:90000});
  await sheetCard.locator('[data-watch-action="refresh"]').click();
  const sheetResponse=await sheetResponsePromise;
  assert.equal(sheetResponse.status(),200,'Live sheet refresh endpoint must return HTTP 200');
  const refreshedSheet=await sheetResponse.json();
  assert.ok(Number(refreshedSheet.price)>0,'Live sheet refresh must return a positive price');
  await page.waitForFunction(({id,count,price})=>{
   const p=JSON.parse(localStorage.getItem('fooladban.v1')||'{}').products.find(x=>x.id===id);
   return p&&p.history.length===count+1&&Number(p.history.at(-1).price)===Number(price);
  },{id:SHEET,count:beforeSheet,price:refreshedSheet.price},{timeout:60000});
  assert.equal(await page.evaluate(id=>JSON.stringify(JSON.parse(localStorage.getItem('fooladban.v1')).products.find(p=>p.id===id).history),COIL),beforeCoil,'Refreshing sheet must not change coil history');
  await page.waitForFunction(price=>document.querySelector('#mcDashboardPicks .mc-dashboard-card[data-catalog-id="hot-rolled-sheet"] .mc-dashboard-record')?.innerText.includes(Number(price).toLocaleString('fa-IR')) ,refreshedSheet.price,{timeout:30000});

  const beforeCoilRefresh=await page.evaluate(id=>JSON.parse(localStorage.getItem('fooladban.v1')).products.find(p=>p.id===id).history.length,COIL);
  const beforeSheetAgain=await page.evaluate(id=>JSON.stringify(JSON.parse(localStorage.getItem('fooladban.v1')).products.find(p=>p.id===id).history),SHEET);
  const coilResponsePromise=page.waitForResponse(r=>r.url().startsWith(API+'/public/price?')&&new URL(r.url()).searchParams.get('product_key')==='hot-rolled-coil',{timeout:90000});
  await page.locator('#mcDashboardPicks .mc-dashboard-card[data-catalog-id="hot-rolled-coil"] [data-watch-action="refresh"]').click();
  const coilResponse=await coilResponsePromise;
  assert.equal(coilResponse.status(),200,'Live coil refresh endpoint must return HTTP 200');
  const refreshedCoil=await coilResponse.json();
  assert.ok(Number(refreshedCoil.price)>0,'Live coil refresh must return a positive price');
  await page.waitForFunction(({id,count,price})=>{
   const p=JSON.parse(localStorage.getItem('fooladban.v1')||'{}').products.find(x=>x.id===id);
   return p&&p.history.length===count+1&&Number(p.history.at(-1).price)===Number(price);
  },{id:COIL,count:beforeCoilRefresh,price:refreshedCoil.price},{timeout:60000});
  assert.equal(await page.evaluate(id=>JSON.stringify(JSON.parse(localStorage.getItem('fooladban.v1')).products.find(p=>p.id===id).history),SHEET),beforeSheetAgain,'Refreshing coil must not change sheet history');

  const finalCards=await page.evaluate(()=>[...document.querySelectorAll('#mcDashboardPicks .mc-dashboard-card')].map(card=>({id:card.dataset.catalogId,text:card.querySelector('.mc-dashboard-record')?.innerText||''})));
  assert.ok(finalCards.find(x=>x.id==='hot-rolled-sheet').text.includes(fa(refreshedSheet.price)),'Sheet card must retain its own refreshed price');
  assert.ok(finalCards.find(x=>x.id==='hot-rolled-coil').text.includes(fa(refreshedCoil.price)),'Coil card must retain its own refreshed price');

  const badApi=apiResponses.filter(x=>x.status!==200||!/no-store/i.test(x.cache)||x.fromSW);
  assert.deepEqual(badApi,[],'Browser API responses must be successful, no-store, and bypass the site service worker');
  assert.deepEqual(pageErrors,[],'The deployed page must not emit uncaught JavaScript errors');
  console.log(JSON.stringify({
   result:'PASS',target:PAGE,viewport:'390x844 mobile',serviceWorker:swState.script,cache:swState.names,liveApiRequests:apiResponses.length,
   sheet:{source:SHEET,initialPrice:latestSheet.raw_price,initialObservedAt:latestSheet.observed_at,refreshedPrice:refreshedSheet.price},
   coil:{source:COIL,initialPrice:latestCoil.raw_price,initialObservedAt:latestCoil.observed_at,refreshedPrice:refreshedCoil.price},
   isolation:'PASS: each refresh changed only its own product history and dashboard card',
   offlineShell:'PASS',apiCache:'PASS: cross-origin API bypassed service worker and responses were no-store'
  },null,2));
 }finally{await context.close();await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
