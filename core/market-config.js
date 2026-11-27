(()=>{
'use strict';
// Prevent duplicate catalog panels and event handlers if this script is loaded more than once.
if(window.__fooladbanMarketConfigInitialized)return;
window.__fooladbanMarketConfigInitialized=true;
const KEY='fooladban.market-config.v1';
const products=[
 ['شمش‌ها',[['slab','اسلب (تختال)'],['billet-bloom','بلوم و بیلت فولادی'],['alloy-billet-bloom','بلوم و بیلت فولاد آلیاژی']]],
 ['مقاطع طولی',[['long-sections','تیرآهن، ناودانی و نبشی'],['rebar','میلگرد'],['alloy-rebar','میلگرد فولاد آلیاژی'],['wire-rod','سیم فولادی'],['rail','ریل راه‌آهن']]],
 ['مقاطع تخت',[['hot-rolled','ورق گرم'],['cold-rolled','ورق سرد'],['galvanized','ورق گالوانیزه'],['tinplate','ورق قلع‌اندود'],['prepainted','ورق رنگی']]],
 ['زنجیره بالادست فولاد',[['iron-ore-lump','سنگ‌آهن کلوخه'],['iron-ore-fines','سنگ‌آهن دانه‌بندی'],['iron-concentrate','کنسانتره سنگ‌آهن'],['pellet','گندله'],['sponge-iron','آهن اسفنجی'],['hbi','بریکت آهن اسفنجی']]]
];
const defaults=[
 {id:'ime',name:'بورس کالای ایران (IME)',market:'iran',url:'https://www.ime.co.ir/',enabled:true,priority:1,type:'منبع رسمی · قیمت پایه و معاملات عمده'},
 {id:'ahanonline',name:'آهن آنلاین',market:'iran',url:'https://ahanonline.com/',enabled:true,priority:2,type:'مرجع خصوصی بازار · فروشنده'},
 {id:'markazeahan',name:'مرکز آهن',market:'iran',url:'https://markazeahan.com/',enabled:true,priority:3,type:'مرجع خصوصی بازار · فروشنده'},
 {id:'pivan',name:'پیوان',market:'iran',url:'https://pivan.co/',enabled:true,priority:4,type:'مرجع خصوصی بازار · فروشنده'},
 {id:'iromart',name:'آیرومارت',market:'iran',url:'https://iromart.com/',enabled:true,priority:5,type:'مرجع خصوصی بازار · فروشنده'},
 {id:'ahanprice',name:'آهن پرایس',market:'iran',url:'https://ahanprice.com/',enabled:true,priority:6,type:'مرجع خصوصی بازار · جدول قیمت روز'},
 {id:'tradingeconomics',name:'Trading Economics',market:'global',url:'https://fa.tradingeconomics.com/',enabled:true,priority:1,type:'مرجع قیمت جهانی'}
];
const labels={iran:'ایران',global:'جهانی / شاخص‌های بین‌المللی',china:'چین',europe:'اروپا', 'north-america':'آمریکای شمالی',turkey:'ترکیه',india:'هند','middle-east':'خاورمیانه'};
let cfg;
try{cfg=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{cfg={}}
const storedSources=Array.isArray(cfg.sources)?cfg.sources:[];
let migratedSources=[...storedSources];
if((Number(cfg.sourceCatalogVersion)||0)<3){
 const officialIds=new Set(defaults.map(x=>x.id));
 migratedSources=migratedSources.filter(x=>officialIds.has(x.id)||String(x.id||'').startsWith('custom-'));
 for(const item of defaults){const existing=migratedSources.find(x=>x.id===item.id);if(!existing)migratedSources.push({...item});else Object.assign(existing,item)}
 cfg.sourceCatalogVersion=3;
}
cfg={...cfg,selected:Array.isArray(cfg.selected)?cfg.selected:[],order:Array.isArray(cfg.order)?cfg.order:[],sources:migratedSources};
const save=()=>localStorage.setItem(KEY,JSON.stringify(cfg));
save();
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const style=el('style');style.textContent='.market-config-panel{background:linear-gradient(145deg,var(--panel),#102035);border:1px solid var(--line);border-radius:15px;padding:15px;margin:0 0 14px}.mc-groups{display:grid;gap:10px}.mc-group{border:1px solid var(--line);background:var(--panel2);border-radius:10px;padding:10px}.mc-group h3{font-size:.82rem;color:var(--gold);margin:0 0 8px}.mc-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.mc-item{display:flex;align-items:center;gap:7px;padding:7px;background:#0b1a2a;border-radius:7px;font-size:.75rem}.mc-item input,.mc-source input{accent-color:var(--gold);width:17px;height:17px;flex:0 0 auto}.mc-source{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:start;background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:34px 10px 10px;margin:7px 0;position:relative}.mc-source small{display:block;color:var(--muted);font-size:.68rem;overflow-wrap:anywhere}.mc-source-info{min-width:0}.mc-source-title{display:flex;align-items:center;justify-content:flex-start;gap:7px;flex-wrap:wrap}.mc-source-rank{display:inline-flex;gap:3px;direction:ltr}.mc-source-actions{display:flex;gap:3px;position:absolute;top:6px;left:7px}.mc-source-actions button{padding:4px 7px;font-size:.7rem}.mc-source button{border:1px solid var(--line);border-radius:7px;background:#10243a;color:var(--text)}.mc-source-rank button{min-width:27px}.mc-tools{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.mc-tools button{border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:var(--panel2);color:var(--text)}.mc-tools .primary{background:var(--gold);color:#172333}.mc-form{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.mc-form input,.mc-form select{width:100%;padding:9px;background:#0b1a2a;color:var(--text);border:1px solid var(--line);border-radius:8px}.mc-form .wide{grid-column:1/-1}.mc-product-picker{padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--panel2);margin-bottom:8px}.mc-product-picker select{width:100%;padding:12px;border-radius:9px;background:#0b1a2a;color:var(--text);border:1px solid var(--line);font-size:.9rem}.mc-product-details{border:1px solid var(--line);border-radius:11px;padding:12px;background:var(--panel2);margin:0 0 10px}.mc-product-details.is-empty{opacity:.78}.mc-product-details-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.mc-product-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mc-product-details .field{min-width:0}.mc-product-details .field input{width:100%}.mc-product-picker input[type=search]{margin:5px 0 8px;background:var(--panel);font-size:.86rem}.mc-product-picker select{margin-top:3px}.mc-advanced{border:1px solid var(--line);border-radius:9px;padding:9px 11px;margin-top:10px}.mc-advanced summary{cursor:pointer;font-size:.76rem;color:var(--muted);font-weight:700}.mc-advanced[open] summary{margin-bottom:10px}.mc-price-preview{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;margin-top:12px;border:1px solid var(--line);border-radius:10px;background:linear-gradient(110deg,var(--panel),var(--panel2))}.mc-price-preview b{display:block;font-size:.82rem}.mc-price-preview small{display:block;color:var(--muted);font-size:.68rem;margin-top:4px}.mc-price-preview strong{font-size:1.2rem;white-space:nowrap;color:var(--gold)}.mc-product-detail-grid .field.full{grid-column:1/-1}.mc-muted{color:var(--muted);font-size:.72rem;line-height:1.8}.mc-pill{font-size:.7rem;color:var(--gold);border:1px solid var(--line);border-radius:18px;padding:3px 8px}@media(max-width:560px){.mc-product-detail-grid{grid-template-columns:1fr}.mc-items{grid-template-columns:1fr}.mc-source{grid-template-columns:auto minmax(0,1fr)}.mc-source-actions{grid-column:2}.mc-form{grid-template-columns:1fr}.mc-form .wide{grid-column:auto}}';
style.textContent+=".mc-dashboard-watch-toggle{border:1px solid var(--line);border-radius:8px;padding:5px 8px;background:var(--panel);color:var(--gold);font:inherit;font-size:.67rem;font-weight:800;white-space:nowrap}.mc-dashboard-watch{margin-top:10px;padding-top:8px;border-top:1px dashed var(--line)}.mc-dashboard-watch-title{font-size:.72rem;font-weight:800;color:var(--gold);margin-bottom:6px}.mc-dashboard-card{cursor:pointer}.mc-dashboard-card button{cursor:pointer}.mc-dashboard-watch-action{border:1px solid var(--line);border-radius:7px;padding:5px 7px;background:var(--panel);color:var(--text);font:inherit;font-size:.64rem}.mc-dashboard-watch-action.danger{color:#d85b5b}.mc-dashboard-record-foot{justify-content:flex-start}.mc-dashboard-record-foot small{width:100%}.mc-dashboard-record-foot{gap:5px}.mc-dashboard-card.is-watch-open{border-color:var(--gold)}.mc-dashboard-picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mc-dashboard-card{min-width:0;border:1px solid var(--line);border-radius:13px;padding:12px;background:linear-gradient(145deg,var(--panel2),var(--panel));box-shadow:inset 0 1px #ffffff08}.mc-dashboard-card,.mc-source{position:relative;transition:transform .16s ease,box-shadow .16s ease,opacity .16s ease;touch-action:pan-y;user-select:none}.mc-dashboard-card.is-hold-ready,.mc-source.is-hold-ready{outline:2px solid var(--gold);outline-offset:2px}.mc-dashboard-card.is-floating,.mc-source.is-floating{z-index:9999;opacity:.96;box-shadow:0 18px 42px #0008,0 0 0 2px var(--gold);transform:scale(1.025);cursor:grabbing;touch-action:none}.mc-reorder-placeholder{border:2px dashed var(--gold);border-radius:12px;background:#d9b66c18;box-sizing:border-box}.mc-dashboard-card{cursor:grab}.mc-dashboard-card:active,.mc-source:active{cursor:grabbing}.mc-dashboard-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 0 9px 76px;border-bottom:1px solid var(--line);position:relative}.mc-dashboard-card-actions{position:absolute;left:0;top:0;display:flex;align-items:center;gap:5px}.mc-dashboard-icon-action{width:28px;height:28px;padding:0;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font-size:1rem;line-height:1;cursor:pointer}.mc-dashboard-icon-action.danger{color:#d85b5b}.mc-dashboard-card-head b{font-size:.88rem;line-height:1.7}.mc-dashboard-no-price{font-size:.75rem;color:var(--muted);line-height:1.9;padding:12px 0}.mc-dashboard-action,.mc-dashboard-check{border:1px solid var(--line);border-radius:8px;padding:7px 10px;background:var(--panel);color:var(--gold);font:inherit;font-size:.72rem;font-weight:700}.mc-dashboard-record{padding:10px 0;border-bottom:1px dashed var(--line)}.mc-dashboard-record:last-child{border-bottom:0;padding-bottom:0}.mc-dashboard-record-meta,.mc-dashboard-record-foot,.mc-dashboard-price-line{display:flex;align-items:center;justify-content:space-between;gap:8px}.mc-dashboard-record-meta{font-size:.7rem;color:var(--muted);line-height:1.8}.mc-dashboard-record-meta span{min-width:0;overflow-wrap:anywhere}.mc-dashboard-record-meta small,.mc-dashboard-record-foot small{font-size:.65rem;color:var(--muted)}.mc-dashboard-price-line{margin:7px 0}.mc-dashboard-price-line strong{font-size:1.05rem;color:var(--text);overflow-wrap:anywhere}.mc-dashboard-change{font-size:.7rem;font-weight:800;white-space:nowrap}.mc-dashboard-change.up{color:#e76f51}.mc-dashboard-change.down{color:#39b98b}.mc-dashboard-change.neutral{color:var(--muted)}.mc-dashboard-record-foot{flex-wrap:wrap}.mc-dashboard-empty{grid-column:1/-1;color:var(--muted);font-size:.8rem;padding:12px}@media(max-width:600px){.mc-dashboard-picks{grid-template-columns:1fr}.mc-dashboard-card{padding:11px}}";document.head.append(style);
function makePanel(id,title,desc){const p=el('section','market-config-panel');p.id=id;const head=el('div','panel-head');head.append(el('h2','',title),el('span','mc-pill','قابل تنظیم'));p.append(head,el('p','mc-muted',desc));return p}
const main=document.querySelector('main.wrap');
const sourcePanel=document.getElementById('sourcePanel');
const catalog=el('section','market-config-panel');catalog.id='mcProductCatalog';
const catalogGroups=el('div','mc-groups');catalog.append(catalogGroups);

 const tools=el('div','mc-tools');const all=el('button','','انتخاب همه');all.type='button';all.onclick=()=>{cfg.selected=products.flatMap(x=>x[1].map(y=>y[0]));save();renderProducts();renderDashboardPicks()};const none=el('button','','پاک‌کردن انتخاب‌ها');none.type='button';none.onclick=()=>{cfg.selected=[];save();renderProducts();renderDashboardPicks()};tools.append(all,none);catalog.append(tools);
function renderProducts(){catalogGroups.replaceChildren();for(const [group,items] of products){const box=el('div','mc-group');box.append(el('h3','',group));const list=el('div','mc-items');for(const [id,name] of items){const label=el('label','mc-item');const input=el('input');input.type='checkbox';input.checked=cfg.selected.includes(id);input.dataset.catalogId=id;input.addEventListener('change',()=>{cfg.selected=input.checked?[...new Set([...cfg.selected,id])]:cfg.selected.filter(x=>x!==id);save();renderDashboardPicks()});label.append(input,el('span','',name));list.append(label)}box.append(list);catalogGroups.append(box)}}
const picks=makePanel('mcDashboardPicks','سبد منتخب من','هر محصول منتخب، کارت مستقل خود را در داشبورد دارد؛ قیمت و مشخصات از دیده‌بان همین دستگاه خوانده می‌شود.');const picksList=el('div','mc-dashboard-picks');picks.append(picksList);
const productCatalogMap=new Map(products.flatMap(g=>g[1].map(([id,name])=>[id,{id,name,group:g[0]}])));
function readWatchlist(){try{return JSON.parse(localStorage.getItem('fooladban.v1')||'{}').products||[]}catch{return[]}}
function money(value,currency){return Number(value).toLocaleString('fa-IR',{maximumFractionDigits:2})+' '+(currency||'') }
 function formatCheckedAt(value){const d=new Date(value);const p=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).formatToParts(d);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${v.day}-${v.month}-${v.year}، ${v.hour}:${v.minute}`}
function renderDashboardPicks(){
 const activeForm=document.getElementById('addPanel'),activeFormCard=activeForm?.closest('.mc-dashboard-card')?.dataset.catalogId||'';if(activeFormCard)activeForm.remove();
 const watchlist=readWatchlist(),selected=cfg.selected.map(id=>productCatalogMap.get(id)).filter(Boolean).sort((a,b)=>{const ai=cfg.order.indexOf(a.id),bi=cfg.order.indexOf(b.id);return (ai<0?Number.MAX_SAFE_INTEGER:ai)-(bi<0?Number.MAX_SAFE_INTEGER:bi)});
 picksList.replaceChildren();picks.querySelector('.mc-pill').textContent=selected.length.toLocaleString('fa-IR')+' محصول';
 if(!selected.length){picksList.append(el('div','mc-dashboard-empty','هنوز محصولی به سبد منتخب اضافه نشده است. از بخش «محصولات» اقلام موردنظر را انتخاب کنید.'));return}
 for(const item of selected){
  const card=el('article','mc-dashboard-card');card.dataset.catalogId=item.id;
  const head=el('div','mc-dashboard-card-head');const title=el('b','',item.name);const actions=el('div','mc-dashboard-card-actions');const edit=el('button','mc-dashboard-icon-action','✎');edit.type='button';edit.title='ویرایش مشخصات محصول';edit.setAttribute('aria-label','ویرایش مشخصات محصول');edit.dataset.editCatalog=item.id;const del=el('button','mc-dashboard-icon-action danger','🗑️');del.type='button';del.title='حذف از سبد منتخب';del.setAttribute('aria-label','حذف از سبد منتخب');del.dataset.removeCatalog=item.id;actions.append(edit,del);const watchToggle=el('button','mc-dashboard-watch-toggle','رصد محصول');watchToggle.type='button';watchToggle.dataset.toggleWatch='1';head.append(title,watchToggle);head.prepend(actions);card.append(head);
  const records=watchlist.filter(p=>p.catalogId===item.id).sort((a,b)=>(b.checkedAt||0)-(a.checkedAt||0));
  const watch=el('div','mc-dashboard-watch');watch.hidden=true;const watchTitle=el('div','mc-dashboard-watch-title','رصد محصول · '+records.length.toLocaleString('fa-IR')+' مرجع');watch.append(watchTitle);
  if(!records.length){
   watch.append(el('div','mc-dashboard-no-price','هنوز مشخصات و مرجع قیمت این محصول در دیده‌بان ثبت نشده است.'));
   const action=el('button','mc-dashboard-action','＋ تکمیل مشخصات و ثبت قیمت');action.type='button';action.dataset.openProducts='1';watch.append(action);
  }else{
   for(const p of records){
    const last=p.history?.at(-1),prev=p.history?.at(-2),change=last&&prev&&Number(prev.price)?(Number(last.price)-Number(prev.price))/Number(prev.price)*100:null;
    const detail=el('div','mc-dashboard-record');
    const meta=[p.productGrade,p.productSize,p.productManufacturer,p.market,p.delivery].filter(Boolean).join(' · ')||p.specification||p.group||'مشخصات ثبت نشده';
    const top=el('div','mc-dashboard-record-meta');top.append(el('span','',meta),el('small','',p.sourceName||'مرجع ثبت‌شده'));detail.append(top);
    const priceLine=el('div','mc-dashboard-price-line');priceLine.append(el('strong','',last?money(last.price,p.currency):'—'));
    const status=last?((change===null?'بدون سابقه قبلی':(change>0?'▲ ':change<0?'▼ ':'')+Math.abs(change).toLocaleString('fa-IR',{maximumFractionDigits:2})+'٪')):(p.error?'دریافت ناموفق':'در انتظار اولین قیمت');
    priceLine.append(el('span','mc-dashboard-change '+(change>0?'up':change<0?'down':'neutral'),status));detail.append(priceLine);
    const foot=el('div','mc-dashboard-record-foot');foot.append(el('small','',p.checkedAt?'آخرین بررسی: '+formatCheckedAt(p.checkedAt):'قیمت هنوز دریافت نشده'));
    for(const [label,actionName] of [['نمودار','chart'],['ویرایش','edit'],['بررسی قیمت','refresh'],['منبع','source'],['حذف','delete']]){const b=el('button',actionName==='delete'?'mc-dashboard-watch-action danger':'mc-dashboard-watch-action',label);b.type='button';b.dataset.watchAction=actionName;b.dataset.watchId=p.id;foot.append(b)}
    detail.append(foot);watch.append(detail);
   }
  }
  card.append(watch);if(activeFormCard===item.id&&activeForm){card.append(activeForm);activeForm.style.display=''}picksList.append(card);
 }
}

// جابه‌جایی کارت با نگه‌داشتن ممتد روی خود باکس؛ بدون دکمه مستقل.
function enableHoldReorder(container,selector,{items,persist,scope=()=>true}){
 let pending=null,drag=null,suppressClick=false;
 const clearPending=()=>{if(pending){clearTimeout(pending.timer);pending.item.classList.remove('is-hold-ready');pending=null}};
 const finish=(e)=>{
  if(!drag||e&&e.pointerId!==undefined&&drag.pointerId!==e.pointerId)return;
  const d=drag;drag=null;d.item.classList.remove('is-floating');d.item.style.cssText=d.originalStyle;
  d.placeholder.replaceWith(d.item);suppressClick=true;setTimeout(()=>suppressClick=false,350);persist(d.item);
 };
 container.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('button,input,select,textarea,a,label,summary,[contenteditable="true"],#addPanel'))return;
  const item=e.target.closest(selector);if(!item||!container.contains(item)||!scope(item))return;
  clearPending();const p={item,pointerId:e.pointerId,x:e.clientX,y:e.clientY};pending=p;
  p.timer=setTimeout(()=>{
   if(pending!==p)return;pending=null;
   const rect=item.getBoundingClientRect(),placeholder=document.createElement('div');
   placeholder.className='mc-reorder-placeholder';placeholder.style.height=rect.height+'px';placeholder.style.width=rect.width+'px';
   const originalStyle=item.style.cssText;
   item.before(placeholder);item.classList.remove('is-hold-ready');item.classList.add('is-floating');
   item.style.position='fixed';item.style.left=rect.left+'px';item.style.top=rect.top+'px';item.style.width=rect.width+'px';item.style.margin='0';item.style.pointerEvents='none';
   drag={item,placeholder,pointerId:e.pointerId,offsetX:p.x-rect.left,offsetY:p.y-rect.top,originalStyle};
   try{item.setPointerCapture(e.pointerId)}catch{}
  },480);
  item.classList.add('is-hold-ready');
 });
 container.addEventListener('pointermove',e=>{
  if(pending&&pending.pointerId===e.pointerId&&Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>9)clearPending();
  if(!drag||drag.pointerId!==e.pointerId)return;
  e.preventDefault();drag.item.style.left=(e.clientX-drag.offsetX)+'px';drag.item.style.top=(e.clientY-drag.offsetY)+'px';
  const candidates=items().filter(x=>x!==drag.item&&scope(x,drag.item));
  let nearest=null,best=Infinity;
  for(const candidate of candidates){const r=candidate.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,d=Math.hypot(e.clientX-cx,e.clientY-cy);if(d<best){best=d;nearest={candidate,r,cx,cy}}}
  if(!nearest){container.insertBefore(drag.placeholder,container.querySelector(selector));return}
  const before=e.clientY<nearest.cy||(Math.abs(e.clientY-nearest.cy)<nearest.r.height*.25&&e.clientX<nearest.cx);
  nearest.candidate[before?'before':'after'](drag.placeholder);
 });
 container.addEventListener('pointerup',e=>{if(pending&&pending.pointerId===e.pointerId)clearPending();finish(e)});
 container.addEventListener('pointercancel',e=>{clearPending();finish(e)});
 container.addEventListener('lostpointercapture',e=>{if(drag&&drag.pointerId===e.pointerId)finish(e)});
 container.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation()}},true);
}
function saveCardOrder(){cfg.order=[...picksList.querySelectorAll('.mc-dashboard-card')].map(card=>card.dataset.catalogId);save()}
enableHoldReorder(picksList,'.mc-dashboard-card',{items:()=>[...picksList.querySelectorAll('.mc-dashboard-card')],persist:saveCardOrder});
function showProductFormInCard(card){const panel=document.getElementById('addPanel');if(!panel||!card)return;card.append(panel);panel.style.display='';document.querySelector('[data-layer-target="dashboard"]')?.click();panel.scrollIntoView({behavior:'smooth',block:'nearest'})}
picksList.addEventListener('click',e=>{const toggle=e.target.closest('[data-toggle-watch]');if(toggle){const card=toggle.closest('.mc-dashboard-card');card?.classList.toggle('is-watch-open');const watch=card?.querySelector('.mc-dashboard-watch');if(watch)watch.hidden=!card.classList.contains('is-watch-open');return}const watchAction=e.target.closest('[data-watch-action]');if(watchAction){const id=watchAction.dataset.watchId,kind=watchAction.dataset.watchAction,target=document.querySelector('#products [data-'+kind+'="'+id+'"]'),card=watchAction.closest('[data-catalog-id]');if(target){target.click();if(kind==='edit'&&card)setTimeout(()=>showProductFormInCard(card),25);if(kind==='delete')setTimeout(renderDashboardPicks,0)}return}const remove=e.target.closest('[data-remove-catalog]'),edit=e.target.closest('[data-edit-catalog]'),open=e.target.closest('[data-open-products]'),refresh=e.target.closest('[data-refresh-product]');if(remove){const id=remove.dataset.removeCatalog;if(window.confirm('این محصول از سبد منتخب داشبورد حذف شود؟ اطلاعات قیمت و سوابق ثبت‌شده پاک نخواهد شد.')){cfg.selected=cfg.selected.filter(x=>x!==id);save();renderProducts();renderDashboardPicks()}return}if(edit){const id=edit.dataset.editCatalog,card=edit.closest('[data-catalog-id]'),records=readWatchlist().filter(p=>p.catalogId===id).sort((a,b)=>(b.checkedAt||0)-(a.checkedAt||0));if(records.length){const target=document.querySelector('#products [data-edit="'+records[0].id+'"]');if(target){target.click();setTimeout(()=>showProductFormInCard(card),20);return}}if(productMap.has(id)){catalogSelect.value=id;catalogSelect.dispatchEvent(new Event('change'))}showProductFormInCard(card);return}if(open){const card=open.closest('[data-catalog-id]'),productId=card?.dataset.catalogId;if(productId&&productMap.has(productId)){catalogSelect.value=productId;catalogSelect.dispatchEvent(new Event('change'))}showProductFormInCard(card);return}if(refresh){document.querySelector('#products [data-refresh="'+refresh.dataset.refreshProduct+'"]')?.click();return}const card=e.target.closest('.mc-dashboard-card');if(card&&!e.target.closest('button,input,select,textarea,label,details,#addPanel')){card.classList.toggle('is-watch-open');const watch=card.querySelector('.mc-dashboard-watch');if(watch)watch.hidden=!card.classList.contains('is-watch-open')}});

const registry=el('section','market-config-panel');registry.id='mcSourceRegistry';
const sourceList=el('div','');registry.append(sourceList);
const form=el('div','mc-form');const name=el('input');name.placeholder='نام مرجع جدید';const market=el('select');for(const [v,t] of Object.entries(labels)){const o=el('option','',t);o.value=v;market.append(o)}const url=el('input');url.type='url';url.placeholder='https://example.com';url.className='wide';const add=el('button','primary wide','＋ افزودن مرجع');add.type='button';add.onclick=()=>{const n=name.value.trim(),u=url.value.trim();if(!n){name.focus();return}if(u&&!/^https:\/\//i.test(u)){url.setCustomValidity('نشانی باید HTTPS باشد');url.reportValidity();return}url.setCustomValidity('');const m=market.value;const rank=cfg.sources.filter(x=>x.market===m).length+1;cfg.sources.push({id:'custom-'+(crypto.randomUUID?crypto.randomUUID():Date.now()),name:n,market:m,url:u,enabled:true,priority:rank,type:'مرجع سفارشی'});save();name.value='';url.value='';renderSources();renderSourceSelect()};
form.append(name,market,url,add);const addSourcePanel=el('section','market-config-panel');addSourcePanel.id='mcAddSourcePanel';const addSourceHead=el('div','panel-head');addSourceHead.append(el('h2','','افزودن مرجع قیمت'));addSourcePanel.append(addSourceHead,el('p','mc-muted','مرجع جدید را با نام، بازار و نشانی وب ثبت کنید.'),form);registry.after(addSourcePanel);
function renderSources(){sourceList.replaceChildren();const markets=[...new Set(cfg.sources.map(x=>x.market))];for(const m of markets){const title=el('h3','',labels[m]||m);title.style.cssText='font-size:.8rem;color:var(--gold);margin:12px 0 5px';sourceList.append(title);const group=cfg.sources.filter(x=>x.market===m).sort((a,b)=>a.priority-b.priority);for(const item of group){const row=el('div','mc-source');row.dataset.market=item.market;row.dataset.sourceId=item.id;const active=el('input');active.type='checkbox';active.checked=item.enabled;active.title='فعال‌سازی مرجع';active.addEventListener('change',()=>{item.enabled=active.checked;save();renderSourceSelect()});const info=el('div','mc-source-info');const title=el('div','mc-source-title');title.append(el('b','',item.name));info.append(title,el('small','',(item.type||'مرجع')+' · اولویت '+item.priority+(item.url?' · '+item.url:' · آدرس هنوز ثبت نشده')));const actions=el('div','mc-source-actions');const edit=el('button','','✎');edit.type='button';edit.title='ویرایش مشخصات مرجع';edit.setAttribute('aria-label','ویرایش '+item.name);edit.onclick=()=>editSource(item);const del=el('button','','🗑️');del.type='button';del.title='حذف مرجع';del.setAttribute('aria-label','حذف مرجع '+item.name);del.onclick=()=>{if(!window.confirm('مرجع «'+item.name+'» حذف شود؟'))return;cfg.sources=cfg.sources.filter(x=>x.id!==item.id);normalize(m);save();renderSources();renderSourceSelect()};actions.append(edit,del);row.append(active,info,actions);sourceList.append(row)}}}
enableHoldReorder(sourceList,'.mc-source',{items:()=>[...sourceList.querySelectorAll('.mc-source')],scope:(item,dragged)=>item.dataset.market===dragged.dataset.market,persist:item=>saveSourceOrder(item.dataset.market)});
function editSource(item){
 const nextName=window.prompt('نام مرجع قیمت:',item.name);if(nextName===null)return;
 const cleanName=nextName.trim();if(!cleanName){window.alert('نام مرجع نمی‌تواند خالی باشد.');return}
 const nextUrl=window.prompt('نشانی وب مرجع (HTTPS):',item.url||'');if(nextUrl===null)return;
 const cleanUrl=nextUrl.trim();if(cleanUrl&&!/^https:\/\//i.test(cleanUrl)){window.alert('نشانی مرجع باید با HTTPS آغاز شود.');return}
 const nextType=window.prompt('توضیح / نوع مرجع:',item.type||'مرجع قیمت');if(nextType===null)return;
 item.name=cleanName;item.url=cleanUrl;item.type=nextType.trim()||'مرجع قیمت';save();renderSources();renderSourceSelect();
}
function normalize(m){cfg.sources.filter(x=>x.market===m).sort((a,b)=>a.priority-b.priority).forEach((x,i)=>x.priority=i+1)}
function saveSourceOrder(m){const ids=[...sourceList.querySelectorAll('.mc-source')].filter(x=>x.dataset.market===m).map(x=>x.dataset.sourceId);ids.forEach((id,i)=>{const source=cfg.sources.find(x=>x.id===id);if(source)source.priority=i+1});normalize(m);save();renderSources();renderSourceSelect()}
const select=el('select');select.id='pSourceRegistry';select.required=true;select.innerHTML='<option value="">انتخاب مرجع قیمت</option>';
const productMap=new Map(products.flatMap(([g,items])=>items.map(([id,n])=>[id,{id,name:n,group:g}])));
const productForm=document.getElementById('productForm');
const catalogSelect=el('select');catalogSelect.id='pCatalogProduct';catalogSelect.required=true;catalogSelect.innerHTML='<option value="">انتخاب محصول استاندارد</option>';
for(const [g,items] of products){const og=el('optgroup');og.label=g;for(const [id,n] of items){const o=el('option','',n);o.value=id;og.append(o)}catalogSelect.append(og)}
const search=el('input');search.type='search';search.id='pCatalogSearch';search.placeholder='جست‌وجوی سریع: میلگرد، ورق گرم، گندله…';
const picker=el('div','field full mc-product-picker');picker.append(el('label','','۱. انتخاب محصول'),search,catalogSelect,el('small','mc-muted','با انتخاب محصول، فرم مشخصات همین‌جا باز می‌شود.'));
search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase('fa');let first='';for(const o of catalogSelect.options){if(!o.value)continue;const yes=o.text.toLocaleLowerCase('fa').includes(q)||o.parentElement.label.toLocaleLowerCase('fa').includes(q);o.hidden=!!q&&!yes;if(yes&&!first)first=o.value}if(q&&first&&(!catalogSelect.value||catalogSelect.selectedOptions[0]?.hidden)){catalogSelect.value=first;catalogSelect.dispatchEvent(new Event('change'))}});
const detailBox=el('div','field full mc-product-details is-empty');detailBox.id='mcProductDetails';
const head=el('div','mc-product-details-head');const detailBadge=el('span','mc-pill','ابتدا محصول را انتخاب کنید');head.append(el('b','','۲. مشخصات محصول و بازار'),detailBadge);detailBox.append(head,picker);
const grid=el('div','mc-product-detail-grid');
function moveField(id,label,wide=false){const n=document.getElementById(id),w=n?.parentElement;if(!n||!w)return null;const l=w.querySelector('label');if(l)l.textContent=label;if(wide)w.classList.add('full');grid.append(w);return w}
const nameField=moveField('pName','عنوان در دیده‌بان',true),groupField=moveField('pGroup','گروه'),specField=moveField('pSpecification','مشخصات',true),deliveryField=moveField('pDelivery','محل تحویل');
function choice(id,placeholder,options){
 const s=el('select');s.id=id;s.append(el('option','','انتخاب '+placeholder));s.options[0].value='';
 for(const value of options){const option=el('option','',value);option.value=value;s.append(option);}
 const custom=el('input');custom.type='text';custom.placeholder='گزینه دیگر را وارد کنید';custom.className='mc-custom-choice hidden';custom.setAttribute('aria-label',placeholder+' سفارشی');
 const opt=el('option','','＋ ورود گزینه دلخواه');opt.value='__custom__';s.append(opt);
 s.addEventListener('change',()=>{const isCustom=s.value==='__custom__';custom.classList.toggle('hidden',!isCustom);custom.required=isCustom;if(isCustom){custom.value='';custom.focus()}});
 custom.addEventListener('input',()=>{const v=custom.value.trim();let o=[...s.options].find(x=>x.dataset.custom==='1');if(!o){o=el('option');o.dataset.custom='1';s.append(o)}o.value=v;o.textContent=v||'گزینه دلخواه';if(v){s.value=v;custom.required=false}});
 s.setChoiceValue=v=>{const value=String(v??'');if(!value){s.value='';custom.classList.add('hidden');return}let o=[...s.options].find(x=>x.value===value);if(!o){o=el('option');o.value=value;o.textContent=value;o.dataset.custom='1';s.insertBefore(o,opt)}s.value=value;custom.classList.add('hidden')};
 return {select:s,custom};
}
function addChoice(label,control){const w=el('div','field');w.append(el('label','',label),control.select,control.custom);grid.append(w)}
const gradeOptions={
 'rebar':['A1','A2','A3','A4','S240','S340','S400','S500'],
 'alloy-rebar':['40Cr','42CrMo4','34CrNiMo6','CK45'],
 'hot-rolled':['ST12','ST13','ST14','ST37','ST44','ST52','S235JR','S275JR','S355JR'],
 'cold-rolled':['DC01','DC03','DC04','SPCC','SPCD'],
 'galvanized':['DX51D+Z','DX52D+Z','DX53D+Z','S220GD','S350GD'],
 'slab':['普通ی','کربنی','کم‌آلیاژ','میکروآلیاژی'],
 'billet-bloom':['3SP','5SP','SAE1006','SAE1008','CK45'],
 'iron-concentrate':['Fe 65%','Fe 66%','Fe 67%','Fe 68%','Fe 69%'],
 'pellet':['Fe 65%','Fe 66%','Fe 67%','Fe 68%'],
 'sponge-iron':['Fe  DRI 90%','Fe DRI 91%','Fe DRI 92%']
};
const sizeOptions={
 'rebar':['۸','۱۰','۱۲','۱۴','۱۶','۱۸','۲۰','۲۲','۲۵','۲۸','۳۲','۳۶','۴۰'],
 'alloy-rebar':['۱۲','۱۴','۱۶','۱۸','۲۰','۲۵','۳۰','۳۵','۴۰'],
 'hot-rolled':['۱.۵','۲','۲.۵','۳','۴','۵','۶','۸','۱۰','۱۲','۱۵','۲۰','۲۵'],
 'cold-rolled':['۰.۳','۰.۴','۰.۵','۰.۶','۰.۷','۰.۸','۱','۱.۲','۱.۵','۲'],
 'galvanized':['۰.۳','۰.۴','۰.۵','۰.۶','۰.۷','۰.۸','۱','۱.۲','۱.۵','۲'],
 'billet-bloom':['۱۰۰×۱۰۰','۱۲۰×۱۲۰','۱۲۵×۱۲۵','۱۳۰×۱۳۰','۱۵۰×۱۵۰'],
 'slab':['عرض ۱۰۰۰','عرض ۱۲۵۰','عرض ۱۵۰۰','عرض ۲۰۰۰'],
 'iron-concentrate':['دانه‌بندی زیر ۱۰۰ میکرون','دانه‌بندی زیر ۱۵۰ میکرون'],
 'pellet':['قطر ۹–۱۶ میلی‌متر']
};
const makerOptions={
 'rebar':['ذوب‌آهن اصفهان','فولاد مبارکه','فولاد خراسان','فولاد کویر','ظفر بناب','آذر فولاد امین','فولاد کاوه تیکمه‌داش'],
 'hot-rolled':['فولاد مبارکه','فولاد اکسین خوزستان','فولاد گیلان','فولاد کاویان'],
 'cold-rolled':['فولاد مبارکه','فولاد غرب آسیا','فولاد هفت الماس'],
 'galvanized':['فولاد مبارکه','امیرکبیر کاشان','ورق خودرو چهارمحال','هفت الماس'],
 'billet-bloom':['فولاد خوزستان','ذوب‌آهن اصفهان','فولاد کاوه جنوب کیش','فولاد خراسان','فولاد آلیاژی ایران'],
 'slab':['فولاد مبارکه','فولاد خوزستان','فولاد هرمزگان','فولاد کاویان'],
 'sponge-iron':['فولاد مبارکه','فولاد خوزستان','فولاد غدیر ایرانیان','میدکو']
};
const gradeChoice=choice('pGrade','گرید / کیفیت',gradeOptions['rebar']);
const sizeChoice=choice('pSize','سایز / ابعاد',sizeOptions['rebar']);
const makerChoice=choice('pManufacturer','تولیدکننده / برند',makerOptions['rebar']);
const grade=gradeChoice.select,size=sizeChoice.select,maker=makerChoice.select;
addChoice('گرید / کیفیت',gradeChoice);addChoice('سایز / ابعاد',sizeChoice);addChoice('تولیدکننده / برند',makerChoice);
const titleInput=nameField?.querySelector('#pName');
const titleChoice=choice('pName','عنوان در دیده‌بان',products.flatMap(g=>g[1].map(p=>p[1])));
if(titleInput){titleInput.replaceWith(titleChoice.select);titleChoice.select.required=true;titleChoice.select.disabled=true;titleChoice.select.setAttribute('aria-readonly','true');titleChoice.select.title='نام محصول از فهرست محصولات انتخاب‌شده تثبیت می‌شود';nameField.append(titleChoice.custom)}
function setProductChoices(id){
 const g=gradeOptions[id]||['استاندارد عمومی','گرید تجاری','گرید سفارشی'];
 const z=sizeOptions[id]||['استاندارد','سایز متداول','ابعاد سفارشی'];
 const m=makerOptions[id]||['تولیدکننده داخلی','وارداتی / خارجی'];
 const fill=(s,values)=>{const keep=s.value;while(s.options.length>2)s.remove(1);for(const v of values){const o=el('option','',v);o.value=v;s.insertBefore(o,s.options[s.options.length-1])}s.setChoiceValue(keep)};
 fill(grade,g);fill(size,z);fill(maker,m);
}

const marketField=moveField('pMarket','بازار ارزیابی'),taxField=moveField('pTaxBasis','مبنای مالیات'),currencyField=moveField('pCurrency','ارز'),unitField=moveField('pMeasureUnit','واحد'),sourceKindField=moveField('pSourceKind','نوع منبع'),keyField=moveField('pProductKey','کلید کالا');
const sourceField=el('div','field full');sourceField.append(el('label','','مرجع قیمت'),select);const sourceInfo=el('small','mc-muted','');sourceField.append(sourceInfo);grid.append(sourceField);
const urlField=moveField('pUrl','لینک دقیق صفحه قیمت محصول',true);if(urlField){const u=urlField.querySelector('input');u.placeholder='https://site.com/product/price';u.required=true;urlField.append(el('small','mc-muted','صفحه اصلی سایت کافی نیست؛ لینک همان صفحه‌ای را وارد کنید که قیمت این محصول را نشان می‌دهد.'))}
detailBox.append(grid);
const advanced=document.createElement('details');advanced.className='mc-advanced';advanced.append(el('summary','','تنظیمات تخصصی استخراج و هشدار (اختیاری)'));const advGrid=el('div','mc-product-detail-grid');advanced.append(advGrid);
for(const id of ['pMode','selectorField','regexField','jsonField','pThreshold','pNote']){const n=document.getElementById(id);if(n){const w=id.endsWith('Field')?n:n.parentElement;if(w)advGrid.append(w)}}
detailBox.append(advanced);
const preview=el('div','mc-price-preview');preview.id='mcQuickPrice';detailBox.append(preview);
const key=keyField?.querySelector('#pProductKey');if(key){key.required=false;key.removeAttribute('required');key.readOnly=true;key.closest('.field')?.classList.add('hidden')}groupField?.classList.add('hidden');specField?.classList.add('hidden');sourceKindField?.classList.add('hidden');
if(productForm){const fg=productForm.querySelector('.formgrid');if(fg)fg.replaceChildren(detailBox)}
const deliveryFieldNode=document.getElementById('pDelivery');
const deliveryChoice=choice('pDelivery','محل تحویل',['درب کارخانه','انبار تهران','انبار اصفهان','انبار اهواز','انبار بندرعباس','تحویل در محل مشتری','FOB بندرعباس','CFR','CIF','EXW','FCA','DAP','DDP']);
if(deliveryFieldNode){deliveryFieldNode.replaceWith(deliveryChoice.select);deliveryField?.append(deliveryChoice.custom)}
function renderDeliveryOptions(){const m=marketSelect?.value||'ایران';const opts=m==='ایران'?['درب کارخانه','انبار تهران','انبار اصفهان','انبار اهواز','انبار بندرعباس','تحویل در محل مشتری','بورس کالا / محل تحویل اعلامی']:['FOB','CFR','CIF','EXW','FCA','DAP','DDP','تحویل بندر مقصد','تحویل انبار مقصد'];const old=deliveryChoice.select.value;while(deliveryChoice.select.options.length>2)deliveryChoice.select.remove(1);for(const v of opts){const o=el('option','',v);o.value=v;deliveryChoice.select.insertBefore(o,deliveryChoice.select.options[deliveryChoice.select.options.length-1])}deliveryChoice.select.setChoiceValue(old)}
const marketSelect=document.getElementById('pMarket');
renderDeliveryOptions();
function renderSourceSelect(){const old=select.value,m=marketSelect?.value==='ایران'?'iran':marketSelect?.value==='جهانی'?'global':({'چین':'china','اروپا':'europe','آمریکای شمالی':'north-america','ترکیه':'turkey','هند':'india','خاورمیانه':'middle-east','امارات':'middle-east','عمان':'middle-east','عربستان':'middle-east'}[marketSelect?.value]||'iran');select.replaceChildren(el('option','','انتخاب مرجع'));select.options[0].value='';for(const x of cfg.sources.filter(x=>x.enabled&&x.market===m).sort((a,b)=>a.priority-b.priority)){const o=el('option','',x.priority+' · '+x.name);o.value=x.id;select.append(o)}if(cfg.sources.some(x=>x.id===old&&x.enabled&&x.market===m))select.value=old;else if(select.options.length>1)select.selectedIndex=1;const src=cfg.sources.find(x=>x.id===select.value);sourceInfo.textContent=src?src.name+' · اولویت '+src.priority+' · '+(src.id==='tradingeconomics'?'صفحه شاخص در صورت پشتیبانی محصول خودکار تنظیم می‌شود.':'صفحه دقیق کالا لازم است.'):'برای این بازار مرجع فعالی ثبت نشده است.';applySourceProfile()}
function renderQuickPrice(){let all=[];try{all=JSON.parse(localStorage.getItem('fooladban.v1')||'{}').products||[]}catch{}const id=catalogSelect.value,m=marketSelect?.value||'ایران',g=grade.value.trim(),z=size.value.trim(),mk=maker.value.trim();const match=all.filter(p=>(!id||p.catalogId===id)&&p.market===m&&(p.productGrade||'')===g&&(p.productSize||'')===z&&(p.productManufacturer||'')===mk).sort((a,b)=>(b.checkedAt||0)-(a.checkedAt||0))[0],last=match?.history?.at(-1);preview.replaceChildren();const info=el('div');info.append(el('b','','آخرین قیمت ثبت‌شده'));info.append(el('small','',match?(match.sourceName||'مرجع انتخابی')+' · '+(last?new Date(last.time).toLocaleString('fa-IR'):'قیمت هنوز دریافت نشده'):'برای این محصول هنوز قیمت ثبت نشده است'));preview.append(info,el('strong','',last?Number(last.price).toLocaleString('fa-IR')+' '+(match.currency||'')+' / '+(match.measureUnit==='kg'?'کیلوگرم':'تن'):'—'))}
function syncProductSelection(){const p=productMap.get(catalogSelect.value);detailBox.classList.toggle('is-empty',!p);detailBadge.textContent=p?p.group:'ابتدا محصول را انتخاب کنید';if(p){titleChoice.select.setChoiceValue(p.name);titleChoice.select.disabled=true;titleChoice.select.setAttribute('aria-readonly','true');document.getElementById('pGroup').value=p.group;key.value=p.id;setProductChoices(p.id);grade.value='';size.value='';maker.value='';document.getElementById('pSpecification').value='';renderSourceSelect()}renderQuickPrice()}
catalogSelect.addEventListener('change',syncProductSelection);
[grade,size,maker].forEach(x=>x.addEventListener('change',()=>{document.getElementById('pSpecification').value=[grade.value,size.value,maker.value].filter(Boolean).join(' · ')}));
marketSelect?.addEventListener('change',()=>{renderDeliveryOptions();renderSourceSelect();document.getElementById('pCurrency').value=marketSelect.value==='ایران'?'IRT':'USD';document.getElementById('pMeasureUnit').value=marketSelect.value==='ایران'?'kg':'ton';document.getElementById('pUrl').value='';renderQuickPrice()});
function applySourceProfile(){const x=cfg.sources.find(v=>v.id===select.value);const input=document.getElementById('pUrl');if(!x||!input)return;const key=catalogSelect.value;const teMap={'hot-rolled':'hrc-steel','cold-rolled':'hrc-steel','iron-ore-lump':'iron-ore','iron-ore-fines':'iron-ore','iron-concentrate':'iron-ore','pellet':'iron-ore','scrap-steel':'scrap-steel','rebar':'steel','alloy-rebar':'steel','billet-bloom':'steel','alloy-billet-bloom':'steel','slab':'steel','sponge-iron':'steel','hbi':'steel','wire-rod':'steel','long-sections':'steel'};let target=x.url||'';if(x.id==='tradingeconomics'&&teMap[key]){target='https://fa.tradingeconomics.com/commodity/'+teMap[key];const ccy=teMap[key]==='steel'?'CNY':'USD';document.getElementById('pCurrency').value=ccy;document.getElementById('pMeasureUnit').value='ton';sourceInfo.textContent=teMap[key]==='steel'?'شاخص عمومی فولاد با واحد CNY/تن به‌صورت خودکار درج شد؛ این شاخص قیمت دقیق میلگرد/شمش/مقاطع نیست.':'صفحه شاخص متناسب با محصول با واحد '+ccy+'/تن به‌صورت خودکار درج شد؛ شاخص الزاماً قیمت فیزیکی تحویل‌شده نیست.'}else{sourceInfo.textContent=x.name+' · نشانی مرجع به‌صورت خودکار درج شد. اگر صفحه اختصاصی کالا را دارید، می‌توانید آن را جایگزین کنید؛ صفحه اصلی به‌تنهایی قیمت محصول را تأیید نمی‌کند.'}if(target)input.value=target;input.required=!!target;const k=document.getElementById('pSourceKind');if(k)k.value=x.id==='ime'?'ime':x.market==='iran'?'free_market':'other';}
select.addEventListener('change',applySourceProfile);
document.getElementById('pUrl')?.addEventListener('input',renderQuickPrice);
document.getElementById('products')?.addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(!b)return;setTimeout(()=>{try{const p=(JSON.parse(localStorage.getItem('fooladban.v1')||'{}').products||[]).find(x=>x.id===b.dataset.edit);if(!p)return;catalogSelect.value=p.catalogId||'';key.value=p.catalogId||'';if(catalogSelect.value)syncProductSelection();titleChoice.select.setChoiceValue(p.name||'');setProductChoices(p.catalogId||'');document.getElementById('pGroup').value=p.group||'سایر';marketSelect.value=p.market||'ایران';select.value=p.sourceRef||'';gradeChoice.select.setChoiceValue(p.productGrade||'');sizeChoice.select.setChoiceValue(p.productSize||'');makerChoice.select.setChoiceValue(p.productManufacturer||'');document.getElementById('pSpecification').value=p.specification||'';deliveryChoice.select.setChoiceValue(p.delivery||'');document.getElementById('pTaxBasis').value=p.taxBasis||'unknown';document.getElementById('pCurrency').value=p.currency||'IRT';document.getElementById('pMeasureUnit').value=p.measureUnit||'kg';document.getElementById('pUrl').value=p.url||'';document.getElementById('pMode').value=p.mode||'auto';document.getElementById('pSelector').value=p.selector||'';document.getElementById('pRegex').value=p.regex||'';document.getElementById('pJsonPath').value=p.jsonPath||'price';document.getElementById('pThreshold').value=p.threshold||0;document.getElementById('pNote').value=p.note||'';document.getElementById('pMode').dispatchEvent(new Event('change'));detailBox.classList.remove('is-empty');detailBadge.textContent=productMap.get(p.catalogId)?.group||p.group||'مشخصات محصول';const detailPanel=document.getElementById('addPanel');if(detailPanel)detailPanel.style.display='';renderSourceSelect();renderQuickPrice()}catch{}} ,0)});
window.addEventListener('fooladban:product-updated',()=>{renderQuickPrice();renderDashboardPicks()});
if(sourcePanel){sourcePanel.after(catalog,picks,registry)}else if(main)main.prepend(catalog,picks,registry);
const detailBack=el('button','mc-tools','بازگشت به کارت محصول');detailBack.type='button';detailBack.addEventListener('click',()=>{const panel=document.getElementById('addPanel');if(panel)panel.style.display='none';});detailBox.prepend(detailBack);
const detailPanel=document.getElementById('addPanel');if(detailPanel)detailPanel.style.display='none';
renderProducts();renderDashboardPicks();renderSources();renderSourceSelect();syncProductSelection();
window.FooladbanMarketConfig={get selectedProducts(){return [...cfg.selected]},get sources(){return cfg.sources.map(x=>({...x}))},refresh:()=>{renderProducts();renderDashboardPicks();renderSources();renderSourceSelect()},updateQuickPrice:renderQuickPrice};
})();