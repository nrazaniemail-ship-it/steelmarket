const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('worker selector parser matches nested and void elements',async()=>{
 const w=await import('../workers/steel-api.js');
 assert.equal(w.parse('<html><body><div class="row"><span class="price">۱٬۲۰۰</span></div></body></html>',{parser_mode:'selector',selector:'.price'}),1200);
 assert.equal(w.parse('<div><meta itemprop="price" content="345"></div>',{parser_mode:'selector',selector:'[itemprop=price]'}),345);
 assert.equal(w.parse('<table><tr><td id="p">9,100</td></tr></table>',{parser_mode:'selector',selector:'#p'}),9100);
 assert.throws(()=>w.selectorText('<p>x</p>','body > p'));
});
test('worker host validation tolerates www, blocks ports and IP literals',async()=>{
 const w=await import('../workers/steel-api.js');
 assert.equal(w.validPublicUrl('https://www.ime.co.ir/x',['ime.co.ir']).hostname,'www.ime.co.ir');
 assert.throws(()=>w.validPublicUrl('https://ime.co.ir:8443/',['ime.co.ir']),/port/);
 assert.throws(()=>w.validPublicUrl('https://8.8.8.8/',['8.8.8.8']),/ip_literal/);
});
test('invalid JSON body on admin endpoint is a client error, not 500',async()=>{
 const w=await import('../workers/steel-api.js');
 const env={DB:{prepare(){return{bind(){return this},async run(){return{}},async all(){return{results:[]}}}}},API_TOKEN:'t',ALLOWED_HOSTS:'a.com',APP_ORIGIN:'https://x.io/'};
 const r=await w.default.fetch(new Request('https://api/sources',{method:'POST',headers:{authorization:'Bearer t'},body:'{bad'}),env);
 assert.equal(r.status,400);
 const c=await w.default.fetch(new Request('https://api/public/sources',{headers:{origin:'https://x.io'}}),env);
 assert.equal(c.headers.get('access-control-allow-origin'),'https://x.io');
});
test('PWA manifest icons exist and include maskable PNGs',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.webmanifest'),'utf8'));
 for(const i of m.icons)assert.ok(fs.existsSync(path.join(__dirname,'..',i.src)),i.src);
 assert.ok(m.icons.some(i=>i.purpose==='maskable'&&i.sizes==='512x512'));
 assert.ok(m.icons.some(i=>i.sizes==='192x192'&&i.type==='image/png'));
});
test('Android launcher resources exist for every density',()=>{
 for(const d of['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi'])for(const n of['ic_launcher','ic_launcher_round','ic_launcher_foreground','ic_launcher_monochrome'])
  assert.ok(fs.existsSync(path.join(__dirname,`../app/src/main/res/mipmap-${d}/${n}.png`)),d+'/'+n);
});
