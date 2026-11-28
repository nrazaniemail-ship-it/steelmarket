const test=require('node:test');
const { before }=require('node:test');
const assert=require('node:assert/strict');
let worker;
before(async()=>{worker=await import('../workers/steel-api.js')});

function dbMock(rows=[]){
 const calls=[];
 return {calls,prepare(sql){return {args:[],bind(...args){this.args=args;return this},async all(){calls.push({sql,args:this.args});return{results:rows}},async first(){calls.push({sql,args:this.args});return null},async run(){calls.push({sql,args:this.args});return{success:true}}}}};
}
test('public market and source endpoints return data without admin token',async()=>{
 const DB=dbMock([{id:'obs1',source_id:'src1',raw_price:25000}]);
 const env={DB,APP_ORIGIN:'https://nrazaniemail-ship-it.github.io'};
 for(const path of ['/public/market','/public/sources','/public/events']){
  const req=new Request('https://api.example.workers.dev'+path,{headers:{Origin:env.APP_ORIGIN}});
  const res=await worker.default.fetch(req,env);
  assert.equal(res.status,200,path);
  assert.equal(res.headers.get('access-control-allow-origin'),env.APP_ORIGIN);
  assert.ok(Array.isArray(await res.json()));
 }
});
test('CORS accepts a configured GitHub Pages URL with a repository path',async()=>{
 const DB=dbMock();
 const origin='https://nrazaniemail-ship-it.github.io';
 const env={DB,APP_ORIGIN:origin+'/steelmarket'};
 const req=new Request('https://api.example.workers.dev/health',{headers:{Origin:origin}});
 const res=await worker.default.fetch(req,env);
 assert.equal(res.status,200);
 assert.equal(res.headers.get('access-control-allow-origin'),origin);
});

test('admin source write remains protected',async()=>{
 const DB=dbMock();
 const env={DB,APP_ORIGIN:'https://nrazaniemail-ship-it.github.io',ALLOWED_HOSTS:'prices.example.com',API_TOKEN:'secret'};
 const body={id:'src1',product_key:'rebar16',product_name:'میلگرد ۱۶',url:'https://prices.example.com/p',source_kind:'factory'};
 const denied=await worker.default.fetch(new Request('https://api.example.workers.dev/sources',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env);
 assert.equal(denied.status,401);
 const accepted=await worker.default.fetch(new Request('https://api.example.workers.dev/sources',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer secret'},body:JSON.stringify(body)}),env);
 assert.equal(accepted.status,201);
 assert.ok(DB.calls.some(x=>x.sql.includes('ON CONFLICT(id)')));
});
test('public history requires a product key',async()=>{
 const env={DB:dbMock()};
 const res=await worker.default.fetch(new Request('https://api.example.workers.dev/public/observations'),env);
 assert.equal(res.status,400);
 assert.equal((await res.json()).error,'product_key_required');
});

test('public manual check fetches an enabled registered source and appends an observation without admin token',async()=>{
 const source={id:'src-public',product_key:'rebar16',product_name:'میلگرد ۱۶',url:'https://prices.example.com/p',source_kind:'factory',parser_mode:'regex',regex:'price: ([0-9]+)',currency:'IRT',measure_unit:'kg',enabled:1,last_attempt_at:null};
 const calls=[];
 const DB={prepare(sql){return{args:[],bind(...args){this.args=args;return this},async first(){calls.push({sql,args:this.args});return sql.includes('SELECT * FROM sources')?source:null},async run(){calls.push({sql,args:this.args});return{success:true,meta:{changes:1}}},async all(){return{results:[]}}}}};
 const oldFetch=global.fetch;
 global.fetch=async()=>new Response('price: 54321',{status:200,headers:{'content-type':'text/plain'}});
 try{
  const env={DB,APP_ORIGIN:'https://nrazaniemail-ship-it.github.io',ALLOWED_HOSTS:'prices.example.com'};
  const req=new Request('https://api.example.workers.dev/public/sources/src-public/check',{method:'POST',headers:{Origin:env.APP_ORIGIN}});
  const res=await worker.default.fetch(req,env),body=await res.json();
  assert.equal(res.status,200);
  assert.equal(res.headers.get('access-control-allow-origin'),env.APP_ORIGIN);
  assert.equal(body.price,54321);
  assert.equal(body.stored,true);
  assert.ok(calls.some(x=>x.sql.includes('UPDATE sources SET last_attempt_at')));
  assert.ok(calls.some(x=>x.sql.includes('INSERT INTO observations')));
 }finally{global.fetch=oldFetch}
});

test('authenticated immediate check fetches, normalizes and appends a price observation',async()=>{
 const source={id:'src1',product_key:'rebar16',product_name:'میلگرد ۱۶',url:'https://prices.example.com/p',source_kind:'factory',parser_mode:'regex',regex:'price: ([0-9]+)',currency:'IRT',measure_unit:'kg',enabled:1};
 const calls=[];
 const DB={prepare(sql){return{args:[],bind(...args){this.args=args;return this},async first(){return sql.includes('SELECT * FROM sources')?source:null},async run(){calls.push({sql,args:this.args});return{success:true}},async all(){return{results:[]}}}}};
 const oldFetch=global.fetch;
 global.fetch=async()=>new Response('price: 12345',{status:200,headers:{'content-type':'text/plain'}});
 try{
  const env={DB,APP_ORIGIN:'https://nrazaniemail-ship-it.github.io',ALLOWED_HOSTS:'prices.example.com',API_TOKEN:'secret'};
  const req=new Request('https://api.example.workers.dev/sources/src1/check',{method:'POST',headers:{authorization:'Bearer secret'}});
  const res=await worker.default.fetch(req,env),body=await res.json();
  assert.equal(res.status,200);
  assert.equal(body.price,12345);
  assert.equal(body.irr_per_kg,123450);
  assert.ok(calls.some(x=>x.sql.includes('INSERT INTO observations')));
 }finally{global.fetch=oldFetch}
});
