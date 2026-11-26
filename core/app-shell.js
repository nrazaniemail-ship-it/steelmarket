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
move(dashboard,hero,stats,market,picks);
move(products,catalog,add);
move(sources,source,registry);
move(analysis,insights,compare,chart,eventPanel);

const nav=document.createElement('nav');nav.className='fb-layer-nav';nav.id='fbLayerNav';nav.setAttribute('aria-label','ناوبری لایه‌های برنامه');
const navItems=[['dashboard','📊','داشبورد'],['products','🏗️','محصولات'],['sources','🌐','مراجع قیمت'],['analysis','📈','تحلیل'],['settings','⚙️','تنظیمات']];
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

function syncTopControls(){
 const lang=$('fbTopLanguage'),theme=$('fbTopTheme');
 if(lang){lang.textContent=(ui.language||'fa').toUpperCase();lang.setAttribute('aria-label','زبان انتخاب‌شده: '+(ui.language==='en'?'English':'فارسی'))}
 if(theme){const light=document.documentElement.dataset.theme==='light';theme.textContent=light?'🌙':'☀️';theme.setAttribute('aria-label',light?'فعال‌سازی پوسته تیره':'فعال‌سازی پوسته روشن')}
}
$('fbTopTheme')?.addEventListener('click',()=>{ui.theme=document.documentElement.dataset.theme==='light'?'dark':'light';saveUI();syncTopControls()});
$('fbTopLanguage')?.addEventListener('click',()=>{ui.language=ui.language==='en'?'fa':'en';saveUI();syncTopControls();toastSetting(ui.language==='en'?'English selected; full interface translation is not enabled yet.':'زبان فارسی انتخاب شد')});
function updateTehranClock(){
 const now=new Date(),zone='Asia/Tehran';
 const clock=$('fbTehranClock'),persian=$('fbPersianDate'),gregorian=$('fbGregorianDate');
 if(clock)clock.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now);
 if(persian){const parts=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:zone,day:'2-digit',month:'long',year:'numeric'}).formatToParts(now);const part=k=>parts.find(x=>x.type===k)?.value||'';persian.textContent=part('day')+' - '+part('month')+' - '+part('year')}
 if(gregorian){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'2-digit',month:'short',year:'numeric'}).formatToParts(now);const part=k=>parts.find(x=>x.type===k)?.value||'';gregorian.textContent=part('day')+' - '+part('month')+' - '+part('year')}
}
syncTopControls();updateTehranClock();setInterval(updateTehranClock,1000);
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
const language=document.createElement('div');language.className='fb-settings-stack';language.append(row('زبان برنامه',select([['fa','فارسی'],['en','English']],ui.language||'fa',v=>{ui.language=v;saveUI();toastSetting('زبان انتخاب شد؛ ترجمه کامل رابط هنوز فعال نشده است.')}),'زبان پیش‌فرض محیط'));
const layerSkin=document.createElement('div');layerSkin.className='fb-settings-stack';const layerAccent=select([['teal','فیروزه‌ای'],['blue','آبی'],['red','قرمز'],['gold','طلایی'],['emerald','سبز']],ui.layerAccent||ui.accent,v=>{ui.layerAccent=v;ui.accent=v;saveUI()});layerSkin.append(row('رنگ کارت‌های لایه‌ها',layerAccent,'رنگ تأکیدی و هماهنگی کارت‌ها'));
const iconSkin=document.createElement('div');iconSkin.className='fb-settings-stack';const iconColor=select([['#28c6e8','فیروزه‌ای'],['#258fca','آبی'],['#ef476f','قرمز'],['#d9b66c','طلایی'],['#58c69a','سبز']],ui.iconColor||'#28c6e8',v=>{ui.iconColor=v;saveUI()});iconSkin.append(row('رنگ آیکون‌ها',iconColor,'رنگ آیکون‌های منو و ابزارها'));
const backgroundSkin=document.createElement('div');backgroundSkin.className='fb-settings-stack';backgroundSkin.append(row('رنگ زمینه صفحه',bg,'انتخاب رنگ دلخواه پس‌زمینه'));
const navBar=document.createElement('div');navBar.className='fb-settings-stack';navBar.append(row('جایگاه نوار ناوبری',select([['bottom','پایین صفحه'],['top','بالای صفحه']],ui.navPosition||'bottom',v=>{ui.navPosition=v;saveUI();nav.style.top=v==='top'?'70px':'auto';nav.style.bottom=v==='top'?'auto':'0'}),'محل نمایش نوار اصلی برنامه'));
const announcements=document.createElement('div');announcements.className='fb-settings-stack';announcements.append(row('اعلان‌های سامانه',select([['on','فعال'],['off','غیرفعال']],ui.announcements||'on',v=>{ui.announcements=v;saveUI()}),'نمایش اطلاعیه‌ها و تغییرات نسخه'));
const privacy=document.createElement('div');privacy.className='fb-guide-list';for(const [t,d] of [['حریم خصوصی','اطلاعات محصولات و تنظیمات در حافظه همین مرورگر نگهداری می‌شوند.'],['داده‌های بازار','قیمت دریافت‌نشده یا تأییدنشده به‌عنوان قیمت زنده معرفی نمی‌شود.'],['پشتیبان‌گیری','برای نگهداری سوابق، خروجی CSV قیمت‌ها را دریافت کنید.']]){const x=document.createElement('div');x.className='fb-guide-item';const b=document.createElement('b');b.textContent=t;const p=document.createElement('p');p.textContent=d;x.append(b,p);privacy.append(x)}
const support=document.createElement('div');support.className='fb-about';support.innerHTML='<b>تماس با پشتیبانی</b><p><a href="mailto:n.razaniemail@gmail.com">n.razaniemail@gmail.com</a></p>';
const about=document.createElement('div');about.className='fb-about';about.innerHTML='<div class="fb-about-brand"><img src="./icon.svg" alt="نشان فولادبان"><div><b>فولادبان</b><small>STEEL MARKET RADAR</small></div></div><p>سامانه پایش و ارزیابی بازار محصولات زنجیره فولاد ایران و بازارهای بین‌المللی</p><small>نسخه وب · PWA</small>';const aboutStyle=document.createElement('style');aboutStyle.textContent='.fb-about-brand{display:flex;align-items:center;gap:12px;margin-bottom:10px}.fb-about-brand img{width:54px;height:54px;border-radius:13px}.fb-about-brand small{display:block;color:var(--muted);font-size:.65rem;letter-spacing:.08em}';document.head.append(aboutStyle);

/* Namello settings parity: transfer every non-floating, non-widget section into Fooladban */
const profileBox=document.createElement('div');profileBox.className='fb-settings-stack';
const profileInput=document.createElement('input');profileInput.type='text';profileInput.placeholder='نام کاربر جدید';profileInput.className='btn';
const profileList=document.createElement('div');profileList.className='fb-settings-stack';
let profiles=[];try{profiles=JSON.parse(localStorage.getItem('fooladban.profiles.v1')||'[]')}catch{}
function renderProfiles(){profileList.replaceChildren();profiles.forEach((name,i)=>{const r=document.createElement('div');r.className='fb-setting-row';const b=document.createElement('b');b.textContent=name;const del=button('🗑 حذف',()=>{profiles.splice(i,1);localStorage.setItem('fooladban.profiles.v1',JSON.stringify(profiles));renderProfiles()});r.append(b,del);profileList.append(r)})}
profileBox.append(row('نام کاربر',profileInput,'پروفایل‌های محلی این مرورگر؛ بدون سامانه ورود یا احراز هویت'),button('＋ افزودن کاربر',()=>{const v=profileInput.value.trim();if(!v)return toastSetting('نام کاربر را وارد کنید');if(!profiles.includes(v))profiles.push(v);localStorage.setItem('fooladban.profiles.v1',JSON.stringify(profiles));profileInput.value='';renderProfiles()},'primary'),profileList);renderProfiles();
const fontBox=document.createElement('div');fontBox.className='fb-settings-stack';
const fontChoice=select([['Vazirmatn','وزیرمتن (پیش‌فرض)'],['Tahoma','Tahoma'],['Arial','Arial'],['system-ui','فونت دستگاه']],ui.fontFamily||'Vazirmatn',v=>{ui.fontFamily=v;document.body.style.fontFamily=v+',sans-serif';saveUI()});
fontBox.append(row('قلم برنامه',fontChoice,'انتخاب قلم متن در محیط فولادبان'));
if(ui.fontFamily)document.body.style.fontFamily=ui.fontFamily+',sans-serif';
const displayBox=document.createElement('div');displayBox.className='fb-settings-stack';
const displayMode=select([['horizontal','افقی (ردیفی)'],['vertical','عمودی (ستونی)']],ui.layerDisplay||'horizontal',v=>{ui.layerDisplay=v;nav.dataset.display=v;saveUI()});
displayBox.append(row('چیدمان نمایش لایه‌ها',displayMode,'تغییر نمایش نوار ناوبری بین حالت افقی و عمودی'));nav.dataset.display=ui.layerDisplay||'horizontal';
const appIconBox=document.createElement('div');appIconBox.className='fb-settings-stack';
const appIcon=select([['default','نشان اصلی فولادبان'],['teal','فیروزه‌ای'],['gold','طلایی'],['blue','آبی']],ui.appIconTheme||'default',v=>{ui.appIconTheme=v;document.documentElement.dataset.appIcon=v;saveUI()});
appIconBox.append(row('پوسته آیکون برنامه',appIcon,'رنگ نشان داخل محیط برنامه؛ آیکون نصب‌شده دستگاه تابع manifest است'));
const libraryBox=document.createElement('div');libraryBox.className='fb-settings-stack';
const libraryInfo=document.createElement('p');libraryInfo.className='fb-settings-note';libraryInfo.textContent='فایل‌های خروجی و نسخه‌های پشتیبان را در دستگاه خود نگهداری کنید. داده‌های مرورگر ممکن است با پاک‌سازی حافظه دستگاه حذف شوند.';
const libraryStatus=document.createElement('small');libraryStatus.textContent='در حال بررسی فضای ذخیره‌سازی…';
libraryBox.append(libraryInfo,libraryStatus,button('بررسی فضای ذخیره‌سازی',async()=>{try{const q=await navigator.storage?.estimate?.();libraryStatus.textContent=q?('مصرف: '+Math.round((q.usage||0)/1024/1024)+' مگابایت از '+Math.round((q.quota||0)/1024/1024)+' مگابایت'):'اطلاعات فضای ذخیره‌سازی در این مرورگر در دسترس نیست'}catch{libraryStatus.textContent='امکان بررسی فضای ذخیره‌سازی وجود ندارد'}}));
const announcementBox=document.createElement('div');announcementBox.className='fb-settings-stack';
const announcementToggle=select([['on','فعال'],['off','غیرفعال']],ui.announcements||'on',v=>{ui.announcements=v;saveUI()});
announcementBox.append(row('نمایش اعلان‌های سامانه',announcementToggle,'اطلاعیه‌ها و پیام‌های نسخه‌های جدید'));
const permissionButton=$('notifyBtn');if(permissionButton){permissionButton.classList.add('fb-notification-setting');announcementBox.append(row('مجوز اعلان دستگاه',permissionButton,'فعال‌سازی یا مدیریت اجازه ارسال اعلان در این مرورگر'))}
const marketDataBox=document.createElement('div');marketDataBox.className='fb-settings-stack';
const refreshInterval=select([['5','هر ۵ دقیقه'],['15','هر ۱۵ دقیقه'],['30','هر ۳۰ دقیقه'],['60','هر ساعت']],String(ui.refreshInterval||15),v=>{ui.refreshInterval=Number(v);saveUI()});
const calcBasis=select([['latest','آخرین قیمت معتبر'],['median','میانه مراجع معتبر']],ui.calcBasis||'latest',v=>{ui.calcBasis=v;saveUI()});
marketDataBox.append(row('دوره بررسی خودکار قیمت‌ها',refreshInterval,'تنظیم ترجیح کاربر؛ اجرای واقعی تابع زمان‌بندی Worker است'),row('مبنای نمایش قیمت منتخب',calcBasis,'قیمت‌های غیرقابل‌مقایسه نباید با هم ادغام شوند'),button('بررسی همه مراجع قیمت',()=>$('checkNow')?.click()));
const metricPrefs=[['price','قیمت محصول'],['volume','حجم معاملات (در صورت ارائه مرجع)'],['fx','نرخ ارز مبنا'],['delivery','هزینه و محل تحویل'],['quality','کنترل هم‌خوانی مشخصات محصول']];
const metricBox=document.createElement('div');metricBox.className='fb-settings-stack';
for(const [key,label] of metricPrefs){const check=document.createElement('input');check.type='checkbox';check.checked=ui.marketMetrics?.[key]!==false;check.addEventListener('change',()=>{ui.marketMetrics={...(ui.marketMetrics||{}),[key]:check.checked};saveUI()});metricBox.append(row('پایش '+label,check,'فعال / غیرفعال‌سازی این مؤلفه در تنظیمات کاربر'))}
marketDataBox.append(metricBox);
const securityBox=document.createElement('div');securityBox.className='fb-settings-stack';
const backupBtn=button('⬇ دریافت نسخه پشتیبان تنظیمات',()=>{const payload={app:'Fooladban',version:document.querySelector('meta[name="app-version"]')?.content||'web',exportedAt:new Date().toISOString(),ui:JSON.parse(localStorage.getItem('fooladban.ui.v1')||'{}'),profiles:JSON.parse(localStorage.getItem('fooladban.profiles.v1')||'[]')};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fooladban-backup.json';a.click();URL.revokeObjectURL(a.href)});
const restoreInput=document.createElement('input');restoreInput.type='file';restoreInput.accept='application/json';restoreInput.hidden=true;restoreInput.addEventListener('change',async()=>{const file=restoreInput.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.app!=='Fooladban'||!data.ui||typeof data.ui!=='object')throw new Error();localStorage.setItem('fooladban.ui.v1',JSON.stringify(data.ui));if(Array.isArray(data.profiles))localStorage.setItem('fooladban.profiles.v1',JSON.stringify(data.profiles));toastSetting('نسخه پشتیبان بازیابی شد؛ صفحه را تازه‌سازی کنید')}catch{toastSetting('فایل پشتیبان معتبر نیست')}restoreInput.value=''});
securityBox.append(backupBtn,button('⬆ بازیابی نسخه پشتیبان',()=>restoreInput.click()),restoreInput,button('پاک‌سازی تنظیمات ظاهری',()=>{if(confirm('تنظیمات ظاهری به حالت پیش‌فرض برگردد؟')){localStorage.removeItem('fooladban.ui.v1');location.reload()}},'danger'));
const videoGuide=document.createElement('div');videoGuide.className='fb-settings-stack';videoGuide.append(button('مشاهده راهنمای ویدئویی فولادبان',()=>window.open('https://www.youtube.com/results?search_query=آموزش+بازار+فولاد+فولادبان','_blank','noopener')));
const updateBox=document.createElement('div');updateBox.className='fb-settings-stack';const version=document.createElement('small');version.textContent='نسخه وب فولادبان · PWA';updateBox.append(version,button('بررسی / دریافت آخرین نسخه',()=>{if('serviceWorker'in navigator)navigator.serviceWorker.getRegistration().then(r=>r?.update()).finally(()=>location.reload());else location.reload()},'primary'));
const privacyPolicy=document.createElement('div');privacyPolicy.className='fb-guide-list';for(const [t,d] of [['حریم خصوصی','اطلاعات تنظیمات و پروفایل در حافظه محلی مرورگر ذخیره می‌شود.'],['داده‌های بازار','قیمت فاقد زمان دریافت یا مشخصات کافی، قیمت زنده قطعی تلقی نمی‌شود.'],['مجوزها','فولادبان بدون اقدام کاربر به حساب‌های مالی یا کارگزاری دسترسی ندارد.']]){const x=document.createElement('div');x.className='fb-guide-item';const b=document.createElement('b');b.textContent=t;const p=document.createElement('p');p.textContent=d;x.append(b,p);privacyPolicy.append(x)}
const proBox=document.createElement('div');proBox.className='fb-about';proBox.innerHTML='<b>⭐ فولادبان حرفه‌ای</b><p>قابلیت‌های حرفه‌ای در نسخه‌های آتی پس از آماده‌سازی زیرساخت اشتراک فعال خواهند شد.</p>';

settingsLayer.append(card('کاربران',profileBox,true),card('زبان برنامه',language),card('قالب برنامه',template),card('رنگ زمینه برنامه',backgroundSkin),card('پوسته لایه‌های برنامه',layerSkin),card('پوسته آیکون برنامه',appIconBox),card('قلم برنامه',fontBox),card('چیدمان نمایش فهرست لایه‌ها',displayBox),card('Navigation bar',navBar),card('ترتیب لایه‌ها',orderTools),card('اعلان‌ها',announcementBox),card('کتابخانه و فضای ذخیره‌سازی',libraryBox),card('داده‌های بازار و محاسبات',marketDataBox),card('امنیت، پشتیبان‌گیری و بازیابی',securityBox),card('اشتراک فولادبان حرفه‌ای',proBox),card('دفترچه راهنما',guide),card('راهنمای ویدئویی',videoGuide),card('تماس با پشتیبانی',support),card('سیاست حفظ حریم خصوصی',privacyPolicy),card('به‌روزرسانی برنامه',updateBox),card('درباره فولادبان',about),card('تنظیمات پایش و اتصال داده',monitor),card('داده‌ها و خروجی‌ها',data));
function toastSetting(message){const t=$('toast');if(t){t.textContent=message;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2600)}}
function activate(id){if(!layers[id])return;Object.entries(layers).forEach(([k,n])=>n.classList.toggle('active',k===id));nav.querySelectorAll('button').forEach(b=>{const yes=b.dataset.layerTarget===id;b.classList.toggle('active',yes);b.setAttribute('aria-current',yes?'page':'false')});try{sessionStorage.setItem('fooladban.activeLayer',id)}catch{}window.scrollTo({top:0,behavior:'smooth'});if(id==='analysis'&&window.dispatchEvent)window.dispatchEvent(new Event('resize'))}
nav.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const bs=[...nav.querySelectorAll('button')],i=bs.indexOf(document.activeElement);if(i>=0){bs[(i+(e.key==='ArrowLeft'?1:-1)+bs.length)%bs.length].focus();e.preventDefault()}}});
const previous=(()=>{try{return sessionStorage.getItem('fooladban.activeLayer')}catch{return null}})();activate(layers[previous]?previous:'dashboard');
window.FooladbanLayers={activate,get active(){return nav.querySelector('button.active')?.dataset.layerTarget||'dashboard'}};
})();