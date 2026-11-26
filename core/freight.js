(()=>{
'use strict';
const $=id=>document.getElementById(id);
const host=$('layer-analysis');if(!host||$('fbFreightPanel'))return;
const KEY='fooladban.freight.v1',RATE_KEY='fooladban.freight.reference-rate.v1',BASE={rate:2045,currency:'تومان',unit:'تن‌ـ‌کیلومتر',effective:'۱۴۰۵/۰۸/۲۸',source:'شاخص اعلامی سازمان راهداری و حمل‌ونقل جاده‌ای',url:'https://www.24onlinenews.ir/%D8%A8%D8%AE%D8%B4-%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-4/66198-%D8%AC%D8%B2%D8%A6%DB%8C%D8%A7%D8%AA-%D8%A7%D9%81%D8%B2%D8%A7%DB%8C%D8%B4-%D9%86%D8%B1%D8%AE-%D8%AE%D8%AF%D9%85%D8%A7%D8%AA-%D8%AD%D9%85%D9%84-%D9%88%D9%86%D9%82%D9%84-%D8%AC%D8%A7%D8%AF%D9%87-%D8%A7%DB%8C-%D8%A7%D8%B9%D9%84%D8%A7%D9%85-%D8%B4%D8%AF'};
const fmt=n=>Number(n||0).toLocaleString('fa-IR',{maximumFractionDigits:1});
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}\nlet latestRate={...BASE};try{latestRate={...BASE,...(JSON.parse(localStorage.getItem(RATE_KEY)||'null')||{})}}catch{}
const panel=document.createElement('section');panel.className='fb-tool-panel';panel.id='fbFreightPanel';
panel.innerHTML=`
<style>
#fbFreightPanel{margin-top:14px}#fbFreightPanel h2{font-size:1rem;margin:0}#fbFreightPanel .freight-sub{font-size:.74rem;color:var(--muted);line-height:1.9;margin:6px 0 12px}
#fbFreightPanel .freight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#fbFreightPanel label{display:grid;gap:5px;font-size:.75rem;color:var(--muted)}
#fbFreightPanel input,#fbFreightPanel select{width:100%;min-width:0;background:#0b1a2a;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:10px}
#fbFreightPanel .wide{grid-column:1/-1}#fbFreightPanel .freight-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
#fbFreightPanel button{border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:9px;padding:9px 12px;font-size:.75rem}
#fbFreightPanel button.primary{background:var(--gold);color:#142337;font-weight:800}
#fbFreightPanel .freight-result{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:13px}
#fbFreightPanel .freight-metric{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px;min-width:0}
#fbFreightPanel .freight-metric small{display:block;color:var(--muted);font-size:.68rem}
#fbFreightPanel .freight-metric b{display:block;font-size:1rem;margin-top:5px;overflow-wrap:anywhere}
#fbFreightPanel .freight-source{margin-top:10px;padding:10px;border:1px dashed var(--line);border-radius:9px;color:var(--muted);font-size:.7rem;line-height:1.9}
#fbFreightPanel .freight-source a{color:var(--gold)}#fbFreightPanel .freight-history{display:grid;gap:7px;margin-top:10px}
#fbFreightPanel .freight-history article{padding:9px;border:1px solid var(--line);border-radius:9px;font-size:.72rem;display:flex;justify-content:space-between;gap:8px}
#fbFreightPanel .freight-status{font-size:.7rem;color:var(--muted);margin-top:8px;line-height:1.8}
@media(max-width:560px){#fbFreightPanel .freight-grid{grid-template-columns:1fr}#fbFreightPanel .freight-result{grid-template-columns:1fr}#fbFreightPanel .wide{grid-column:auto}}
</style>
<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h2>🚚 برآورد هزینه حمل</h2><span class="tag">حمل جاده‌ای داخلی</span></div>
<p class="freight-sub">مبدأ، مقصد، نوع محصول و تناژ را وارد کنید. فاصله مسیر را می‌توانید خودکار محاسبه یا دستی اصلاح کنید؛ کرایه بر پایه شاخص تن‌ـ‌کیلومتر برآورد می‌شود.</p>
<div class="freight-grid">
<label>مبدأ<input id="frOrigin" list="frCities" placeholder="مثلاً اصفهان"></label>
<label>مقصد<input id="frDestination" list="frCities" placeholder="مثلاً تهران"></label>
<datalist id="frCities"><option>تهران</option><option>اصفهان</option><option>اهواز</option><option>بندرعباس</option><option>تبریز</option><option>مشهد</option><option>یزد</option><option>کرمان</option><option>اراک</option><option>قزوین</option><option>قم</option><option>بندر امام خمینی</option><option>سیرجان</option><option>شاهرود</option><option>زنجان</option></datalist>
<label>نوع محصول<select id="frProduct"><option value="steel">محصولات فولادی (شمش، ورق و مقاطع)</option><option value="mineral">مواد معدنی و مواد اولیه فولاد</option><option value="other">سایر کالاها</option></select></label>
<label>تناژ محموله (تن)<input id="frTonnage" type="number" min=".1" step=".1" placeholder="مثلاً ۲۵"></label>
<label>مسافت جاده‌ای (کیلومتر)<input id="frDistance" type="number" min="1" step="1" placeholder="پس از تعیین مسیر"></label>
<label>مبنای ورود نرخ حمل<select id="frRateMode"><option value="auto">نرخ مرجع ثبت‌شده (خودکار)</option><option value="manual">ورود دستی نرخ</option></select></label>
<label id="frRateField">نرخ حمل (تومان / تن‌ـ‌کیلومتر)<input id="frRate" type="number" min="1" step="1" value="${BASE.rate}"></label>
<label>هزینه‌های جانبی (تومان)<input id="frExtras" type="number" min="0" step="1000" value="0"></label>
<label class="wide">توضیحات / شرایط حمل<input id="frNote" placeholder="مثلاً نیاز به کفی، بارگیری، بیمه یا تخلیه خاص"></label>
</div>
<div class="freight-actions"><button class="primary" id="frRoute">محاسبه خودکار مسافت</button><button class="primary" id="frCalculate">محاسبه هزینه حمل</button><button id="frSave">ثبت برآورد</button><button id="frLoadRate">بروزرسانی آخرین نرخ مرجع ثبت‌شده در برنامه</button></div>
<div class="freight-result" id="frResult"><div class="freight-metric"><small>کرایه پایه</small><b>—</b></div><div class="freight-metric"><small>هزینه کل محموله</small><b>—</b></div><div class="freight-metric"><small>هزینه حمل هر تن</small><b>—</b></div></div>
<div class="freight-source" id="frSource"></div><div class="freight-status" id="frStatus" role="status">برای شروع، مبدأ، مقصد، تناژ و مسافت را مشخص کنید.</div>
<div class="freight-history" id="frHistory"></div>`;
host.append(panel);
const val=id=>$(id)?.value?.trim()||'',num=id=>Number(val(id))||0;
function mode(){const manual=val('frRateMode')==='manual';$('frRate').disabled=!manual;$('frRateField').style.opacity=manual?'1':'.72'}
function rate(){return val('frRateMode')==='manual'?num('frRate'):Number(latestRate.rate)||BASE.rate}
function sourceText(){const manual=val('frRateMode')==='manual';$('frSource').innerHTML=manual?'<b>مبنای نرخ:</b> ورود دستی کاربر؛ صحت نرخ و تاریخ آن باید با بارنامه یا استعلام شرکت حمل کنترل شود.': 'آخرین نرخ مرجع ذخیره‌شده در برنامه: <b>'+fmt(latestRate.rate)+' تومان به‌ازای هر تن‌ـ‌کیلومتر</b>. تاریخ ثبت/اعتبار: '+safe(latestRate.effective||BASE.effective)+' · مرجع: '+safe(latestRate.source||BASE.source)+'. <a href="'+(latestRate.url||BASE.url)+'" target="_blank" rel="noopener">مشاهده مرجع</a> · بروزرسانی این مقدار در برنامه با ورود نرخ تأییدشده انجام می‌شود و اتصال زنده به سامانه بارنامه فعال نیست.'}
function calculate(){const o=val('frOrigin'),d=val('frDestination'),t=num('frTonnage'),km=num('frDistance'),r=rate(),extra=num('frExtras');if(!o||!d||o===d||!(t>0)||!(km>0)||!(r>0)){ $('frStatus').textContent='مبدأ و مقصد متفاوت، تناژ مثبت و مسافت معتبر را وارد کنید.';return null}
const base=t*km*r,total=base+extra,perTon=total/t,perKg=perTon/1000;
const values=[['کرایه پایه',base],['هزینه کل محموله',total],['هزینه حمل هر تن',perTon]];
$('frResult').innerHTML=values.map(([l,n])=>'<div class="freight-metric"><small>'+l+' (تومان)</small><b>'+fmt(n)+'</b></div>').join('');
$('frStatus').textContent='برآورد بر اساس '+fmt(t)+' تن × '+fmt(km)+' کیلومتر × '+fmt(r)+' تومان/تن‌ـ‌کیلومتر؛ هزینه جانبی: '+fmt(extra)+' تومان. هزینه حمل هر کیلوگرم: '+fmt(perKg)+' تومان.';
sourceText();return {origin:o,destination:d,product:val('frProduct'),tonnage:t,distanceKm:km,rate:r,extras:extra,base,total,perTon,perKg,mode:val('frRateMode'),createdAt:Date.now(),note:val('frNote')}}
let routeRequest=0;async function route(){const request=++routeRequest,o=val('frOrigin'),d=val('frDestination');if(!o||!d||o===d){$('frStatus').textContent='مبدأ و مقصد متفاوت را وارد کنید.';return}
$('frStatus').textContent='در حال یافتن مسیر جاده‌ای؛ نام شهرها را دقیق وارد کنید…';
try{const geo=async q=>{const u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ir&addressdetails=1&accept-language=fa&q='+encodeURIComponent(q+', ایران');const r=await fetch(u,{headers:{Accept:'application/json'}});if(!r.ok)throw Error('سرویس مسیریابی پاسخ نداد');const j=await r.json();if(!j[0])throw Error('شهر یا نشانی پیدا نشد: '+q);return j[0]};
const [a,b]=await Promise.all([geo(o),geo(d)]);if(request!==routeRequest)return;const u='https://router.project-osrm.org/route/v1/driving/'+a.lon+','+a.lat+';'+b.lon+','+b.lat+'?overview=false&alternatives=false';const rr=await fetch(u);if(!rr.ok)throw Error('محاسبه مسیر ممکن نشد');const data=await rr.json();if(request!==routeRequest)return;if(data.code!=='Ok'||!data.routes?.[0])throw Error('مسیر جاده‌ای پیدا نشد');const km=Math.ceil(data.routes[0].distance/1000);$('frDistance').value=km;$('frStatus').textContent='مسافت تقریبی مسیر جاده‌ای: '+fmt(km)+' کیلومتر · سرویس مسیریابی OpenStreetMap/OSRM؛ پیش از قرارداد، مسیر و فاصله را با بارنامه کنترل کنید.';calculate()
}catch(e){if(request===routeRequest)$('frStatus').textContent='مسافت خودکار در دسترس نیست: '+e.message+'؛ لطفاً مسافت را از مسیر معتبر وارد کنید.'}}
function history(){let list=[];try{list=JSON.parse(localStorage.getItem(KEY)||'{}').history||[]}catch{}$('frHistory').replaceChildren();if(!list.length)return;const title=document.createElement('div');title.className='freight-status';title.textContent='آخرین برآوردهای ثبت‌شده';$('frHistory').append(title);list.slice(0,5).forEach(x=>{const row=document.createElement('article');row.innerHTML='<span>'+safe(x.origin)+' ← '+safe(x.destination)+' · '+fmt(x.tonnage)+' تن · '+fmt(x.distanceKm)+' کیلومتر</span><b>'+fmt(x.total)+' تومان</b>'; $('frHistory').append(row)})}
$('frRateMode').addEventListener('change',()=>{mode();sourceText()});$('frRate').addEventListener('input',sourceText);$('frRoute').addEventListener('click',route);$('frOrigin').addEventListener('change',()=>{if(val('frOrigin')&&val('frDestination'))route()});$('frDestination').addEventListener('change',()=>{if(val('frOrigin')&&val('frDestination'))route()});$('frOrigin').addEventListener('blur',()=>{if(val('frOrigin')&&val('frDestination'))route()});$('frDestination').addEventListener('blur',()=>{if(val('frOrigin')&&val('frDestination'))route()});$('frCalculate').addEventListener('click',calculate);$('frLoadRate').addEventListener('click',()=>{const entered=prompt('نرخ جدید مرجع حمل (تومان به‌ازای هر تن‌ـ‌کیلومتر) را وارد کنید:',String(latestRate.rate));if(entered===null)return;const n=Number(String(entered).replace(/[,٬،\s]/g,''));if(!Number.isFinite(n)||n<=0){$('frStatus').textContent='نرخ واردشده معتبر نیست؛ عددی بزرگ‌تر از صفر وارد کنید.';return}const date=prompt('تاریخ اعتبار/ثبت نرخ را وارد کنید:',latestRate.effective||BASE.effective);if(date===null)return;latestRate={...latestRate,rate:n,effective:date.trim()||BASE.effective,updatedAt:Date.now()};localStorage.setItem(RATE_KEY,JSON.stringify(latestRate));$('frRateMode').value='auto';$('frRate').value=n;mode();sourceText();$('frStatus').textContent='آخرین نرخ مرجع برنامه بروزرسانی و ذخیره شد: '+fmt(n)+' تومان به‌ازای هر تن‌ـ‌کیلومتر.';if(num('frTonnage')&&num('frDistance))calculate()});
$('frSave').addEventListener('click',()=>{const x=calculate();if(!x)return;let data={};try{data=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}data.history=[x,...(data.history||[])].slice(0,50);localStorage.setItem(KEY,JSON.stringify(data));history();$('frStatus').textContent+=' · برآورد ذخیره شد.'});
mode();sourceText();history();
})();
