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
  { id:'markazeahan', hosts:['markazeahan.com','www.markazeahan.com'], method:'product-page-jsonld', confidence:'conditional', note:'صفحه اختصاصی کالا؛ نیازمند تطبیق گرید، سایز و کارخانه.' },
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
