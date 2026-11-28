(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='fooladban.v1',fmt=n=>Number(n||0).toLocaleString('fa-IR',{maximumFractionDigits:2}),date=t=>new Date(Number(t)).toLocaleDateString('fa-IR');
const style=document.createElement('style');style.textContent=`
.fb-tool-panel{background:linear-gradient(145deg,var(--panel),#102035);border:1px solid var(--line);border-radius:16px;padding:15px;margin:0 0 14px}
.fb-tool-panel h2{font-size:1rem;margin:0 0 8px}.fb-tool-muted{font-size:.76rem;color:var(--muted);line-height:1.9}
.fb-compare-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}
.fb-compare-controls label,.fb-assistant-form label{display:grid;gap:5px;font-size:.78rem;color:var(--muted)}
.fb-compare-controls select,.fb-assistant-form select,.fb-assistant-form input,.fb-assistant-form textarea{width:100%;min-width:0;background:#0b1a2a;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:10px}
.fb-compare-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;max-height:210px;overflow:auto;margin:10px 0}
.fb-compare-item{display:flex;gap:7px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);font-size:.76rem}
.fb-compare-item input{accent-color:var(--gold)}.fb-compare-canvas{width:100%;height:300px;display:block}.fb-compare-legend{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.fb-compare-legend span{font-size:.72rem;display:flex;align-items:center;gap:5px}.fb-dot{width:9px;height:9px;border-radius:50%;display:inline-block}
.fb-assistant-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.fb-assistant-form .wide{grid-column:1/-1}.fb-assistant-form textarea{min-height:76px;resize:vertical}
.fb-tool-btn{border:1px solid var(--gold);background:var(--gold);color:#142337;border-radius:10px;padding:11px 14px;font-weight:800}.fb-assistant-results{display:grid;gap:10px;margin-top:14px}.fb-recommendation{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--panel2)}.fb-recommendation b{display:block;margin-bottom:6px}.fb-recommendation small{color:var(--muted);line-height:1.8}.fb-assistant-results .tag{display:inline-block;border:1px solid var(--line);border-radius:20px;padding:3px 8px;margin:3px;font-size:.7rem}
@media(max-width:560px){.fb-compare-controls,.fb-assistant-form,.fb-compare-list{grid-template-columns:1fr}.fb-compare-canvas{height:250px}}
`;document.head.append(style);
const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {products:[]}}};
const products=()=>{const selected=new Set((window.FooladbanMarketConfig?.selectedProducts||[]).map(String));return Array.isArray(state().products)?state().products.filter(p=>selected.has(String(p.catalogId||p.productKey||''))):[]};
const analysis=$('layer-analysis'),assistant=$('layer-assistant');
if(analysis){
const panel=document.createElement('section');panel.className='fb-tool-panel';panel.innerHTML='<h2>مقایسه روند قیمت چند محصول</h2><p class="fb-tool-muted">محصولات را انتخاب کنید تا تاریخچه قیمت آن‌ها روی یک نمودار زمان ـ قیمت نمایش داده شود. برای مقایسه محصولات با ارز یا واحد متفاوت، حالت شاخصی (مبنای ۱۰۰) را انتخاب کنید.</p>';
const controls=document.createElement('div');controls.className='fb-compare-controls';
const range=document.createElement('select');[['all','تمام تاریخچه'],['7','۷ روز اخیر'],['30','۳۰ روز اخیر'],['90','۹۰ روز اخیر'],['365','یک سال اخیر']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;range.append(o)});
const mode=document.createElement('select');[['index','شاخص تغییرات (شروع = ۱۰۰)'],['raw','قیمت واقعی (واحد یکسان لازم است)']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;mode.append(o)});
const list=document.createElement('div');list.className='fb-compare-list';const canvas=document.createElement('canvas');canvas.className='fb-compare-canvas';canvas.setAttribute('aria-label','نمودار مقایسه روند قیمت محصولات');const legend=document.createElement('div');legend.className='fb-compare-legend';const note=document.createElement('div');note.className='fb-tool-muted';note.textContent='داده‌ها از تاریخچه قیمت ذخیره‌شده در دیده‌بان خوانده می‌شوند. اگر محصولی سابقه ثبت‌شده نداشته باشد، در نمودار ظاهر نمی‌شود.';
controls.append(range,mode);panel.append(controls,list,canvas,legend,note);analysis.append(panel);
const palette=['#d9b66c','#58c69a','#73b9e8','#e58caa','#b69be8','#e6a36a','#63c8c2','#d5dc79'];
function draw(){
const all=products(),selected=[...list.querySelectorAll('input:checked')].map(x=>x.value),days=range.value==='all'?Infinity:Number(range.value),cut=days===Infinity?0:Date.now()-days*86400000;
const sets=selected.map(id=>all.find(p=>p.id===id)).filter(Boolean).map(p=>({...p,pts:(p.history||[]).filter(x=>Number(x.time)>=cut&&Number(x.price)>0).sort((a,b)=>a.time-b.time)})).filter(p=>p.pts.length);
legend.replaceChildren();const ctx=canvas.getContext('2d'),w=canvas.clientWidth||600,h=canvas.clientHeight||300,dpr=window.devicePixelRatio||1;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
if(!sets.length){ctx.fillStyle='#9aafc4';ctx.textAlign='center';ctx.font='13px sans-serif';ctx.fillText('برای محصولات انتخاب‌شده هنوز تاریخچه قیمت کافی ثبت نشده است',w/2,h/2);note.textContent='ابتدا محصولات را در دیده‌بان بررسی کنید تا مشاهدات قیمت در تاریخچه ذخیره شود.';return}
const compatible=sets.every(p=>p.currency===sets[0].currency&&p.measureUnit===sets[0].measureUnit);
const raw=mode.value==='raw'&&compatible;
if(mode.value==='raw'&&!compatible)note.textContent='واحد ارز یا اندازه‌گیری محصولات یکسان نیست؛ نمودار به‌صورت شاخصی نمایش داده می‌شود. برای مقایسه قیمت واقعی، واحدها را همسان کنید.';
else note.textContent=raw?'قیمت‌ها با واحد مشترک '+(sets[0].currency||'')+'/'+(sets[0].measureUnit||'')+' نمایش داده شده‌اند.':'هر سری نسبت به اولین مشاهده همان محصول به شاخص ۱۰۰ تبدیل شده است؛ این حالت برای مقایسه درصد تغییر مناسب است.';
const normalized=sets.map((p,i)=>({p,i,pts:p.pts.map(x=>({time:Number(x.time),v:raw?Number(x.price):Number(x.price)/Number(p.pts[0].price)*100}))}));
const minT=Math.min(...normalized.flatMap(s=>s.pts.map(p=>p.time))),maxT=Math.max(...normalized.flatMap(s=>s.pts.map(p=>p.time)));
const vals=normalized.flatMap(s=>s.pts.map(p=>p.v)),minV=Math.min(...vals),maxV=Math.max(...vals),span=maxV-minV||Math.max(1,Math.abs(maxV)*.03),pad={l:54,r:14,t:18,b:35};
const x=t=>pad.l+(t-minT)/Math.max(1,maxT-minT)*(w-pad.l-pad.r),y=v=>h-pad.b-(v-minV)/span*(h-pad.t-pad.b);
ctx.strokeStyle='#29415b';ctx.lineWidth=1;ctx.fillStyle='#9aafc4';ctx.font='10px sans-serif';ctx.textAlign='right';
for(let i=0;i<5;i++){const v=minV+(maxV-minV)*i/4,yy=y(v);ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.fillText(fmt(v),pad.l-6,yy+3)}
normalized.forEach((s,i)=>{const color=palette[i%palette.length];ctx.strokeStyle=color;ctx.lineWidth=2.3;ctx.beginPath();s.pts.forEach((p,j)=>j?ctx.lineTo(x(p.time),y(p.v)):ctx.moveTo(x(p.time),y(p.v)));ctx.stroke();s.pts.forEach(p=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x(p.time),y(p.v),2.5,0,Math.PI*2);ctx.fill()});const item=document.createElement('span');const dot=document.createElement('i');dot.className='fb-dot';dot.style.background=color;item.append(dot,document.createTextNode(s.p.name));legend.append(item)});
ctx.textAlign='center';ctx.fillStyle='#9aafc4';ctx.fillText(date(minT),pad.l,h-9);ctx.fillText(date(maxT),w-pad.r,h-9);
}
function refreshList(){const all=products(),old=new Set([...list.querySelectorAll('input:checked')].map(x=>x.value));list.replaceChildren();all.forEach(p=>{const label=document.createElement('label');label.className='fb-compare-item';const cb=document.createElement('input');cb.type='checkbox';cb.value=p.id;cb.checked=old.has(p.id);cb.addEventListener('change',draw);label.append(cb,document.createTextNode(p.name));list.append(label)});draw()}
range.addEventListener('change',draw);mode.addEventListener('change',draw);refreshList();window.addEventListener('fooladban:product-updated',refreshList);window.addEventListener('fooladban:dashboard-selection-changed',refreshList);window.addEventListener('storage',refreshList);window.addEventListener('resize',draw);setInterval(()=>{const n=products().length;if(n!==list.querySelectorAll('label').length)refreshList()},4000);
}
if(assistant){
const panel=document.createElement('section');panel.className='fb-tool-panel';panel.innerHTML='<h2>پیشنهاد محصول متناسب با نیاز شما</h2><p class="fb-tool-muted">به چند پرسش کوتاه پاسخ دهید. دستیار، محصولات دارای قیمت ثبت‌شده را با توجه به حوزه مصرف، مقصد، مشخصات، بودجه و شرایط تحویل رتبه‌بندی می‌کند.</p>';
const form=document.createElement('form');form.className='fb-assistant-form';
function field(label,control,wide=false){const l=document.createElement('label');if(wide)l.className='wide';l.append(document.createTextNode(label),control);form.append(l);return control}
function select(placeholder,items){const s=document.createElement('select');const o=document.createElement('option');o.value='';o.textContent=placeholder;s.append(o);items.forEach(v=>{const x=document.createElement('option');x.value=v;x.textContent=v;s.append(x)});return s}
const area=field('حوزه مصرف / صنعت',select('حوزه موردنظر را انتخاب کنید',['ساختمان و سازه','خودروسازی','لوازم خانگی','نفت، گاز و پتروشیمی','معدن و فولادسازی','تولید ماشین‌آلات','تجارت و بازرگانی','سایر']));
const destination=field('مقصد تحویل / محل مصرف',Object.assign(document.createElement('input'),{placeholder:'مثلاً تهران، اصفهان، بندرعباس یا کشور مقصد'}));
const need=field('محصول یا کاربرد موردنظر',Object.assign(document.createElement('input'),{placeholder:'مثلاً ورق گرم، میلگرد، شمش یا پیشنهاد بده'}));
const spec=field('گرید / کیفیت / ابعاد',Object.assign(document.createElement('input'),{placeholder:'مثلاً ST37، ضخامت ۲ میلی‌متر، میلگرد A3'}));
const budget=field('بودجه تقریبی (اختیاری)',Object.assign(document.createElement('input'),{inputMode:'decimal',placeholder:'مبلغ و واحد پول را وارد کنید'}));
const quantity=field('مقدار موردنیاز (اختیاری)',Object.assign(document.createElement('input'),{placeholder:'مثلاً ۲۰ تن'}));
const delivery=field('شرایط تحویل',select('انتخاب کنید',['درب کارخانه','انبار مقصد','تحویل در محل مشتری','FOB','CFR','CIF','EXW','DAP','بدون ترجیح']));
const extra=field('توضیحات تکمیلی',Object.assign(document.createElement('textarea'),{placeholder:'زمان خرید، اولویت قیمت یا کیفیت، محدودیت حمل و هر نکته دیگر'}),true);
const submit=document.createElement('button');submit.className='fb-tool-btn wide';submit.type='submit';submit.textContent='پیشنهاد گزینه‌های مناسب';form.append(submit);const results=document.createElement('div');results.className='fb-assistant-results';panel.append(form,results);assistant.append(panel);
form.addEventListener('submit',e=>{e.preventDefault();const all=products(),q=[area.value,need.value,spec.value,destination.value,delivery.value,extra.value].join(' ').toLowerCase(),matches=all.filter(p=>{const h=(p.history||[]).filter(x=>Number(x.price)>0),latest=h.at(-1);return latest&&!p.disabled}).map(p=>{const history=p.history.filter(x=>Number(x.price)>0),last=history.at(-1),hay=[p.name,p.group,p.specification,p.productGrade,p.productSize,p.productManufacturer,p.delivery,p.market].join(' ').toLowerCase();let score=0;const terms=q.split(/[\s،,]+/).filter(x=>x.length>2);terms.forEach(t=>{if(hay.includes(t))score+=2});if(delivery.value&&delivery.value!=='بدون ترجیح'&&(p.delivery||'').includes(delivery.value))score+=5;if(destination.value&&String(p.delivery||'').includes(destination.value))score+=4;if(spec.value&&hay.includes(spec.value.toLowerCase()))score+=5;if(need.value&&hay.includes(need.value.toLowerCase()))score+=6;const age=Date.now()-Number(last.time);if(age<86400000)score+=3;else if(age<7*86400000)score+=1;return{p,last,score,age,history}}).sort((a,b)=>b.score-a.score||a.last.price-b.last.price);
results.replaceChildren();const intro=document.createElement('p');intro.className='fb-tool-muted';intro.textContent='نتایج بر اساس داده‌های ثبت‌شده در دیده‌بان و تطبیق مشخصات مرتب شده‌اند. پیشنهاد قطعی خرید نیستند؛ قیمت و موجودی باید پیش از معامله از فروشنده تأیید شود.';results.append(intro);
if(!matches.length){const empty=document.createElement('div');empty.className='fb-recommendation';empty.textContent='در حال حاضر برای محصولات شما قیمت معتبر و ثبت‌شده‌ای پیدا نشد. ابتدا منابع قیمت را تنظیم و محصولات را بررسی کنید؛ دستیار قیمت یا موجودی را حدس نمی‌زند.';results.append(empty);return}
matches.slice(0,5).forEach((m,i)=>{const card=document.createElement('article');card.className='fb-recommendation';const b=document.createElement('b');b.textContent=(i+1)+'. '+m.p.name;const meta=document.createElement('small');meta.textContent='آخرین قیمت: '+fmt(m.last.price)+' '+(m.p.currency||'')+'/'+(m.p.measureUnit||'')+' · تاریخ: '+date(m.last.time)+' · '+(m.p.sourceName||m.p.sourceRef||'منبع ثبت‌شده')+' · محل تحویل: '+(m.p.delivery||'نامشخص');const why=document.createElement('div');why.className='fb-tool-muted';why.textContent='امتیاز تطبیق: '+m.score+' · '+(m.age<86400000?'داده کمتر از ۲۴ ساعت':'تازگی داده نیازمند بررسی')+' · '+(m.p.specification||'مشخصات فنی کامل ثبت نشده');card.append(b,meta,why);results.append(card)});
});
}
})();