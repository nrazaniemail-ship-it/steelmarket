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
 await t.test('does not invent an IME price when no matching trade exists',async()=>{
  const {extractImeTradePrice}=await import('../workers/source-adapters.js');
  assert.equal(extractImeTradePrice({d:'[]'},{product_key:'hot-rolled',product_name:'ورق گرم'}),null);
 });

 await t.test('extracts exact Ahanonline hot-rolled sheet table row and update date',async()=>{
  const {extractIranianSheetTablePrice}=await import('../workers/source-adapters.js');
  const html='<h3>ورق سیاه 2 میل</h3><table><tr><td>2500*1250</td><td>فولاد مبارکه</td><td>برش خورده</td><td>بنگاه تهران</td><td>176,290</td></tr></table><p>آخرین بروز رسانی : 1405/9/7</p>';
  const result=extractIranianSheetTablePrice(html,{product_key:'hot-rolled',product_name:'ورق گرم',specification:'2 میلیمتر عرض 1.25 فولاد مبارکه برش خورده',delivery:'بنگاه تهران'},'ahanonline');
  assert.deepEqual(result,{price:176290,sourceDate:'1405/9/7'});
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

});
