const test=require('node:test');
const assert=require('node:assert/strict');
test('source-specific steel price adapters',async t=>{
 const {identifyAdapter,extractStructuredPrice,tradingEconomicsUrl}=await import('../workers/source-adapters.js');
 await t.test('recognizes supported sources',()=>{
  assert.equal(identifyAdapter('https://ahanonline.com/product/example').id,'ahanonline');
  assert.equal(identifyAdapter('https://fa.tradingeconomics.com/commodity/steel').id,'tradingeconomics');
  assert.equal(identifyAdapter('https://pivan.co/product/x').id,'pivan');
  assert.equal(identifyAdapter('https://unknown.example/prices').id,'custom');
 });
 await t.test('maps catalogue products to Trading Economics pages',()=>{
  assert.equal(tradingEconomicsUrl('hot-rolled'),'https://fa.tradingeconomics.com/commodity/hrc-steel');
  assert.equal(tradingEconomicsUrl('iron-ore-fines'),'https://fa.tradingeconomics.com/commodity/iron-ore');
  assert.equal(tradingEconomicsUrl('not-mapped'),null);
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
});
