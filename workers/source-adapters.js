const TE_SLUGS = Object.freeze({
  steel: 'steel', 'billet-bloom': 'steel', rebar: 'steel',
  'hot-rolled': 'hrc-steel', 'cold-rolled': 'hrc-steel',
  'iron-ore-lump': 'iron-ore', 'iron-ore-fines': 'iron-ore',
  'iron-concentrate': 'iron-ore', pellet: 'iron-ore',
  'sponge-iron': 'steel', hbi: 'steel', 'scrap-steel': 'scrap-steel'
});
const ADAPTERS = Object.freeze([
  { id:'ime', hosts:['ime.co.ir','www.ime.co.ir'], method:'official-market-data', confidence:'conditional', note:'اطلاعیه عرضه و گزارش معاملات؛ قیمت پایه با قیمت معامله یکسان نیست.' },
  { id:'ahanonline', hosts:['ahanonline.com','www.ahanonline.com'], method:'product-page-jsonld', confidence:'conditional', note:'صفحه اختصاصی کالا؛ قیمت و تاریخ به‌روزرسانی باید از همان صفحه خوانده شود.' },
  { id:'markazeahan', hosts:['markazeahan.com','www.markazeahan.com','t.me','www.t.me'], method:'product-page-jsonld', confidence:'conditional', note:'صفحه اختصاصی کالا؛ نیازمند تطبیق گرید، سایز و کارخانه.' },
  { id:'iromart', hosts:['iromart.com','www.iromart.com'], method:'product-page-jsonld', confidence:'conditional', note:'صفحه اختصاصی کالا؛ ممکن است قیمت به‌صورت پویا بارگذاری شود.' },
  { id:'pivan', hosts:['pivan.co','www.pivan.co'], method:'product-page-jsonld', confidence:'conditional', note:'صفحه اختصاصی کالا؛ قیمت و شرایط تحویل باید تطبیق داده شود.' },
  { id:'ahanprice', hosts:['ahanprice.com','www.ahanprice.com'], method:'product-page-jsonld', confidence:'conditional', note:'جدول قیمت؛ تاریخ و واحد قیمت باید همراه مقدار استخراج شود.' },
  { id:'tradingeconomics', hosts:['tradingeconomics.com','www.tradingeconomics.com','fa.tradingeconomics.com'], method:'commodity-page', confidence:'conditional', note:'شاخص/CFD مرجع است؛ الزاماً قیمت فیزیکی قابل معامله یا قیمت تحویل‌شده نیست.' }
]);
function hostOf(raw){try{return new URL(raw).hostname.toLowerCase().replace(/^www\./,'')}catch{return ''}}
export function identifyAdapter(raw){
 const host=hostOf(raw);
 return ADAPTERS.find(a=>a.hosts.some(h=>h.replace(/^www\./,'')===host))||{id:'custom',method:'generic-structured-data',confidence:'unknown',note:'منبع سفارشی؛ فقط داده ساختاریافته یا الگوی تأییدشده پذیرفته می‌شود.'};
}
export function tradingEconomicsUrl(productKey){
 const slug=TE_SLUGS[String(productKey||'').toLowerCase()];
 return slug ? 'https://fa.tradingeconomics.com/commodity/'+slug : null;
}
function numericPrice(value){
 const s=String(value??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,'').replace('٫','.').replace(/[^0-9.+-]/g,'');
 const n=Number(s);return Number.isFinite(n)&&n>0?n:null;
}
function walkOffers(value,out){
 if(!value||typeof value!=='object')return;
 if(Array.isArray(value)){for(const x of value)walkOffers(x,out);return}
 const type=Array.isArray(value['@type'])?value['@type']:[value['@type']];
 if(type.some(x=>['Product','Offer','AggregateOffer'].includes(x))){
  const offers=value.offers||value;
  const candidates=[offers.price,offers.lowPrice,offers.highPrice,offers.priceSpecification?.price,value.price,value.priceSpecification?.price];
  for(const c of candidates){const n=numericPrice(c);if(n){out.push(n);break}}
 }
 for(const [k,v] of Object.entries(value))if(v&&typeof v==='object')walkOffers(v,out);
}
export function extractStructuredPrice(body, adapterId='custom'){
 const out=[];
 for(const m of String(body).matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{walkOffers(JSON.parse(m[1].trim()),out)}catch{}
 }
 if(out.length)return out[0];
 const patterns=[
  /<meta[^>]*(?:itemprop=["']price["'][^>]*content=["']([^"']+)|content=["']([^"']+)["'][^>]*itemprop=["']price["'])/i,
  /<meta[^>]*(?:property=["']product:price:amount["']|property=["']og:price:amount["'])[^>]*content=["']([^"']+)["']/i,
  /<[^>]+(?:data-test=["']instrument-price-last["']|id=["']last["'])[^>]*>([\s\S]*?)<\//i,
  /<[^>]+(?:class=["'][^"']*(?:price-value|last-price|instrument-price)[^"']*["'])[^>]*>([\s\S]*?)<\//i
 ];
 for(const re of patterns){const m=String(body).match(re);if(m){const n=numericPrice(m[1]||m[2]||'');if(n)return n}}
 if(adapterId==='tradingeconomics'){
  const m=String(body).match(/(?:instrument-price-last|last-price|price-last)[^>]{0,180}>([0-9][0-9,.]*)</i);
  if(m){const n=numericPrice(m[1]);if(n)return n}
 }
 return null;
}
export { ADAPTERS };


function sourceText(value){
 return String(value??'').replace(/<script[\\s\\S]*?<\\/script>|<style[\\s\\S]*?<\\/style>/gi,' ')
  .replace(/<br\\s*\\/?\\s*>|<\\/(?:p|div|li|h[1-6]|tr)\\s*>/gi,' ')
  .replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
  .replace(/&#(\\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\\s+/g,' ').trim().toLowerCase();
}
function sourceDimension(value){
 const m=String(value||'').match(/(?:عرض\\s*)?(\\d+(?:[.,٫]\\d+)?)/);
 if(!m)return '';
 const n=Number(m[1].replace(',','.').replace('٫','.'));
 return n>0&&n<10?String(Math.round(n*1000)):String(Math.round(n));
}
function sourceThickness(source){
 const spec=sourceText([source.product_name,source.specification].filter(Boolean).join(' '));
 const m=spec.match(/(\\d+(?:[.,٫]\\d+)?)\\s*(?:میلی?متر|میل)/);
 return m?Number(m[1].replace(',','.').replace('٫','.')):null;
}
function sourceWidth(source){
 const spec=sourceText(source.specification||'');
 const m=spec.match(/عرض\\s*(\\d+(?:[.,٫]\\d+)?)/);
 return m?sourceDimension(m[1]):'';
}
function sourceMaker(source){
 const spec=sourceText([source.product_name,source.specification].join(' '));
 return ['فولاد مبارکه','مبارکه','فولاد سبا','سبا','اکسین','کاویان','گیلان','خرم آباد','نورد قطعات','قطعات']
  .find(x=>spec.includes(x))||'';
}
function sourceDateNear(text){
 const m=String(text||'').match(/(14\\d{2}[\\/.-]\\d{1,2}[\\/.-]\\d{1,2})/);
 return m?m[1].replace(/[.-]/g,'/'):null;
}
function tableRows(html){
 const out=[];
 for(const m of String(html||'').matchAll(/<tr\\b[^>]*>([\\s\\S]*?)<\\/tr>/gi)){
  const cells=[...m[1].matchAll(/<t[dh]\\b[^>]*>([\\s\\S]*?)<\\/t[dh]>/gi)].map(x=>sourceText(x[1]));
  if(cells.length)out.push({cells,index:m.index,html:m[1]});
 }
 return out;
}
export function extractIranianSheetTablePrice(body,source={},adapterId=''){
 const html=String(body||''),thickness=sourceThickness(source),width=sourceWidth(source),maker=sourceMaker(source);
 if(thickness===null||!/(hot-rolled|ورق)/i.test(String(source.product_key||'')+' '+String(source.product_name||'')))return null;
 const delivery=sourceText(source.delivery||'');
 const state=sourceText(source.specification||'');
 const matches=[];
 for(const row of tableRows(html)){
  const joined=row.cells.join(' | '),near=sourceText(html.slice(Math.max(0,row.index-12000),row.index));
  const rowText=sourceText(row.html);
  if(!/(ورق سیاه|ورق گرم|ورق ضخامت|hot rolled)/i.test(near+' '+joined))continue;
  const rowThickness=joined.match(/(?:ضخامت\\s*)?(\\d+(?:[.,٫]\\d+)?)\\s*(?:میل|میلی?متر)/);
  const heading=[...near.matchAll(/ورق\\s*(?:سیاه|گرم)(?:\\s*ضخامت)?\\s*(\\d+(?:[.,٫]\\d+)?)/g)].at(-1);
  const t=rowThickness?Number(rowThickness[1].replace(',','.').replace('٫','.')):heading?Number(heading[1].replace(',','.').replace('٫','.')):null;
  if(t!==null&&Math.abs(t-thickness)>0.001)continue;
  if(maker&&!joined.includes(maker))continue;
  if(width&&!row.cells.some(c=>sourceDimension(c)===width||c.replace(/[^0-9]/g,'').includes(width)))continue;
  if(delivery){
   const city=delivery.includes('اصفهان')?'اصفهان':delivery.includes('تهران')?'تهران':'';
   if(city&&!joined.includes(city))continue;
   if(delivery.includes('کارخانه')&&!joined.includes('کارخانه'))continue;
   if((delivery.includes('بنگاه')||delivery.includes('انبار'))&&!/(بنگاه|انبار)/.test(joined))continue;
  }
  if(state.includes('رول')&&!joined.includes('رول'))continue;
  if(state.includes('برش')&&!joined.includes('برش'))continue;
  if(state.includes('فابریک')&&!joined.includes('فابریک'))continue;
  let priceText='';
  if(adapterId==='ahanprice')priceText=row.cells[3]||'';
  else priceText=row.cells.at(-1)||'';
  if(/تماس|ناموجود|استعلام/i.test(priceText))continue;
  const nums=[...priceText.matchAll(/[0-9][0-9,٬.٫]*/g)].map(x=>numericPrice(x[0])).filter(x=>x&&x>=10000&&x<=10000000);
  const price=nums.at(-1);
  if(!price)continue;
  const after=html.slice(row.index,row.index+900);
  const date=sourceDateNear(row.cells.at(5)||'')||sourceDateNear(after)||sourceDateNear(near.slice(-2500));
  matches.push({price,sourceDate:date});
 }
 if(!matches.length)return null;
 const unique=[...new Set(matches.map(x=>x.price))];
 if(unique.length!==1)return null;
 const dated=matches.filter(x=>x.price===unique[0]&&x.sourceDate).map(x=>x.sourceDate).sort();
 return {price:unique[0],sourceDate:dated.at(-1)||null};
}


// Parse the public IME physical-market ASMX response. Prices are Rial/kg for tonne-based goods.
function imeText(value){return String(value??'').replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/\s+/g,' ').trim().toLowerCase()}
export function extractImeTradePrice(payload, source={}){
 let rows=payload;
 if(typeof rows==='string'){try{rows=JSON.parse(rows)}catch{return null}}
 if(rows&&typeof rows==='object'&&!Array.isArray(rows)&&typeof rows.d==='string'){try{rows=JSON.parse(rows.d)}catch{return null}}
 if(!Array.isArray(rows))return null;
 const key=String(source.product_key||'').toLowerCase();
 const wanted=key==='hot-rolled'?'ورق گرم':key==='cold-rolled'?'ورق سرد':String(source.product_name||'').split(/[|–—-]/)[0].trim();
 if(!wanted)return null;
 const needle=imeText(wanted);
 let matched=rows.filter(row=>imeText(row.GoodsName).includes(needle)&&Number(row.Price)>0&&Number(row.Quantity)>0);
 const productLabel=imeText(source.product_name||'');
 const producerHint=productLabel.replace(needle,'').replace(/[|–—-]/g,' ').trim();
 if(producerHint.length>2){const byProducer=matched.filter(row=>imeText(row.ProducerName).includes(producerHint));if(byProducer.length)matched=byProducer}
 if(!matched.length)return null;
 const latest=matched.map(row=>String(row.date||'')).sort().at(-1);
 const current=matched.filter(row=>String(row.date||'')===latest);
 const quantity=current.reduce((sum,row)=>sum+Number(row.Quantity||0),0);
 if(!(quantity>0))return null;
 const rialPerKg=current.reduce((sum,row)=>sum+Number(row.Price)*Number(row.Quantity||0),0)/quantity;
 if(!(rialPerKg>0&&Number.isFinite(rialPerKg)))return null;
 let price=rialPerKg;
 if(String(source.currency||'IRR').toUpperCase()==='IRT')price/=10;
 if(String(source.measure_unit||'kg').toLowerCase()==='ton')price*=1000;
 return {price,sourceDate:latest,rows:current.length,quantity,currency:String(source.currency||'IRR').toUpperCase(),measure_unit:String(source.measure_unit||'kg').toLowerCase()};
}


function markazText(html){
 return String(html||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|li|div|h[1-6])\s*>/gi,'\n')
  .replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
  .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/\s+/g,' ').trim();
}
export function extractMarkazAhanTelegramPrice(body,source={}){
 const html=String(body||'');
 const messages=[...html.matchAll(/<div[^>]*class=["'][^"']*tgme_widget_message_text[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)].map(m=>markazText(m[1]));
 if(!messages.length)return null;
 if(String(source.product_key||'')!=='hot-rolled')return null;
 const spec=markazText([source.product_name,source.specification].filter(Boolean).join(' '));
 const thickness=spec.match(/(\d+(?:[.,٫]\d+)?)\s*(?:میلی?متر|میل)/);
 if(!thickness)return null;
 const width=spec.match(/عرض\s*(\d+(?:[.,٫]\d+)?)/);
 const makers=['فولاد مبارکه','فولاد سبا','اکسین','کاویان','فولاد غرب','قطعات'];
 const maker=makers.find(x=>spec.includes(x));
 const delivery=markazText(source.delivery||'');
 const isHot=line=>/ورق\s*(?:سیاه|گرم)|ورق_(?:سیاه|گرم)/.test(line);
 const num=v=>Number(String(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٫,٬]/g,'.'));
 for(const message of messages){
  const rows=message.split(/(?=ورق\s*(?:سیاه|گرم)|ورق_(?:سیاه|گرم))/).filter(isHot);
  const matched=[];
  for(const line of rows){
   if(!line.includes('تومان'))continue;
   const t=line.match(/ضخامت\s*(\d+(?:[.,٫]\d+)?)\s*(?:میلی?متر|میل)/);
   if(!t||Math.abs(num(t[1])-num(thickness[1]))>0.001)continue;
   if(width){const w=line.match(/عرض\s*(\d+(?:[.,٫]\d+)?)/);if(!w||Math.abs(num(w[1])-num(width[1]))>0.001)continue}
   if(maker&&!line.includes(maker))continue;
   if(delivery.includes('اصفهان')&&!line.includes('اصفهان'))continue;
   if(delivery.includes('تهران')&&!line.includes('تهران'))continue;
   if(delivery.includes('کارخانه')&&!line.includes('کارخانه'))continue;
   const p=line.match(/([0-9۰-۹٠-٩][0-9۰-۹٠-٩,٬٫.]*)\s*تومان/);
   if(p){const price=numericPrice(p[1]);if(price)matched.push(price)}
  }
  if(matched.length){const unique=[...new Set(matched)];return unique.length===1?unique[0]:null}
 }
 return null;
}
