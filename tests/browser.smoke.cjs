const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://example.invalid/**',route=>route.abort());
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  assert.equal(await page.locator('h1').first().innerText(),'نبض بازار فولاد');
  assert.equal(await page.locator('.bottomnav').isVisible(),true);
  await page.locator('#pName').fill('میلگرد ۱۶ آزمایشی');
  await page.locator('#pProductKey').fill('rebar-16-smoke');
  await page.locator('#pUrl').fill('https://example.invalid/rebar');
  await page.locator('#productForm button[type=submit]').click();
  await page.locator('.prodname').filter({hasText:'میلگرد ۱۶ آزمایشی'}).waitFor();
  await page.locator('[data-edit]').first().click();
  await page.locator('#pName').fill('میلگرد ۱۶ ویرایش‌شده');
  await page.locator('#productForm button[type=submit]').click();
  await page.locator('.prodname').filter({hasText:'میلگرد ۱۶ ویرایش‌شده'}).waitFor();
  await page.locator('#pMode').selectOption('selector');
  assert.equal(await page.locator('#selectorField').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('Browser smoke test passed: mobile layout, add/edit product, parser fields, no runtime exceptions');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
