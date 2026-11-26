const test=require('node:test');
const assert=require('node:assert/strict');
(async()=>{
 const {identifyAdapter,extractStructuredPrice,tradingEconomicsUrl}=await import('../workers/source-adapters.js');
 test('recognizes supported steel market sources',()=>{
  assert.equal(identifyAdapter('https://ahanonline.com/product/example').id,'ahanonline');
  assert.equal(identifyAdapter('https://fa.tradingeconomics.com/commodity/steel').id,'tradingeconomics');
  assert.equal(identifyAdapter('https://unknown.example/prices').id,'custom');
 });
 test('maps standard catalogue products to Trading Economics benchmark pages',()=>{
  assert.equal(tradingEconomicsUrl('hot-rolled'),'https://fa.tradingeconomics.com/commodity/hrc-steel');
  assert.equal(tradingEconomicsUrl('iron-ore-fines'),'https://fa.tradingeconomics.com/commodity/iron-ore');
  assert.equal(tradingEconomicsUrl('not-mapped'),null);
 });
 test('extracts Product Offer price from JSON-LD',()=>{
  const html='<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Rebar","offers":{"@type":"Offer","price":"115450","priceCurrency":"IRR"}}</script>';
  assert.equal(extractStructuredPrice(html,'ahanonline'),115450);
 });
 test('extracts OpenGraph price when JSON-LD is absent',()=>{
  assert.equal(extractStructuredPrice('<meta property="product:price:amount" content="1429.05">','tradingeconomics'),1429.05);
 });
 test('returns null rather than guessing when no structured price exists',()=>{
  assert.equal(extractStructuredPrice('<html><body>Steel market is stable</body></html>','custom'),null);
 });
})();
