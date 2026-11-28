(function(){'use strict';
/* Fooladban trader toolkit (v1.6): market pulse, steel weight calculator, conversion-margin calculator.
   Derived from a benchmark of Ahantime / Ahan Assa (weight & cost calculators), Zharfahan / Arznab (movers, freshness),
   CRU / Fastmarkets (value-chain spread, trend & volatility context). All outputs are decision support, not investment advice. */
const host=document.getElementById('layer-analysis');if(!host||document.getElementById('fbToolkit'))return;
const KEY='fooladban.v1',DAY=864e5,fa=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('fa-IR',{maximumFractionDigits:d}):'—';
const digits=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,'').replace('٫','.');
const num=v=>{const n=Number(digits(v));return Number.isFinite(n)&&n>=0?n:NaN};
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function products(){try{const s=JSON.parse(localStorage.getItem(KEY)||'{}'),selected=new Set((window.FooladbanMarketConfig?.selectedProducts||[]).map(String));return Array.isArray(s.products)?s.products.filter(p=>p&&Array.isArray(p.history)&&selected.has(String(p.catalogId||p.productKey||''))):[]}catch{return[]}}
const style=el('style');style.textContent=`#fbToolkit{background:linear-gradient(145deg,var(--panel),#102035);border:1px solid var(--line);border-radius:16px;padding:15px;margin:0 0 14px}
#fbToolkit h2{font-size:1rem;margin:0 0 6px}#fbToolkit h3{font-size:.86rem;color:var(--gold);margin:16px 0 8px}#fbToolkit .tk-note{font-size:.72rem;color:var(--muted);line-height:1.9;margin:0 0 8px}
#fbToolkit .tk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}#fbToolkit label{display:grid;gap:4px;font-size:.74rem;color:var(--muted)}
#fbToolkit input,#fbToolkit select{width:100%;padding:9px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--text)}
#fbToolkit input:focus-visible,#fbToolkit select:focus-visible,#fbToolkit button:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
#fbToolkit .tk-table{width:100%;border-collapse:collapse;font-size:.74rem}#fbToolkit .tk-table th,#fbToolkit .tk-table td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:right}
#fbToolkit .tk-up{color:var(--green)}#fbToolkit .tk-down{color:var(--red)}#fbToolkit .tk-chip{display:inline-block;padding:2px 8px;border-radius:20px;border:1px solid var(--line);font-size:.68rem}
#fbToolkit .tk-out{margin-top:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);font-size:.8rem;line-height:2}#fbToolkit .tk-out b{color:var(--gold)}
#fbToolkit .tk-scroll{overflow-x:auto}@media(max-width:560px){#fbToolkit .tk-grid{grid-template-columns:1fr}}`;document.head.append(style);
const root=el('section');root.id='fbToolkit';
root.append(el('h2','','ابزارهای معامله‌گر'),el('p','tk-note','خلاصه نبض بازار از داده‌های ثبت‌شده شما، ماشین‌حساب وزن مقاطع فولادی و محاسبه حاشیه تبدیل زنجیره. خروجی‌ها ابزار پشتیبان تصمیم‌اند و توصیه سرمایه‌گذاری نیستند.'));
/* ---------- market pulse ---------- */
const pulse=el('div');root.append(el('h3','','نبض بازار (تغییر، نوسان و تازگی داده)'),pulse);
function changeOver(h,days,now){const last=h.at(-1);if(!last)return null;const ref=[...h].reverse().find(x=>now-x.time>=days*DAY);const base=ref||(h.length>1?h[0]:null);if(!base||!(base.price>0))return null;if(!ref&&now-h[0].time<DAY*0.5)return null;return(last.price-base.price)/base.price*100}
function stat(p,now){const h=p.history.filter(x=>x&&Number(x.price)>0&&Number(x.time)>0).sort((a,b)=>a.time-b.time);if(!h.length)return null;const rets=[];for(let i=1;i<h.length;i++)rets.push(Math.log(h[i].price/h[i-1].price));const m=rets.length?rets.reduce((a,b)=>a+b,0)/rets.length:0,vol=rets.length>1?Math.sqrt(rets.reduce((a,b)=>a+(b-m)**2,0)/(rets.length-1))*100:null;const last=h.at(-1),sma=h.slice(-5).reduce((a,b)=>a+b.price,0)/Math.min(5,h.length);return{p,last,c1:changeOver(h,1,now),c7:changeOver(h,7,now),c30:changeOver(h,30,now),vol,trend:h.length<3?'—':last.price>sma*1.005?'صعودی':last.price<sma*0.995?'نزولی':'خنثی',ageH:(now-last.time)/36e5,n:h.length}}
function pct(v){if(v==null)return el('span','','—');const s=el('span',v>0?'tk-up':v<0?'tk-down':'',(v>0?'+':'')+fa(v,2)+'٪');return s}
function renderPulse(){const now=Date.now(),rows=products().filter(p=>!p.disabled).map(p=>stat(p,now)).filter(Boolean);pulse.replaceChildren();if(!rows.length){pulse.append(el('p','tk-note','هنوز قیمتی ثبت نشده است. پس از ثبت محصول و دریافت قیمت، شاخص‌ها اینجا نمایش داده می‌شوند.'));return}
const movers=[...rows].filter(r=>r.c1!=null||r.c7!=null).sort((a,b)=>Math.abs(b.c1??b.c7??0)-Math.abs(a.c1??a.c7??0)).slice(0,1)[0];
if(movers){pulse.append(el('p','tk-note','بیشترین تغییر اخیر: '+movers.p.name+' ('+(movers.c1!=null?fa(movers.c1,2)+'٪ در ۲۴ ساعت':fa(movers.c7,2)+'٪ در ۷ روز')+')'))}
const wrap=el('div','tk-scroll'),t=el('table','tk-table'),hr=el('tr');for(const h of['محصول','آخرین قیمت','۲۴ساعت','۷روز','۳۰روز','نوسان','روند','تازگی'])hr.append(el('th','',h));t.append(hr);
for(const r of rows){const tr=el('tr');tr.append(el('td','',r.p.name),el('td','',fa(r.last.price)+' '+(r.p.currency||'')+'/'+(r.p.measureUnit||'')));for(const v of[r.c1,r.c7,r.c30]){const td=el('td');td.append(pct(v));tr.append(td)}
tr.append(el('td','',r.vol==null?'—':fa(r.vol,2)+'٪'),el('td','',r.trend));const fresh=el('td'),stale=r.ageH>48,c=el('span','tk-chip',stale?'کهنه':r.ageH>24?'نیاز به بروزرسانی':'تازه');if(stale)c.classList.add('tk-down');fresh.append(c);tr.append(fresh);t.append(tr)}
wrap.append(t);pulse.append(wrap,el('p','tk-note','نوسان = انحراف معیار تغییرات لگاریتمی بین مشاهدات متوالی؛ روند = موقعیت آخرین قیمت نسبت به میانگین ۵ مشاهده اخیر. با مشاهدات کم، شاخص‌ها اطمینان پایینی دارند.'))}
/* ---------- weight calculator ---------- */
const STEEL=7.85;// g/cm3 => kg/dm3 ; density used for all shapes
const SHAPES={
 rebar:{label:'میلگرد (آجدار/ساده)',fields:[['d','قطر (mm)',16],['L','طول شاخه (m)',12]],w:v=>Math.PI*(v.d/2)**2*1e-6*STEEL*1e3*v.L,note:'وزن = π·(d/2)²·ρ·L؛ مقادیر استاندارد کارخانه‌ها در عمل کمی متفاوت است (تلورانس وزنی).'},
 plate:{label:'ورق / تسمه',fields:[['t','ضخامت (mm)',5],['W','عرض (mm)',1500],['L','طول (mm)',6000]],w:v=>v.t*v.W*v.L*1e-6*STEEL},
 round:{label:'گرد / مفتول (m)',fields:[['d','قطر (mm)',20],['L','طول (m)',6]],w:v=>Math.PI*(v.d/2)**2*1e-6*STEEL*1e3*v.L},
 square:{label:'مربع تو‌پر',fields:[['a','ضلع (mm)',20],['L','طول (m)',6]],w:v=>v.a*v.a*1e-6*STEEL*1e3*v.L},
 pipe:{label:'لوله',fields:[['D','قطر خارجی (mm)',60.3],['t','ضخامت دیواره (mm)',3.6],['L','طول (m)',6]],w:v=>v.t>0&&v.D>2*v.t?Math.PI*(v.D-v.t)*v.t*1e-6*STEEL*1e3*v.L:NaN},
 box:{label:'قوطی (مربع/مستطیل)',fields:[['A','بعد اول (mm)',40],['B','بعد دوم (mm)',40],['t','ضخامت (mm)',2],['L','طول (m)',6]],w:v=>v.t>0&&v.A>2*v.t&&v.B>2*v.t?(v.A*v.B-(v.A-2*v.t)*(v.B-2*v.t))*1e-6*STEEL*1e3*v.L:NaN}
};
const wc=el('div');root.append(el('h3','','ماشین‌حساب وزن و بهای مقاطع'),wc);
const shapeSel=el('select');shapeSel.setAttribute('aria-label','نوع مقطع');for(const [k,s] of Object.entries(SHAPES)){const o=el('option','',s.label);o.value=k;shapeSel.append(o)}
const fieldsBox=el('div','tk-grid'),countIn=el('input'),priceIn=el('input'),unitSel=el('select'),out=el('div','tk-out');
countIn.type='text';countIn.inputMode='decimal';countIn.value='1';priceIn.type='text';priceIn.inputMode='decimal';priceIn.placeholder='اختیاری';
for(const [v,t] of[['kg','قیمت به ازای کیلوگرم'],['ton','قیمت به ازای تن']]){const o=el('option','',t);o.value=v;unitSel.append(o)}
const lab=(t,c)=>{const l=el('label','',t);l.append(c);return l};
const inputs={};
function buildFields(){fieldsBox.replaceChildren();for(const k of Object.keys(inputs))delete inputs[k];const s=SHAPES[shapeSel.value];for(const [k,t,d] of s.fields){const i=el('input');i.type='text';i.inputMode='decimal';i.value=String(d);i.addEventListener('input',calc);inputs[k]=i;fieldsBox.append(lab(t,i))}calc()}
function calc(){const s=SHAPES[shapeSel.value],v={};for(const [k] of s.fields)v[k]=num(inputs[k].value);const cnt=num(countIn.value),price=num(priceIn.value);out.replaceChildren();
if(Object.values(v).some(x=>!(x>0))||!(cnt>0)){out.textContent='مقادیر ابعاد و تعداد را به‌صورت عدد مثبت وارد کنید.';return}
const one=s.w(v);if(!Number.isFinite(one)||one<=0){out.textContent='ابعاد واردشده با هم سازگار نیست (مثلاً ضخامت دیواره بیش از حد است).';return}
const total=one*cnt;const line=(a,b)=>{const d=el('div');d.append(document.createTextNode(a+' '),el('b','',b));out.append(d)};
line('وزن هر قطعه:',fa(one,3)+' کیلوگرم');line('وزن کل:',fa(total,2)+' کیلوگرم ('+fa(total/1000,3)+' تن)');
if(price>0){const perKg=unitSel.value==='ton'?price/1000:price;line('بهای کل (هم‌واحد با قیمت واردشده):',fa(total*perKg))}
if(s.note)out.append(el('div','tk-note',s.note));out.append(el('div','tk-note','چگالی فولاد ۷٫۸۵ g/cm³ فرض شده است؛ وزن تئوریک با وزن باسکول تفاوت جزئی دارد.'))}
shapeSel.addEventListener('change',buildFields);for(const i of[countIn,priceIn,unitSel])i.addEventListener('input',calc);unitSel.addEventListener('change',calc);
const wg=el('div','tk-grid');wg.append(lab('نوع مقطع',shapeSel),lab('تعداد قطعه / شاخه',countIn));wc.append(wg,fieldsBox);const wg2=el('div','tk-grid');wg2.style.marginTop='9px';wg2.append(lab('قیمت (اختیاری)',priceIn),lab('واحد قیمت',unitSel));wc.append(wg2,out);
/* ---------- conversion margin ---------- */
const mc=el('div');root.append(el('h3','','حاشیه تبدیل زنجیره (مثلاً شمش ← میلگرد)'),el('p','tk-note','قیمت مواد اولیه، ضریب مصرف و هزینه تبدیل را وارد کنید تا حاشیه ناخالص محصول نهایی نشان داده شود. ضریب مصرف پیش‌فرض ۱٫۰۳ صرفاً مقدار نمونه است؛ مقدار واقعی کارخانه خود را وارد کنید.'),mc);
const mi={};const defs=[['inp','قیمت ماده اولیه (به ازای تن)',''],['yield','ضریب مصرف (تن ماده اولیه / تن محصول)','1.03'],['conv','هزینه تبدیل و سربار (به ازای تن محصول)',''],['out','قیمت فروش محصول (به ازای تن)','']];
const mg=el('div','tk-grid');for(const [k,t,d] of defs){const i=el('input');i.type='text';i.inputMode='decimal';i.value=d;i.addEventListener('input',mcalc);mi[k]=i;mg.append(lab(t,i))}const mout=el('div','tk-out');mc.append(mg,mout);
function mcalc(){const a=num(mi.inp.value),y=num(mi.yield.value),c=num(mi.conv.value||'0'),o=num(mi.out.value);mout.replaceChildren();if(!(a>0&&y>0&&o>0)||!Number.isFinite(c)){mout.textContent='قیمت ماده اولیه، ضریب مصرف و قیمت فروش را وارد کنید.';return}
const cost=a*y+c,m=o-cost,pc=m/o*100;const d=el('div');d.append(document.createTextNode('بهای تمام‌شده هر تن محصول: '),el('b','',fa(cost)));const d2=el('div');d2.append(document.createTextNode('حاشیه ناخالص: '),el('b',m>=0?'tk-up':'tk-down',fa(m)+' ('+fa(pc,1)+'٪ از قیمت فروش)'));const d3=el('div');d3.append(document.createTextNode('نقطه سربه‌سر قیمت فروش: '),el('b','',fa(cost)));mout.append(d,d2,d3)}
host.append(root);buildFields();mcalc();renderPulse();
window.addEventListener('fooladban:product-updated',renderPulse);window.addEventListener('fooladban:dashboard-selection-changed',renderPulse);window.addEventListener('storage',e=>{if(e.key===KEY)renderPulse()});
window.FooladbanToolkit={renderPulse,SHAPES};
})();
