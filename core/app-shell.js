(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=document.querySelector('main.wrap');
if(!root||document.getElementById('fooladbanLayerShell'))return;
const side=document.querySelector('.layout aside');
const panels=side?[...side.querySelectorAll(':scope > .panel')]:[];
if(panels[1])panels[1].id='settingsMonitorPanel';
const eventPanel=[...root.querySelectorAll('.panel')].find(x=>x.querySelector('#alerts'));
if(eventPanel)eventPanel.id='eventsPanel';
const hero=root.querySelector('.hero'),stats=root.querySelector('.stats');
const layout=root.querySelector('.layout');
const market=$('marketPanel'),source=$('sourcePanel'),insights=$('marketInsights'),compare=$('comparisonPanel'),chart=$('chartPanel');
const add=$('addPanel'),catalog=$('mcProductCatalog'),picks=$('mcDashboardPicks'),registry=$('mcSourceRegistry'),settings=$('settingsMonitorPanel');
const shell=document.createElement('div');shell.id='fooladbanLayerShell';
const layers={};
function layer(id,title,subtitle){const n=document.createElement('section');n.className='fb-layer';n.id='layer-'+id;n.dataset.layer=id;n.setAttribute('aria-label',title);const h=document.createElement('div');h.className='fb-layer-intro';const copy=document.createElement('div');const t=document.createElement('h1');t.textContent=title;const p=document.createElement('p');p.textContent=subtitle;copy.append(t,p);h.append(copy);n.append(h);shell.append(n);layers[id]=n;return n}
const dashboard=layer('dashboard','داشبورد فولادبان','نمای فشرده و مدیریتی بازار فولاد ایران و جهان');
const products=layer('products','سبد محصولات','انتخاب، تعریف و مدیریت محصولات تحت پایش');
const sources=layer('sources','مراجع قیمت','مدیریت مراجع رسمی، خصوصی و بین‌المللی');
const analysis=layer('analysis','تحلیل بازار','مقایسه قیمت، روندها و رویدادهای بازار');
const settingsLayer=layer('settings','تنظیمات','شخصی‌سازی محیط، مدیریت پایش و راهنمای استفاده');
function move(parent,...nodes){nodes.filter(Boolean).forEach(n=>parent.append(n))}
move(dashboard,hero,stats,market,catalog,picks);
move(products,add);
move(sources,source,registry);
move(analysis,insights,compare,chart,eventPanel);
const nav=document.createElement('nav');nav.className='fb-layer-nav';nav.id='fbLayerNav';nav.setAttribute('aria-label','ناوبری لایه‌های برنامه');
const navItems=[['dashboard','▦','داشبورد'],['products','▤','محصولات'],['sources','◎','منابع'],['analysis','▥','تحلیل'],['settings','⚙','تنظیمات']];
for(const [id,ico,label] of navItems){const b=document.createElement('button');b.type='button';b.dataset.layerTarget=id;b.innerHTML='<span class="fb-nav-icon" aria-hidden="true">'+ico+'</span><span>'+label+'</span>';b.addEventListener('click',()=>activate(id));nav.append(b)}
const top=document.querySelector('header.top');if(top)top.after(nav);root.insertBefore(shell,layout);if(layout)layout.remove();
const oldNav=document.querySelector('.bottomnav');if(oldNav)oldNav.remove();
function card(title,content,open=false){const d=document.createElement('details');d.className='fb-settings-card';if(open)d.open=true;const s=document.createElement('summary');s.textContent=title;const body=document.createElement('div');body.className='fb-settings-body';body.append(content);d.append(s,body);return d}
function row(label,control,help){const w=document.createElement('div');w.className='fb-setting-row';const left=document.createElement('div');left.className='fb-setting-copy';const b=document.createElement('b');b.textContent=label;left.append(b);if(help){const p=document.createElement('small');p.textContent=help;left.append(p)}w.append(left,control);return w}
function button(text,fn,cls=''){const b=document.createElement('button');b.type='button';b.className='btn '+cls;b.textContent=text;b.addEventListener('click',fn);return b}
function select(options,value,onchange){const s=document.createElement('select');for(const [v,l] of options){const o=document.createElement('option');o.value=v;o.textContent=l;s.append(o)}s.value=value;s.addEventListener('change',()=>onchange(s.value));return s}
let savedUI={};try{savedUI=JSON.parse(localStorage.getItem('fooladban.ui.v1')||'{}')||{}}catch{}let ui={theme:'dark',accent:'teal',density:'comfortable',pageBg:'#071a2b',iconColor:'#28c6e8',...savedUI};
function applyUI(){const mode=ui.theme==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):ui.theme;document.documentElement.dataset.theme=mode;document.documentElement.style.setProperty('--gold',ui.accent==='teal'?'#28c6e8':ui.accent==='red'?'#ef476f':ui.accent==='blue'?'#258fca':ui.accent==='emerald'?'#58c69a':'#d9b66c');document.documentElement.style.setProperty('--bg',ui.pageBg||'#091522');document.documentElement.style.setProperty('--icon-color',ui.iconColor||'var(--gold)');document.body.dataset.density=ui.density;document.documentElement.style.colorScheme=mode;}
function saveUI(){localStorage.setItem('fooladban.ui.v1',JSON.stringify(ui));applyUI()}
applyUI();if(ui.theme==='system'&&window.matchMedia){matchMedia('(prefers-color-scheme: light)').addEventListener?.('change',applyUI)}
const appearance=document.createElement('div');appearance.className='fb-settings-stack';
const theme=select([['dark','تیره'],['light','روشن'],['system','پیروی از دستگاه']],ui.theme,v=>{ui.theme=v;saveUI()});
const accent=select([['teal','فیروزه‌ای فولادبان'],['blue','آبی رادار'],['red','قرمز هشدار'],['gold','طلایی'],['emerald','سبز']],ui.accent,v=>{ui.accent=v;saveUI()});
const bg=document.createElement('input');bg.type='color';bg.value=ui.pageBg||'#091522';bg.addEventListener('input',()=>{ui.pageBg=bg.value;applyUI()});bg.addEventListener('change',saveUI);
const icons=select([['','هم‌رنگ پوسته'],['#28c6e8','فیروزه‌ای'],['#258fca','آبی'],['#ef476f','قرمز'],['#d9b66c','طلایی']],ui.iconColor,v=>{ui.iconColor=v;saveUI()});
appearance.append(row('پوسته برنامه',theme,'حالت روشن، تیره یا هماهنگ با دستگاه'),row('رنگ پوسته',accent,'رنگ تأکیدی کارت‌ها و کنترل‌ها'),row('رنگ زمینه صفحه',bg,'رنگ پس‌زمینه اصلی برنامه'),row('رنگ آیکون‌ها',icons,'رنگ آیکون‌های ناوبری و ابزارها'),button('ذخیره تنظیمات ظاهری',saveUI,'primary'));
const monitor=document.createElement('div');if(settings){settings.classList.remove('panel');settings.querySelector('.panel-head')?.remove()}monitor.append(settings);
const navOrder=['dashboard','products','sources','analysis','settings'];
const navNames={dashboard:'داشبورد',products:'محصولات',sources:'مراجع قیمت',analysis:'تحلیل بازار',settings:'تنظیمات'};
ui.navOrder=Array.isArray(ui.navOrder)&&ui.navOrder.length===navOrder.length&&navOrder.every(x=>ui.navOrder.includes(x))?ui.navOrder:navOrder.slice();
ui.navOrder.forEach(k=>{const b=nav.querySelector('[data-layer-target="'+k+'"]');if(b)nav.append(b)});
function renderLayerOrder(host){host.replaceChildren();ui.navOrder.forEach((id,i)=>{const item=document.createElement('div');item.className='fb-setting-row fb-layer-order';const title=document.createElement('b');title.textContent=(i+1).toLocaleString('fa-IR')+' · '+navNames[id];const actions=document.createElement('div');actions.className='fb-order-actions';const up=button('↑',()=>shift(id,-1));const down=button('↓',()=>shift(id,1));up.disabled=i===0;down.disabled=i===ui.navOrder.length-1;actions.append(up,down);item.append(title,actions);host.append(item)})}
function shift(id,delta){const i=ui.navOrder.indexOf(id),j=Math.max(0,Math.min(ui.navOrder.length-1,i+delta));if(i===j)return;[ui.navOrder[i],ui.navOrder[j]]=[ui.navOrder[j],ui.navOrder[i]];const bs=[...nav.querySelectorAll('button')];ui.navOrder.forEach((k,index)=>{const b=bs.find(x=>x.dataset.layerTarget===k);if(b)nav.append(b)});saveUI();renderLayerOrder(orderHost)}
const orderHost=document.createElement('div');renderLayerOrder(orderHost);
const orderTools=document.createElement('div');orderTools.className='fb-settings-stack';orderTools.append(orderHost);
const template=document.createElement('div');template.className='fb-settings-stack';
const density=select([['comfortable','راحت و خوانا'],['compact','فشرده']],ui.density,v=>{ui.density=v;saveUI()});
template.append(row('قالب نمایش',density,'فاصله‌گذاری کارت‌ها و تراکم اطلاعات'),button('ذخیره قالب فعلی',saveUI,'primary'));
const guide=document.createElement('div');guide.className='fb-guide-list';
const guideItems=[['داشبورد','نمای خلاصه شاخص‌ها و محصولات منتخب'],['محصولات','تعریف کالاها و انتخاب اقلام قابل پایش'],['مراجع قیمت','فعال‌سازی، حذف و اولویت‌بندی منابع در هر بازار'],['تحلیل بازار','مقایسه قیمت‌های هم‌مشخصات و مشاهده روند'],['تنظیمات','مدیریت ظاهر، اتصال داده و تنظیمات پایش']];
for(const [t,d] of guideItems){const x=document.createElement('div');x.className='fb-guide-item';const b=document.createElement('b');b.textContent=t;const p=document.createElement('p');p.textContent=d;x.append(b,p);guide.append(x)}
const data=document.createElement('div');data.className='fb-settings-stack';data.append(button('دریافت خروجی قیمت‌ها (CSV)',()=>$('exportBtn')?.click()),button('بررسی همه قیمت‌ها',()=>$('checkNow')?.click()));
const about=document.createElement('div');about.className='fb-about';about.innerHTML='<div class="fb-about-brand"><img src="./icon.svg" alt="نشان فولادبان"><div><b>فولادبان</b><small>STEEL MARKET RADAR</small></div></div><p>سامانه پایش و ارزیابی بازار محصولات زنجیره فولاد ایران و بازارهای بین‌المللی</p><small>نسخه وب ۱.۴ · PWA</small>';const aboutStyle=document.createElement('style');aboutStyle.textContent='.fb-about-brand{display:flex;align-items:center;gap:12px;margin-bottom:10px}.fb-about-brand img{width:54px;height:54px;border-radius:13px}.fb-about-brand small{display:block;color:var(--muted);font-size:.65rem;letter-spacing:.08em}';document.head.append(aboutStyle);
settingsLayer.append(card('ظاهر برنامه و رنگ‌بندی',appearance,true),card('تنظیمات پایش و اتصال داده',monitor),card('قالب نمایش',template),card('ترتیب لایه‌ها',orderTools),card('دفترچه راهنما',guide),card('داده‌ها و خروجی',data),card('درباره برنامه',about));
function activate(id){if(!layers[id])return;Object.entries(layers).forEach(([k,n])=>n.classList.toggle('active',k===id));nav.querySelectorAll('button').forEach(b=>{const yes=b.dataset.layerTarget===id;b.classList.toggle('active',yes);b.setAttribute('aria-current',yes?'page':'false')});try{sessionStorage.setItem('fooladban.activeLayer',id)}catch{}window.scrollTo({top:0,behavior:'smooth'});if(id==='analysis'&&window.dispatchEvent)window.dispatchEvent(new Event('resize'))}
nav.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const bs=[...nav.querySelectorAll('button')],i=bs.indexOf(document.activeElement);if(i>=0){bs[(i+(e.key==='ArrowLeft'?1:-1)+bs.length)%bs.length].focus();e.preventDefault()}}});
const previous=(()=>{try{return sessionStorage.getItem('fooladban.activeLayer')}catch{return null}})();activate(layers[previous]?previous:'dashboard');
window.FooladbanLayers={activate,get active(){return nav.querySelector('button.active')?.dataset.layerTarget||'dashboard'}};
})();