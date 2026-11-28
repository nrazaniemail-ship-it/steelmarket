const test=require('node:test');
const assert=require('node:assert/strict');
test('source-specific steel price adapters',async t=>{
 const {identifyAdapter,extractStructuredPrice,tradingEconomicsUrl}=await import('../workers/source-adapters.js');
 await t.test('recognizes supported sources',()=>{
  assert.equal(identifyAdapter('https://ahanonline.com/product/example').id,'ahanonline');
  assert.equal(identifyAdapter('https://fa.tradingeconomics.com/commodity/steel').id,'tradingeconomics');
  assert.equal(identifyAdapter('https://pivan.co/product/x').id,'pivan');
  assert.equal(identifyAdapter('https://www.ime.co.ir/offer-stat.html').id,'ime');
  assert.equal(identifyAdapter('https://unknown.example/prices').id,'custom');
 });
 await t.test('maps catalogue products to Trading Economics pages',()=>{
  assert.equal(tradingEconomicsUrl('hot-rolled'),'https://fa.tradingeconomics.com/commodity/hrc-steel');
  assert.equal(tradingEconomicsUrl('iron-ore-fines'),'https://fa.tradingeconomics.com/commodity/iron-ore');
  assert.equal(tradingEconomicsUrl('not-mapped'),null);
 });
 await t.test('extracts Trading Economics visible Actual benchmark price',()=>{
  const html='<html><body><h1>HRC Steel</h1><div>Actual</div><div>1,429.00</div></body></html>';
  assert.equal(extractStructuredPrice(html,'tradingeconomics'),1429);
 });
 await t.test('extracts Product Offer price from JSON-LD',()=>{
  const html='<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Rebar","offers":{"@type":"Offer","price":"115450","priceCurrency":"IRR"}}</script>';
  assert.equal(extractStructuredPrice(html,'ahanonline'),115450);
 });
 await t.test('extracts OpenGraph price',()=>{
  assert.equal(extractStructuredPrice('<meta property="product:price:amount" content="1429.05">','tradingeconomics'),1429.05);
 });
 await t.test('does not guess when no structured price exists',()=>{
  assert.equal(extractStructuredPrice('<html><body>Steel market is stable</body></html>','custom'),null);
 });
 await t.test('parses weighted latest-day IME physical trades and converts Rial to Toman',async()=>{
  const {extractImeTradePrice}=await import('../workers/source-adapters.js');
  const payload={d:JSON.stringify([
   {GoodsName:'ورق گرم',ProducerName:'فولاد الف',Price:100000,Quantity:100,date:'1405/09/05'},
   {GoodsName:'ورق گرم',ProducerName:'فولاد ب',Price:120000,Quantity:300,date:'1405/09/05'},
   {GoodsName:'ورق گرم',ProducerName:'فولاد ج',Price:90000,Quantity:500,date:'1405/09/04'}
  ])};
  const result=extractImeTradePrice(payload,{product_key:'hot-rolled',product_name:'ورق گرم',currency:'IRT',measure_unit:'kg'});
  assert.equal(result.sourceDate,'1405/09/05');
  assert.equal(result.rows,2);
  assert.equal(result.price,11500);
 });
 await t.test('maps black-sheet catalog key to hot-rolled IME trades without treating its label as a producer',async()=>{
  const {extractImeTradePrice}=await import('../workers/source-adapters.js');
  const payload={d:JSON.stringify([{GoodsName:'ورق گرم',ProducerName:'فولاد مبارکه',Price:175000,Quantity:20,date:'1405/09/07'}])};
  const result=extractImeTradePrice(payload,{product_key:'black-sheet',product_name:'ورق سیاه',currency:'IRT',measure_unit:'kg'});
  assert.equal(result.price,17500);
  assert.equal(result.sourceDate,'1405/09/07');
 });
 await t.test('does not invent an IME price when no matching trade exists',async()=>{
  const {extractImeTradePrice}=await import('../workers/source-adapters.js');
  assert.equal(extractImeTradePrice({d:'[]'},{product_key:'hot-rolled',product_name:'ورق گرم'}),null);
 });

 await t.test('supports black-sheet catalog key in Markaz Ahan and Iromart exact-price adapters',async()=>{
  const {extractMarkazAhanTelegramPrice,extractIromartTelegramPrice}=await import('../workers/source-adapters.js');
  const source={product_key:'black-sheet',product_name:'ورق سیاه',specification:'2 میلیمتر عرض 1.25 فولاد سبا',delivery:'انبار اصفهان'};
  const markaz='<div class="tgme_widget_message_text js-message_text">#ورق_سیاه<br>ورق سیاه ضخامت 2 میلیمتر فولاد سبا عرض 1.25 انبار اصفهان ⬅ 163,636 تومان</div>';
  assert.equal(extractMarkazAhanTelegramPrice(markaz,source),163636);
  const iro={...source,specification:'20 میلیمتر کاویان',delivery:'انبار اهواز'};
  const telegram='<div class="tgme_widget_message_text">#قیمت_ورق_سیاه<br>ورق سیاه ضخامت 20 میل کاویان انبار اهواز قیمت 32,000 تومان/کیلو</div>';
  assert.deepEqual(extractIromartTelegramPrice(telegram,iro),{price:32000,sourceDate:null});
 });
 await t.test('extracts exact Ahanonline hot-rolled sheet table row and update date',async()=>{
  const {extractIranianSheetTablePrice}=await import('../workers/source-adapters.js');
  const html='<h3>ورق سیاه 2 میل</h3><table><tr><td>2500*1250</td><td>فولاد مبارکه</td><td>برش خورده</td><td>بنگاه تهران</td><td>176,290</td></tr></table><p>آخرین بروز رسانی : 1405/9/7</p>';
  const result=extractIranianSheetTablePrice(html,{product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر عرض 1.25 فولاد مبارکه برش خورده',delivery:'بنگاه تهران'},'ahanonline');
  assert.deepEqual(result,{price:176290,sourceDate:'1405/9/7'});
 });
 await t.test('extracts exact Pivan home-page black-sheet row by semantic columns',async()=>{
  const {extractPivanSheetPrice}=await import('../workers/source-adapters.js');
  const html='<div><time datetime="2026-11-28T10:36:37+00:00">امروز</time><table><tr><td>ورق سیاه - 2 - فولاد مبارکه - 250x125</td><td class="meta-width*length">۱۲۵ x ۲۵۰</td><td class="meta-brand-name">فولاد مبارکه اصفهان</td><td class="meta-form-name">برش خورده</td><td class="meta-delivery">انبار تهران</td><td class="meta-unit">کیلوگرم</td><td class="meta-price">۱۸۳,۰۰۰ ۱۶۶,۴۰۰</td><td class="meta-priceDifference">۰.۰ %</td></tr></table></div>';
  const result=extractPivanSheetPrice(html,{product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر عرض 1.25 فولاد مبارکه برش خورده',delivery:'انبار تهران'});
  assert.deepEqual(result,{price:166400,sourceDate:'2026-11-28'});
 });
 await t.test('rejects Pivan wrong width, location, and ambiguous exact rows',async()=>{
  const {extractPivanSheetPrice}=await import('../workers/source-adapters.js');
  const row=(size,place,price)=>'<tr><td>ورق سیاه - 2 - فولاد مبارکه - '+size+'</td><td class="meta-width*length">۱۲۵ x ۲۵۰</td><td class="meta-brand-name">فولاد مبارکه</td><td class="meta-form-name">برش خورده</td><td class="meta-delivery">'+place+'</td><td>کیلوگرم</td><td class="meta-price">'+price+'</td><td class="meta-priceDifference">۰.۰ %</td></tr>';
  const source={product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر عرض 1.25 فولاد مبارکه برش خورده',delivery:'انبار تهران'};
  assert.equal(extractPivanSheetPrice('<table>'+row('200x100','انبار تهران','168,200')+'</table>',source),null);
  assert.equal(extractPivanSheetPrice('<table>'+row('250x125','انبار اصفهان','166,400')+'</table>',source),null);
  assert.equal(extractPivanSheetPrice('<table>'+row('250x125','انبار تهران','166,400')+row('250x125','انبار تهران','165,000')+'</table>',source),null);
 });
 await t.test('Iromart accepts only exact Telegram prices with explicit currency and per-kg unit',async()=>{
  const {extractIromartTelegramPrice}=await import('../workers/source-adapters.js');
  const source={product_key:'hot-rolled',product_name:'ورق گرم',specification:'20 میلیمتر کاویان',delivery:'انبار اهواز'};
  assert.deepEqual(extractIromartTelegramPrice('<div class="tgme_widget_message_text">#قیمت_ورق_سیاه<br>ورق سیاه ضخامت 20 میل کاویان انبار اهواز قیمت 32,000 تومان/کیلو</div>',source),{price:32000,sourceDate:null});
  assert.equal(extractIromartTelegramPrice('<div class="tgme_widget_message_text">#قیمت_ورق_سیاه<br>ورق سیاه ضخامت 20 میل کاویان انبار اهواز 32,000</div>',source),null);
 });
 await t.test('extracts Ahanprice sheet row only when dimensions and form are exact',async()=>{
  const {extractIranianSheetTablePrice}=await import('../workers/source-adapters.js');
  const html='<table><tr><td>2</td><td>قیمت ورق سیاه 2 میل 2500*1250 مبارکه</td><td>50</td><td>۱۶۹٬۰۹۰</td><td>۱٬۰۰۰</td><td>1405/09/04</td></tr><tr><td>2</td><td>قیمت ورق سیاه 2 میل عرض 1250 رول مبارکه</td><td>18000</td><td>۱۶۶٬۳۶۳</td><td>۱٬۰۰۰</td><td>1405/09/04</td></tr></table>';
  const result=extractIranianSheetTablePrice(html,{product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر عرض 1.25 فولاد مبارکه شیت 2500*1250'},'ahanprice');
  assert.deepEqual(result,{price:169090,sourceDate:'1405/09/04'});
 });
 await t.test('rejects source tables that omit requested width or have multiple matching prices',async()=>{
  const {extractIranianSheetTablePrice}=await import('../workers/source-adapters.js');
  const html='<h3>ورق سیاه ضخامت 2</h3><table><tr><td>فولاد مبارکه</td><td>برش خورده</td><td>انبار تهران</td><td>کیلوگرم</td><td>185,000 168,200</td></tr><tr><td>فولاد مبارکه</td><td>برش خورده</td><td>انبار تهران</td><td>کیلوگرم</td><td>183,000 166,400</td></tr></table>';
  const result=extractIranianSheetTablePrice(html,{product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر عرض 1.25 فولاد مبارکه',delivery:'انبار تهران'},'pivan');
  assert.equal(result,null);
 });
 await t.test('matches a specific Markaz Ahan hot-rolled sheet variant from its public sheet channel',async()=>{
  const {extractMarkazAhanTelegramPrice}=await import('../workers/source-adapters.js');
  const html='<div class="tgme_widget_message_text js-message_text" dir="auto">#ورق_سیاه<br>ورق سیاه ضخامت 2 میلیمتر فولاد سبا عرض 1.25 انبار اصفهان ⬅ 163,636 تومان<br>ورق سیاه ضخامت 2 میلیمتر فولاد سبا عرض 1 انبار اصفهان ⬅ 165,454 تومان</div>';
  const source={product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر عرض 1.25 فولاد سبا',delivery:'انبار اصفهان'};
  assert.equal(extractMarkazAhanTelegramPrice(html,source),163636);
 });
 await t.test('refuses ambiguous Markaz Ahan sheet prices without exact dimensions',async()=>{
  const {extractMarkazAhanTelegramPrice}=await import('../workers/source-adapters.js');
  const html='<div class="tgme_widget_message_text js-message_text">ورق سیاه ضخامت 2 میلیمتر فولاد سبا عرض 1 انبار اصفهان ⬅ 165,454 تومان<br>ورق سیاه ضخامت 2 میلیمتر فولاد سبا عرض 1.25 انبار اصفهان ⬅ 163,636 تومان</div>';
  assert.equal(extractMarkazAhanTelegramPrice(html,{product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر فولاد سبا'}),null);
 });
 await t.test('extracts sheet and coil prices independently with exact dimensions and form',async()=>{
  const {extractPivanSheetPrice}=await import('../workers/source-adapters.js');
  const sheet='<div><time datetime="2026-11-28T10:00:00+00:00">امروز</time><table><tr><td>ورق سیاه - 2 - فولاد مبارکه - 250x125</td><td class="meta-width*length">۱۲۵ x ۲۵۰</td><td class="meta-brand-name">فولاد مبارکه اصفهان</td><td class="meta-form-name">برش خورده</td><td class="meta-delivery">انبار تهران</td><td class="meta-unit">کیلوگرم</td><td class="meta-price">۱۷۰,۹۰۰</td><td class="meta-priceDifference">۰٪</td></tr></table></div>';
  const coil='<div><time datetime="2026-11-28T10:00:00+00:00">امروز</time><table><tr><td>ورق سیاه - 2 - فولاد مبارکه - رول عرض 125</td><td class="meta-width*length">۱۲۵</td><td class="meta-brand-name">فولاد مبارکه اصفهان</td><td class="meta-form-name">رول</td><td class="meta-delivery">انبار اصفهان</td><td class="meta-unit">کیلوگرم</td><td class="meta-price">۱۶۲,۵۰۰</td><td class="meta-priceDifference">۰٪</td></tr></table></div>';
  const sheetSource={product_key:'hot-rolled-sheet',product_name:'ورق گرم (سیاه)-تخت',specification:'ضخامت 2 میلیمتر عرض 1250 میلیمتر طول 2500 میلیمتر فولاد مبارکه برش خورده',delivery:'انبار تهران'};
  const coilSource={product_key:'hot-rolled-coil',product_name:'ورق گرم (سیاه)-کلاف',specification:'ضخامت 2 میلیمتر عرض 1250 میلیمتر فولاد مبارکه رول',delivery:'انبار اصفهان'};
  assert.deepEqual(extractPivanSheetPrice(sheet,sheetSource),{price:170900,sourceDate:'2026-11-28'});
  assert.deepEqual(extractPivanSheetPrice(coil,coilSource),{price:162500,sourceDate:'2026-11-28'});
 });
 await t.test('never assigns a sheet quote to a coil or vice versa',async()=>{
  const {extractPivanSheetPrice}=await import('../workers/source-adapters.js');
  const sheet='<table><tr><td>ورق سیاه - 2 - فولاد مبارکه - 250x125</td><td class="meta-width*length">۱۲۵ x ۲۵۰</td><td class="meta-brand-name">فولاد مبارکه</td><td class="meta-form-name">برش خورده</td><td class="meta-delivery">انبار تهران</td><td class="meta-unit">کیلوگرم</td><td class="meta-price">۱۷۰,۹۰۰</td><td>۰٪</td></tr></table>';
  const coilSource={product_key:'hot-rolled-coil',product_name:'ورق گرم (سیاه)-کلاف',specification:'ضخامت 2 میلیمتر عرض 1250 میلیمتر فولاد مبارکه رول',delivery:'انبار تهران'};
  const sheetSource={product_key:'hot-rolled-sheet',product_name:'ورق گرم (سیاه)-تخت',specification:'ضخامت 2 میلیمتر عرض 1250 میلیمتر طول 2500 میلیمتر فولاد مبارکه برش خورده',delivery:'انبار تهران'};
  assert.equal(extractPivanSheetPrice(sheet,coilSource),null);
  const coil='<table><tr><td>ورق سیاه - 2 - فولاد مبارکه - رول عرض 125</td><td class="meta-width*length">۱۲۵</td><td class="meta-brand-name">فولاد مبارکه</td><td class="meta-form-name">رول</td><td class="meta-delivery">انبار اصفهان</td><td class="meta-unit">کیلوگرم</td><td class="meta-price">۱۶۲,۵۰۰</td><td>۰٪</td></tr></table>';
  assert.equal(extractPivanSheetPrice(coil,sheetSource),null);
 });
 await t.test('extracts Ahanonline sheet and coil from the exact price/date header columns',async()=>{
  const {extractIranianSheetTablePrice}=await import('../workers/source-adapters.js');
  const html='<h3>ورق سیاه 2 میل</h3><table><tr><th>سایز</th><th>برند</th><th>حالت</th><th>محل تحویل</th><th>تاریخ بروزرسانی</th><th>قیمت (تومان)</th><th>نوسانات</th><th>نمودار</th></tr><tr><td>1250*2500</td><td>فولاد مبارکه</td><td>برش خورده</td><td>بنگاه تهران</td><td>1405/9/5</td><td>169,150</td><td>+0.5%</td><td></td></tr><tr><td>1250</td><td>فولاد مبارکه</td><td>رول</td><td>کارخانه</td><td>1405/9/5</td><td>166,360</td><td>+0.5%</td><td></td></tr></table>';
  const sheet={product_key:'hot-rolled-sheet',product_name:'ورق گرم (سیاه)-تخت',specification:'ضخامت 2 میلیمتر عرض 1250 طول 2500 فولاد مبارکه برش خورده',delivery:'بنگاه تهران'};
  const coil={product_key:'hot-rolled-coil',product_name:'ورق گرم (سیاه)-کلاف',specification:'ضخامت 2 میلیمتر عرض 1250 فولاد مبارکه رول',delivery:'کارخانه'};
  assert.deepEqual(extractIranianSheetTablePrice(html,sheet,'ahanonline'),{price:169150,sourceDate:'1405/9/5'});
  assert.deepEqual(extractIranianSheetTablePrice(html,coil,'ahanonline'),{price:166360,sourceDate:'1405/9/5'});
 });
 await t.test('Ahanonline coil and sheet records cannot cross-match each other',async()=>{
  const {extractIranianSheetTablePrice}=await import('../workers/source-adapters.js');
  const html='<h3>ورق سیاه 2 میل</h3><table><tr><th>سایز</th><th>برند</th><th>حالت</th><th>محل تحویل</th><th>تاریخ بروزرسانی</th><th>قیمت (تومان)</th></tr><tr><td>1250*2500</td><td>فولاد مبارکه</td><td>برش خورده</td><td>بنگاه تهران</td><td>1405/9/5</td><td>169,150</td></tr><tr><td>1250</td><td>فولاد مبارکه</td><td>رول</td><td>کارخانه</td><td>1405/9/5</td><td>166,360</td></tr></table>';
  const wrongSheet={product_key:'hot-rolled-sheet',product_name:'ورق تخت',specification:'ضخامت 2 میلیمتر عرض 1250 طول 3000 فولاد مبارکه برش خورده',delivery:'بنگاه تهران'};
  const wrongCoil={product_key:'hot-rolled-coil',product_name:'ورق کلاف',specification:'ضخامت 2 میلیمتر عرض 1250 فولاد مبارکه رول',delivery:'بنگاه تهران'};
  assert.equal(extractIranianSheetTablePrice(html,wrongSheet,'ahanonline'),null);
  assert.equal(extractIranianSheetTablePrice(html,wrongCoil,'ahanonline'),null);
 });

});
