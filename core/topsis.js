(()=>{'use strict';
const panel=document.getElementById('fbTradeComparison');if(!panel)return;
const STORE='fooladban.topsis.scenarios.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>{const x=Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const fmt=x=>Number(x||0).toLocaleString('fa-IR',{maximumFractionDigits:2});
panel.innerHTML=`
<h2>رتبه‌بندی و تصمیم‌گیری</h2>
<p class="ta-muted">سناریوهای خرید یا فروش را تعریف کنید، معیارها و وزن آن‌ها را تنظیم کنید و گزینه‌ها را با روش TOPSIS رتبه‌بندی کنید. خروجی، ابزار پشتیبان تصمیم است و جایگزین بررسی اسناد و اعتبار طرف معامله نیست.</p>
<div class="ta-section"><h3>۱. فرآیند تعریف سناریو</h3><div class="ta-grid"><label>نوع فرآیند<select id="tpDirection"><option value="buy">خرید</option><option value="sell">فروش</option></select></label><label>تناژ مبنای معامله (تن)<input id="tpTonnage" type="number" min="0" step=".1" placeholder="اختیاری؛ برای محاسبه رقم کل"></label></div><div class="ta-note" id="tpDirectionHint"></div></div>
<div class="ta-section"><div class="ta-result-head"><h3>۲. معیارهای رتبه‌بندی</h3><span class="ta-pill">TOPSIS وزنی</span></div><p class="ta-note">وزن هر معیار را از صفر تا ۱۰ تعیین کنید. معیار هزینه‌ای با مقدار کمتر و معیار سود/مطلوبیت با مقدار بیشتر مطلوب‌تر است. امکان تعریف معیارهای اختصاصی نیز وجود دارد.</p><div id="tpCriteria" class="tp-criteria"></div><div class="ta-actions"><button type="button" id="tpAddCriterion">افزودن معیار جدید</button></div></div>
<div class="ta-section"><div class="ta-result-head"><h3>۳. تعریف گزینه‌ها و سناریوها</h3><button type="button" class="primary" id="tpAddAlternative">＋ افزودن سناریو</button></div><div id="tpAlternatives" class="tp-alternatives"></div><div class="ta-actions"><button type="button" class="primary" id="tpRank">رتبه‌بندی سناریوها با TOPSIS</button><button type="button" id="tpSave">ذخیره سناریوها</button><button type="button" id="tpClear">پاک‌کردن نتایج</button></div><div class="ta-status" id="tpStatus" role="status">حداقل دو سناریو تعریف کنید و مقادیر معیارها را وارد کنید.</div></div>
<div class="ta-section"><h3>۴. نتیجه رتبه‌بندی و پیشنهاد تصمیم</h3><div id="tpResults"><div class="ta-empty">پس از تکمیل اطلاعات، رتبه‌بندی و امتیاز نزدیکی به گزینه ایده‌آل نمایش داده می‌شود.</div></div></div>`;
const css=document.createElement('style');css.textContent='#fbTradeComparison .tp-criteria{display:grid;gap:7px}#fbTradeComparison .tp-criterion{display:grid;grid-template-columns:minmax(130px,1.5fr) minmax(80px,.6fr) minmax(130px,1fr) auto;gap:7px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:9px;background:var(--panel)}#fbTradeComparison .tp-criterion input,#fbTradeComparison .tp-criterion select,#fbTradeComparison .tp-alt input,#fbTradeComparison .tp-alt select{width:100%;min-width:0;background:#0b1a2a;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px;font:inherit;font-size:.72rem}#fbTradeComparison .tp-criterion small{color:var(--muted);font-size:.65rem}#fbTradeComparison .tp-alternatives{display:grid;gap:10px;margin-top:10px}#fbTradeComparison .tp-alt{border:1px solid var(--line);border-radius:11px;padding:10px;background:var(--panel);min-width:0}#fbTradeComparison .tp-alt-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}#fbTradeComparison .tp-alt-head b{font-size:.8rem}#fbTradeComparison .tp-alt-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#fbTradeComparison .tp-alt label{display:grid;gap:4px;color:var(--muted);font-size:.68rem;min-width:0}#fbTradeComparison .tp-alt .tp-name{margin-bottom:8px}#fbTradeComparison .tp-remove{padding:6px 9px;color:#e58b8b}#fbTradeComparison .tp-rank-row{display:grid;grid-template-columns:45px minmax(0,1.5fr) minmax(75px,.7fr) minmax(95px,.8fr);gap:8px;align-items:center;padding:10px 7px;border-bottom:1px solid var(--line);font-size:.72rem}#fbTradeComparison .tp-rank-row:first-child{font-weight:800;color:var(--muted)}#fbTradeComparison .tp-rank-row.top{background:#d9b66c12;border:1px solid var(--gold);border-radius:9px}#fbTradeComparison .tp-bar{height:7px;border-radius:9px;background:var(--line);overflow:hidden;margin-top:5px}#fbTradeComparison .tp-bar i{display:block;height:100%;background:var(--gold)}#fbTradeComparison .tp-explain{font-size:.7rem;color:var(--muted);line-height:1.9;margin-top:10px}@media(max-width:620px){#fbTradeComparison .tp-criterion{grid-template-columns:1fr 1fr}#fbTradeComparison .tp-criterion input:first-child{grid-column:1/-1}#fbTradeComparison .tp-alt-grid{grid-template-columns:1fr 1fr}#fbTradeComparison .tp-rank-row{grid-template-columns:30px minmax(0,1fr) 75px}#fbTradeComparison .tp-rank-row>*:last-child{grid-column:2/-1}}';document.head.append(css);
const $=id=>document.getElementById(id);
const criteria=[
{key:'price',name:'قیمت معامله هر تن (تومان)',weight:5,type:'cost',unit:'تومان/تن'},
{key:'freight',name:'هزینه حمل هر تن (تومان)',weight:4,type:'cost',unit:'تومان/تن'},
{key:'risk',name:'ریسک معامله (۱ تا ۵)',weight:5,type:'cost',unit:'امتیاز'},
{key:'paymentCost',name:'هزینه مالی و پرداخت هر تن (تومان)',weight:4,type:'cost',unit:'تومان/تن'},
{key:'paymentScore',name:'مطلوبیت سازوکار پرداخت (۱ تا ۵)',weight:3,type:'benefit',unit:'امتیاز'},
{key:'other',name:'سایر هزینه‌ها هر تن (تومان)',weight:2,type:'cost',unit:'تومان/تن'},
{key:'delivery',name:'زمان تحویل (روز)',weight:2,type:'cost',unit:'روز'},
{key:'quality',name:'انطباق فنی و کیفیت (۱ تا ۵)',weight:3,type:'benefit',unit:'امتیاز'}
];
let alternatives=[],altCounter=0,customCounter=0;
const defaults=()=>({price:'',freight:'',risk:'3',paymentCost:'',paymentScore:'3',other:'0',delivery:'',quality:'3'});
const direction=()=>$('tpDirection').value;
function addAlternative(name){alternatives.push({id:'alt-'+(++altCounter),name:name||'سناریوی '+(alternatives.length+1),payment:'cash',values:defaults()})}
function renderCriteria(){
 const box=$('tpCriteria');box.innerHTML='';
 criteria.forEach((q,i)=>{
  const row=document.createElement('div');row.className='tp-criterion';
  const name=document.createElement('input');name.value=q.name;name.setAttribute('aria-label','نام معیار');name.addEventListener('change',()=>{q.name=name.value.trim()||q.name;renderAlternatives()});
  const weight=document.createElement('label');weight.innerHTML='<small>وزن ۰ تا ۱۰</small>';const w=document.createElement('input');w.type='number';w.min='0';w.max='10';w.step='.5';w.value=q.weight;w.addEventListener('change',()=>q.weight=Math.max(0,Math.min(10,number(w.value)||0)));weight.append(w);
  const type=document.createElement('select');type.innerHTML='<option value="cost">هزینه‌ای · کمتر بهتر</option><option value="benefit">سود/مطلوبیت · بیشتر بهتر</option>';type.value=q.type;type.addEventListener('change',()=>q.type=type.value);
  const del=document.createElement('button');del.type='button';del.className='tp-remove';del.textContent='حذف';del.disabled=!q.custom;del.addEventListener('click',()=>{criteria.splice(i,1);alternatives.forEach(a=>delete a.values[q.key]);renderCriteria();renderAlternatives()});
  row.append(name,weight,type,del);box.append(row);
 });
}
function renderAlternatives(){
 const box=$('tpAlternatives');box.innerHTML='';
 alternatives.forEach((a,index)=>{
  const card=document.createElement('article');card.className='tp-alt';
  const head=document.createElement('div');head.className='tp-alt-head';head.innerHTML='<b>گزینه '+(index+1)+'</b>';
  const remove=document.createElement('button');remove.type='button';remove.className='tp-remove';remove.textContent='حذف سناریو';remove.addEventListener('click',()=>{alternatives=alternatives.filter(x=>x.id!==a.id);renderAlternatives()});head.append(remove);
  const name=document.createElement('label');name.className='tp-name';name.textContent='نام سناریو / محصول / طرف معامله';const ni=document.createElement('input');ni.value=a.name;ni.placeholder='مثلاً خرید نقدی ورق از کارخانه الف';ni.addEventListener('input',()=>a.name=ni.value);name.append(ni);
  const pay=document.createElement('label');pay.textContent='مکانیزم پرداخت';const ps=document.createElement('select');ps.innerHTML='<option value="cash">نقدی / پیش‌پرداخت</option><option value="delivery">پرداخت هنگام تحویل</option><option value="30">اعتباری ۳۰ روزه</option><option value="60">اعتباری ۶۰ روزه</option><option value="90">اعتباری ۹۰ روزه</option><option value="lc">اعتبار اسنادی / ضمانت‌نامه</option><option value="other">توافقی / سایر</option>';ps.value=a.payment||'cash';ps.addEventListener('change',()=>a.payment=ps.value);pay.append(ps);
  const grid=document.createElement('div');grid.className='tp-alt-grid';
  criteria.forEach(q=>{const label=document.createElement('label');label.textContent=q.name;const input=document.createElement('input');input.type='number';input.step='any';input.placeholder=q.unit||'مقدار';input.value=a.values[q.key]??'';input.addEventListener('input',()=>a.values[q.key]=input.value);label.append(input);grid.append(label)});
  card.append(head,name,pay,grid);box.append(card);
 });
}
function updateDirection(){
 const buy=direction()==='buy',p=criteria.find(x=>x.key==='price');
 if(p){p.type=buy?'cost':'benefit';p.name=buy?'قیمت خرید هر تن (تومان)':'قیمت فروش هر تن (تومان)'}
 $('tpDirectionHint').textContent=buy?'در خرید، قیمت معامله، حمل، ریسک، هزینه مالی و سایر هزینه‌ها معمولاً معیار هزینه‌ای هستند؛ مطلوبیت پرداخت و انطباق فنی معیار سود/مطلوبیت‌اند.':'در فروش، قیمت فروش معیار سود/مطلوبیت است؛ هزینه حمل، ریسک، هزینه مالی و سایر هزینه‌ها معیار هزینه‌ای هستند. مطلوبیت پرداخت و انطباق فنی معیار سود/مطلوبیت‌اند.';
 renderCriteria();renderAlternatives();
}
function rank(){
 const active=criteria.filter(q=>Number(q.weight)>0);
 if(alternatives.length<2){$('tpStatus').textContent='برای رتبه‌بندی TOPSIS حداقل دو سناریو لازم است.';return}
 if(!active.length){$('tpStatus').textContent='وزن حداقل یک معیار را بیشتر از صفر قرار دهید.';return}
 const matrix=alternatives.map(a=>active.map(q=>number(a.values[q.key]))),missing=[];
 matrix.forEach((row,i)=>row.forEach((x,j)=>{if(x===null)missing.push(alternatives[i].name+' / '+active[j].name)}));
 if(missing.length){$('tpStatus').textContent='مقادیر تکمیل‌نشده: '+missing.slice(0,5).join('، ')+(missing.length>5?' و موارد دیگر':'');return}
 const norms=active.map((q,j)=>Math.sqrt(matrix.reduce((s,row)=>s+row[j]*row[j],0)));
 const totalWeight=active.reduce((s,q)=>s+Number(q.weight),0);
 const weighted=matrix.map(row=>row.map((x,j)=>norms[j]===0?0:x/norms[j]*(Number(active[j].weight)/totalWeight)));
 const ideal=active.map((q,j)=>{const v=weighted.map(row=>row[j]);return q.type==='benefit'?Math.max(...v):Math.min(...v)});
 const anti=active.map((q,j)=>{const v=weighted.map(row=>row[j]);return q.type==='benefit'?Math.min(...v):Math.max(...v)});
 const results=alternatives.map((a,i)=>{const dp=Math.sqrt(weighted[i].reduce((s,x,j)=>s+(x-ideal[j])**2,0)),dm=Math.sqrt(weighted[i].reduce((s,x,j)=>s+(x-anti[j])**2,0));return {...a,score:dp+dm?dm/(dp+dm):0}}).sort((a,b)=>b.score-a.score);
 results.forEach((x,i)=>x.rank=i+1);
 const top=results[0],pct=x=>(x.score*100).toLocaleString('fa-IR',{maximumFractionDigits:1}),qty=number($('tpTonnage').value),price=number(top.values.price);
 const total=qty&&price!==null?fmt(qty*price)+' تومان':'تناژ وارد نشده است';
 const rows=results.map(x=>'<div class="tp-rank-row '+(x.rank===1?'top':'')+'"><b>'+x.rank+'</b><span><strong>'+esc(x.name)+'</strong><div class="tp-bar"><i style="width:'+Math.max(0,Math.min(100,x.score*100))+'%"></i></div></span><b>'+pct(x)+'٪</b><span>'+(x.rank===1?'گزینه برتر':'رتبه '+x.rank)+'</span></div>').join('');
 $('tpResults').innerHTML='<div class="tp-rank-row"><b>رتبه</b><span>سناریو</span><b>امتیاز نزدیکی</b><span>نتیجه</span></div>'+rows+'<div class="tp-explain"><b>پیشنهاد TOPSIS:</b> '+esc(top.name)+' با امتیاز نزدیکی '+pct(top)+'٪ در رتبه نخست قرار گرفت. این امتیاز بر اساس فاصله نسبی از راه‌حل ایده‌آل مثبت و منفی و وزن معیارهای فعال محاسبه شده است. '+(qty?'تناژ مبنا: '+fmt(qty)+' تن · رقم پایه گزینه اول: '+total+'.':'')+'<br>نتیجه به معیارها، وزن‌ها و داده‌های واردشده وابسته است؛ اطلاعات مهم را پیش از تصمیم نهایی راستی‌آزمایی کنید.</div>';
 $('tpStatus').textContent=results.length+' سناریو با '+active.length+' معیار وزن‌دار رتبه‌بندی شد.';
 window.__fooladbanTopsisLast={createdAt:Date.now(),direction:direction(),tonnage:qty||null,criteria:active.map(x=>({...x})),results:results.map(x=>({name:x.name,score:x.score,rank:x.rank,values:x.values}))};
}
$('tpDirection').addEventListener('change',updateDirection);
$('tpAddAlternative').addEventListener('click',()=>{addAlternative();renderAlternatives()});
$('tpAddCriterion').addEventListener('click',()=>{const key='custom-'+(++customCounter);criteria.push({key,name:'معیار جدید '+customCounter,weight:1,type:'cost',unit:'مقدار',custom:true});alternatives.forEach(a=>a.values[key]='');renderCriteria();renderAlternatives()});
$('tpRank').addEventListener('click',rank);
$('tpSave').addEventListener('click',()=>{localStorage.setItem(STORE,JSON.stringify({direction:direction(),tonnage:$('tpTonnage').value,criteria,alternatives}));$('tpStatus').textContent='سناریوها و معیارها در حافظه همین دستگاه ذخیره شدند.'});
$('tpClear').addEventListener('click',()=>$('tpResults').innerHTML='<div class="ta-empty">نتایج پاک شد؛ تعریف سناریوها حفظ شده است.</div>');
try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&Array.isArray(saved.criteria)&&Array.isArray(saved.alternatives)){criteria.splice(0,criteria.length,...saved.criteria);alternatives=saved.alternatives;altCounter=alternatives.length;customCounter=criteria.filter(x=>x.custom).length;$('tpDirection').value=saved.direction==='sell'?'sell':'buy';$('tpTonnage').value=saved.tonnage||''}}catch{}
if(!alternatives.length){addAlternative('سناریوی اول');addAlternative('سناریوی دوم')}
updateDirection();
})();