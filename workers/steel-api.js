import { identifyAdapter, extractStructuredPrice, extractImeTradePrice, extractMarkazAhanTelegramPrice, extractIranianSheetTablePrice, extractPivanSheetPrice, extractIromartTelegramPrice } from './source-adapters.js';
const now = () => Date.now();
function json(data, status = 200, cors = {}) {
 return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...cors } });
}
function originAllowed(origin, env) {
 const list = String(env.APP_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean).map(x => {
  try { return new URL(x).origin; } catch { return x.replace(/\/+$/, ''); }
 });
 return !!origin && list.includes(origin.replace(/\/+$/, ''));
}
function corsHeaders(req, env) {
 const origin = req.headers.get('origin') || '';
 return originAllowed(origin, env) ? { 'access-control-allow-origin':origin, 'access-control-allow-methods':'GET,POST,PATCH,OPTIONS', 'access-control-allow-headers':'content-type,authorization', 'vary':'Origin' } : {};
}
function validPublicUrl(raw, allowed) {
 let u; try { u = new URL(raw); } catch { throw Error('invalid_url'); }
 if (u.protocol !== 'https:' || u.username || u.password) throw Error('https_required');
 if (u.port && u.port !== '443') throw Error('port_not_allowed');
 const h = u.hostname.toLowerCase();
 const bare = x => String(x).toLowerCase().replace(/^www\./, '');
 if (!allowed.some(a => bare(a) === bare(h))) throw Error('host_not_allowlisted');
 if (h.startsWith('[') || /^\d+(\.\d+){0,3}$/.test(h)) throw Error('ip_literal_blocked');
 if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') ||
     /^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === '::1') throw Error('private_host_blocked');
 return u;
}
function normalize(value) {
 const s = String(value ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g, '')
  .replace('٫', '.').replace(/[^0-9.+-]/g, '');
 const n = Number(s); if (!(n > 0 && Number.isFinite(n))) throw Error('invalid_price'); if (n > 1e12) throw Error('implausible_price_magnitude'); return n;
}
function attr(attrs, name) {
 const re = /([a-z-]+)\s*=\s*["']([^"']*)["']/gi; for (const m of attrs.matchAll(re)) if (m[1].toLowerCase() === name.toLowerCase()) return m[2]; return '';
}
function selectorText(body, selector) {
 const q = String(selector || '').trim();
 if (!/^(#[\w-]+|\.[\w-]+|\[data-price\]|\[itemprop=price\])$/.test(q)) throw Error('supported_selectors: #id, .class, [data-price], [itemprop=price]');
 const open = /<([a-z][a-z0-9:-]*)\b([^>]*)>/gi;
 let m;
 while ((m = open.exec(body))) {
  const tag = m[1].toLowerCase(), attrs = m[2] || '';
  if (tag === 'script' || tag === 'style') continue;
  let ok = false;
  if (q.startsWith('#')) ok = attr(attrs, 'id') === q.slice(1);
  else if (q.startsWith('.')) ok = attr(attrs, 'class').split(/\s+/).includes(q.slice(1));
  else if (q === '[data-price]') ok = /\bdata-price(?:\s|=|>|\/|$)/i.test(attrs);
  else ok = attr(attrs, 'itemprop') === 'price';
  if (!ok) continue;
  const direct = attr(attrs, 'content') || attr(attrs, 'data-price');
  if (direct) return direct;
  const rest = body.slice(open.lastIndex);
  const close = rest.search(new RegExp('</' + tag + '\\s*>', 'i'));
  if (close < 0) continue;
  const inner = rest.slice(0, close).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  if (inner) return inner;
 }
 throw Error('selector_no_match');
}
function parse(body, source) {
 if (source.parser_mode === 'json') {
  let value = JSON.parse(body);
  for (const key of (source.json_path || 'price').split('.')) value = value?.[key];
  return normalize(value);
 }
 if (source.parser_mode === 'regex') {
  const m = body.match(new RegExp(source.regex)); if (!m) throw Error('regex_no_match');
  return normalize(m[1] || m[0]);
 }
 if (source.parser_mode === 'selector') return normalize(selectorText(body, source.selector));
 if (source.parser_mode === 'auto') {
  const adapter=identifyAdapter(source.url);
  const structured=extractStructuredPrice(body,adapter.id);
  if(structured!==null)return normalize(structured);
  try { return normalize(selectorText(body, '[data-price]')); } catch {}
  for (const cls of ['.price', '.price-value', '.last-price']) {
   try { return normalize(selectorText(body, cls)); } catch {}
  }
 }
 if(source.parser_mode==='auto' && identifyAdapter(source.url).id!=='custom') throw Error('adapter_price_not_found');
 const m = body.match(/(?:قیمت|price|آخرین نرخ)[^0-9۰-۹٠-٩]{0,30}([0-9۰-۹٠-٩][0-9۰-۹٠-٩,٬.٫]*)/i);
 if (!m) throw Error('price_not_found'); return normalize(m[1]);
}
async function fetchSafe(source, env) {
 const allowed = (env.ALLOWED_HOSTS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
 let target = validPublicUrl(source.url, allowed), response;
 for (let hop = 0; hop < 4; hop++) {
  response = await fetch(target, { redirect:'manual', signal:AbortSignal.timeout(15000),
   headers:{ 'user-agent':'FooladbanBot/1.1 (+authorized-price-monitor)', 'accept':'text/html,application/json,text/plain' } });
  if ([301,302,303,307,308].includes(response.status)) {
   const location = response.headers.get('location'); if (!location) throw Error('redirect_without_location');
   target = validPublicUrl(new URL(location, target).toString(), allowed); continue;
  }
  break;
 }
 if (!response?.ok) throw Error('upstream_http_' + (response?.status || 0));
 if (!/text\/html|application\/json|text\/plain/i.test(response.headers.get('content-type') || '')) throw Error('unsupported_content_type');
 const body = await response.text(); if (body.length > 1500000) throw Error('response_too_large'); return body;
}

function jalaliDate(date) {
 const gy=date.getUTCFullYear(),gm=date.getUTCMonth()+1,gd=date.getUTCDate();
 const gdm=[0,31,59,90,120,151,181,212,243,273,304,334];
 const gy2=gm>2?gy+1:gy;
 let days=355666+365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)+gd+gdm[gm-1];
 let jy=-1595+33*Math.floor(days/12053);days%=12053;jy+=4*Math.floor(days/1461);days%=1461;
 if(days>365){jy+=Math.floor((days-1)/365);days=(days-1)%365}
 const jm=days<186?1+Math.floor(days/31):7+Math.floor((days-186)/30);
 const jd=days<186?1+days%31:1+(days-186)%30;
 return jy+'/'+String(jm).padStart(2,'0')+'/'+String(jd).padStart(2,'0');
}
async function fetchImePrice(source,env) {
 const allowed=(env.ALLOWED_HOSTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 validPublicUrl(source.url,allowed);
 const tehranNow=new Date(now()+210*60000);
 const toDate=new Date(Date.UTC(tehranNow.getUTCFullYear(),tehranNow.getUTCMonth(),tehranNow.getUTCDate()));
 const fromDate=new Date(toDate.getTime()-30*86400000);
 const from=jalaliDate(fromDate),to=jalaliDate(toDate);
 const endpoint='https://www.ime.co.ir/SubSystems/IME/Services/Home/imedata.asmx/GetAmareMoamelatList';
 const payload={Language:8,fari:false,GregorianFromDate:from,GregorianToDate:to,MainCat:0,Cat:0,SubCat:0,Producer:0};
 let response;
 try {
  response=await fetch(endpoint,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(30000),headers:{
   'user-agent':'Mozilla/5.0 (compatible; FooladbanPriceMonitor/1.0)',
   'accept':'text/plain, */*; q=0.01',
   'content-type':'application/json; charset=utf-8',
   'origin':'https://www.ime.co.ir',
   'referer':'https://www.ime.co.ir/offer-stat.html',
   'x-requested-with':'XMLHttpRequest'
  },body:JSON.stringify(payload)});
 } catch(error) { throw Error('ime_network_error: '+(error?.message||'upstream_unreachable')); }
 if(response.status>=300&&response.status<400)throw Error('ime_redirect_blocked');
 if(!response.ok)throw Error('ime_http_'+response.status);
 const raw=await response.text();
 if(raw.length>8000000)throw Error('ime_response_too_large');
 let data;try{data=JSON.parse(raw)}catch{throw Error('ime_invalid_json_response')}
 const result=extractImeTradePrice(data,source);
 if(!result)throw Error('ime_no_matching_traded_price');
 return result;
}
async function fetchSourcePrice(source,env) {
 const adapter=identifyAdapter(source.url);
 if(adapter.id==='ime') {
  const result=await fetchImePrice(source,env);
  return {price:result.price,sourceDate:result.sourceDate};
 }
 if(adapter.id==='markazeahan' && ['hot-rolled','black-sheet'].includes(String(source.product_key))) {
  const body=await fetchSafe({...source,url:'https://t.me/s/markazeahan4'},env);
  const price=extractMarkazAhanTelegramPrice(body,source);
  if(!price)throw Error('markazeahan_variant_not_found_or_ambiguous');
  return {price,sourceDate:null};
 }
 if(adapter.id==='iromart' && ['hot-rolled','black-sheet'].includes(String(source.product_key))) {
  const body=await fetchSafe({...source,url:'https://t.me/s/iromart'},env);
  const result=extractIromartTelegramPrice(body,source);
  if(!result)throw Error('iromart_price_requires_explicit_currency_unit_and_exact_variant');
  return result;
 }
 const body=await fetchSafe(source,env);
 if(adapter.id==='pivan') {
  const result=extractPivanSheetPrice(body,source);
  if(!result)throw Error('pivan_variant_price_not_found_or_ambiguous');
  return result;
 }
 if(['ahanonline','ahanprice'].includes(adapter.id)) {
  const result=extractIranianSheetTablePrice(body,source,adapter.id);
  if(!result)throw Error('variant_price_not_found_or_ambiguous');
  return result;
 }
 return {price:parse(body,source),sourceDate:null};
}

async function safeEqual(a, b) {
 const enc = new TextEncoder(), [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
 const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0; for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i]; return d === 0;
}
const CLIENT_ERRORS = new Set(['invalid_url','https_required','port_not_allowed','host_not_allowlisted','ip_literal_blocked','private_host_blocked']);
// Reject implausible jumps so one bad scrape cannot poison the append-only ledger.
function plausible(price, previous) {
 const p = Number(previous?.raw_price);
 if (!(p > 0) || p > 1e12) return;
 if (price / p > 4 || price / p < 0.25) throw Error('implausible_price_change');
}
async function recordObservation(env, source, price, observedAt) {
 const rates = { IRR:1, IRT:10, USD:Number(env.USD_IRR), AED:Number(env.AED_IRR), EUR:Number(env.EUR_IRR), CNY:Number(env.CNY_IRR), INR:Number(env.INR_IRR), TRY:Number(env.TRY_IRR), GBP:Number(env.GBP_IRR) };
 const fx = rates[source.currency] || 0, factor = source.measure_unit === 'ton' ? 0.001 : 1;
 const normalized = fx > 0 ? price * factor * fx : null;
 const previous = await env.DB.prepare('SELECT raw_price FROM observations WHERE source_id=? ORDER BY observed_at DESC LIMIT 1').bind(source.id).first();
 plausible(price, previous);
 const stmts = [env.DB.prepare('INSERT INTO observations(id,source_id,product_key,source_kind,raw_price,currency,measure_unit,irr_per_kg,observed_at,recorded_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), source.id, source.product_key, source.source_kind, price, source.currency, source.measure_unit, normalized, observedAt, observedAt)];
 if (previous && Number(previous.raw_price) > 0 && Number(previous.raw_price) <= 1e12 && Number(previous.raw_price) !== price) {
  const pct = (price - Number(previous.raw_price)) / Number(previous.raw_price) * 100;
  stmts.push(env.DB.prepare('INSERT INTO market_events(id,product_key,source_id,old_price,new_price,change_pct,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(), source.product_key, source.id, previous.raw_price, price, pct, observedAt));
 }
 stmts.push(env.DB.prepare('UPDATE sources SET last_attempt_at=?,last_success_at=?,last_error=NULL,consecutive_failures=0 WHERE id=?').bind(observedAt, observedAt, source.id));
 if (typeof env.DB.batch === 'function') await env.DB.batch(stmts); else for (const s of stmts) await s.run();
 return { normalized };
}
async function recordFailure(env, id, error) {
 try { await env.DB.prepare('UPDATE sources SET last_attempt_at=?,last_error=?,consecutive_failures=consecutive_failures+1 WHERE id=?').bind(now(), String(error?.message || error).slice(0, 300), id).run(); } catch {}
}
export default {
 async fetch(request, env) {
  const u = new URL(request.url), cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { headers:cors });
  if (u.pathname === '/health') return json({ ok:true, service:'fooladban-steel-api', time:now() }, 200, cors);
  if (!env.DB) return json({ error:'D1 binding DB is not configured' }, 503, cors);
  const authorized = !!env.API_TOKEN && await safeEqual(request.headers.get('authorization') || '', 'Bearer ' + env.API_TOKEN);
  try {
   if (u.pathname === '/public/market' && request.method === 'GET') {
    const r = await env.DB.prepare(`SELECT o.id,o.source_id,o.product_key,o.source_kind,o.raw_price,o.currency,o.measure_unit,o.irr_per_kg,o.observed_at,o.recorded_at,s.product_name,s.specification,s.market,s.delivery,s.tax_basis,s.enabled,s.last_attempt_at,s.last_success_at,s.last_error,s.consecutive_failures
     FROM observations o JOIN sources s ON s.id=o.source_id
     WHERE s.enabled=1 AND s.last_error IS NULL AND o.raw_price<=1e12 AND o.observed_at=(SELECT MAX(o2.observed_at) FROM observations o2 WHERE o2.source_id=o.source_id)
     ORDER BY o.product_key,s.source_kind`).all();
    return json(r.results,200,cors);
   }
   if (u.pathname === '/public/sources' && request.method === 'GET') {
    const r = await env.DB.prepare('SELECT id,product_key,product_name,specification,source_kind,market,currency,measure_unit,delivery,tax_basis,enabled,last_attempt_at,last_success_at,last_error,consecutive_failures,interval_minutes FROM sources ORDER BY product_name').all();
    return json(r.results,200,cors);
   }
   if (u.pathname === '/public/observations' && request.method === 'GET') {
    const key=u.searchParams.get('product_key'); if(!key)return json({error:'product_key_required'},400,cors);
    const r=await env.DB.prepare('SELECT o.id,o.source_id,o.product_key,o.source_kind,o.raw_price,o.currency,o.measure_unit,o.irr_per_kg,o.observed_at,o.recorded_at,s.product_name,s.specification,s.market FROM observations o JOIN sources s ON s.id=o.source_id WHERE o.product_key=? AND o.raw_price<=1e12 ORDER BY o.observed_at DESC LIMIT 1500').bind(key).all();
    return json(r.results,200,cors);
   }
   if (u.pathname === '/public/events' && request.method === 'GET') {
    const r=await env.DB.prepare('SELECT id,product_key,source_id,old_price,new_price,change_pct,created_at FROM market_events ORDER BY created_at DESC LIMIT 100').all();
    return json(r.results,200,cors);
   }
   // Public price lookup parses an allowlisted source without requiring an admin key or writing to D1.
    if (u.pathname === '/public/price' && request.method === 'GET') {
     const source={
      url:u.searchParams.get('url')||'',
      product_key:u.searchParams.get('product_key')||'',
      product_name:u.searchParams.get('product_name')||'',
      specification:u.searchParams.get('specification')||'',
      source_kind:u.searchParams.get('source_kind')||'other',
      parser_mode:u.searchParams.get('parser_mode')||'auto',
      selector:u.searchParams.get('selector')||'',
      regex:u.searchParams.get('regex')||'',
      json_path:u.searchParams.get('json_path')||'price',
      currency:u.searchParams.get('currency')||'IRT',
      measure_unit:u.searchParams.get('measure_unit')||'kg',
      delivery:u.searchParams.get('delivery')||'',
      tax_basis:u.searchParams.get('tax_basis')||''
     };
     if(!source.url||!source.product_key||!source.product_name)return json({error:'source_details_required'},400,cors);
     try {
      const result=await fetchSourcePrice(source,env);
      return json({ok:true,price:result.price,source_date:result.sourceDate||null,currency:source.currency,measure_unit:source.measure_unit},200,cors);
     } catch(error) {
      return json({error:error?.message||'source_fetch_failed'},502,cors);
     }
    }
    // Public read-only fetch for locally configured sources. Host restrictions are identical to admin fetches.
    if (u.pathname === '/public/fetch' && request.method === 'GET') {
     const raw=u.searchParams.get('url');
     if(!raw)return json({error:'url_required'},400,cors);
     try {
      const body=await fetchSafe({url:raw},env);
      return json({ok:true,body},200,cors);
     } catch(error) {
      const message=error?.message||'source_fetch_failed';
      const status=message==='upstream_http_403'||message==='upstream_http_429'?502:400;
      return json({error:message},status,cors);
     }
    }
    // Public manual refresh is restricted to an already-registered source, an allowlisted HTTPS host,
   // and a per-source cooldown. Admin credentials are not exposed to the browser for price checks.
   const publicCheck = u.pathname.match(/^\/public\/sources\/([^/]+)\/check$/);
   if (publicCheck && request.method === 'POST') {
    const id=decodeURIComponent(publicCheck[1]);
    const source=await env.DB.prepare('SELECT * FROM sources WHERE id=? AND enabled=1').bind(id).first();
    if(!source)return json({error:'source_not_found'},404,cors);
    const attempted=now(), cooldown=60000;
    if(Number(source.last_attempt_at)>attempted-cooldown)
     return json({error:'source_cooldown',retry_after_seconds:Math.ceil((Number(source.last_attempt_at)+cooldown-attempted)/1000)},429,cors);
    const claim=await env.DB.prepare('UPDATE sources SET last_attempt_at=? WHERE id=? AND enabled=1 AND (last_attempt_at IS NULL OR last_attempt_at<=?)').bind(attempted,id,attempted-cooldown).run();
    if(claim?.meta && claim.meta.changes===0)return json({error:'source_cooldown',retry_after_seconds:60},429,cors);
    try {
     const {price,sourceDate}=await fetchSourcePrice(source,env);
     const { normalized }=await recordObservation(env,source,price,attempted);
     return json({ok:true,id,price,currency:source.currency,measure_unit:source.measure_unit,source_date:sourceDate||null,irr_per_kg:normalized,observed_at:attempted,stored:true},200,cors);
    } catch(error) {
     await recordFailure(env,id,error);
     return json({error:error.message||'source_check_failed',stored:false},502,cors);
    }
   }
   if (u.pathname === '/sources' && request.method === 'POST') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const s = await request.json();
    if (!s.id || !s.product_key || !s.product_name || !s.url || !s.source_kind) return json({ error:'missing_required_fields' }, 400, cors);
    if (!['factory','ime','free_market','export','other'].includes(s.source_kind)) return json({error:'invalid_source_kind'},400,cors);
    if (!['IRR','IRT','USD','AED','EUR','CNY','INR','TRY','GBP'].includes(s.currency||'IRR')) return json({error:'invalid_currency'},400,cors);
    if (!['kg','ton'].includes(s.measure_unit||'kg')) return json({error:'invalid_measure_unit'},400,cors);
    if (!['auto','json','regex','selector'].includes(s.parser_mode||'auto')) return json({error:'invalid_parser_mode'},400,cors);
    if ((s.regex||'').length>300 || (s.json_path||'').length>200 || (s.selector||'').length>120) return json({error:'parser_config_too_long'},400,cors);
    validPublicUrl(s.url, (env.ALLOWED_HOSTS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
    await env.DB.prepare(`INSERT INTO sources(id,product_key,product_name,specification,source_kind,market,url,parser_mode,selector,regex,json_path,currency,measure_unit,delivery,tax_basis,interval_minutes,enabled,created_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)
     ON CONFLICT(id) DO UPDATE SET product_key=excluded.product_key,product_name=excluded.product_name,specification=excluded.specification,source_kind=excluded.source_kind,market=excluded.market,url=excluded.url,parser_mode=excluded.parser_mode,selector=excluded.selector,regex=excluded.regex,json_path=excluded.json_path,currency=excluded.currency,measure_unit=excluded.measure_unit,delivery=excluded.delivery,tax_basis=excluded.tax_basis,interval_minutes=excluded.interval_minutes,enabled=1`)
     .bind(s.id,s.product_key,s.product_name,s.specification||'',s.source_kind,s.market||'Iran',s.url,s.parser_mode||'auto',s.selector||null,s.regex||null,s.json_path||'price',s.currency||'IRR',s.measure_unit||'kg',s.delivery||'',s.tax_basis||'',Math.max(15,Number(s.interval_minutes)||15),now()).run();
    return json({ ok:true, id:s.id }, 201, cors);
   }
   if (u.pathname.startsWith('/sources/') && u.pathname.endsWith('/check') && request.method === 'POST') {
    if(!authorized)return json({error:'unauthorized'},401,cors);
    const id=decodeURIComponent(u.pathname.slice('/sources/'.length,-6).replace(/\/$/,''));
    const source=await env.DB.prepare('SELECT * FROM sources WHERE id=? AND enabled=1').bind(id).first();
    if(!source)return json({error:'source_not_found'},404,cors);
    const attempted=now();
    try {
     const {price}=await fetchSourcePrice(source,env);
     const { normalized }=await recordObservation(env,source,price,attempted);
     return json({ok:true,stored:true,id,price,currency:source.currency,measure_unit:source.measure_unit,irr_per_kg:normalized,observed_at:attempted},200,cors);
    }catch(error){await recordFailure(env,id,error);return json({error:error.message||'source_check_failed'},502,cors);}
   }
   if (u.pathname.startsWith('/sources/') && request.method === 'PATCH') {
    if(!authorized)return json({error:'unauthorized'},401,cors);
    const id=decodeURIComponent(u.pathname.slice('/sources/'.length)); const body=await request.json();
    if(body.enabled===false){await env.DB.prepare('UPDATE sources SET enabled=0 WHERE id=?').bind(id).run();return json({ok:true,id,enabled:false},200,cors);}
    return json({error:'unsupported_patch'},400,cors);
   }
   if (u.pathname === '/sources' && request.method === 'GET') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const r = await env.DB.prepare('SELECT id,product_key,product_name,specification,source_kind,market,url,parser_mode,selector,regex,json_path,currency,measure_unit,delivery,tax_basis,interval_minutes,enabled,last_attempt_at,last_success_at,last_error,consecutive_failures FROM sources ORDER BY product_name').all();
    return json(r.results, 200, cors);
   }
   if (u.pathname === '/observations' && request.method === 'GET') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const key = u.searchParams.get('product_key'); if (!key) return json({ error:'product_key_required' }, 400, cors);
    const r = await env.DB.prepare('SELECT * FROM observations WHERE product_key=? ORDER BY observed_at DESC LIMIT 1000').bind(key).all();
    return json(r.results, 200, cors);
   }
   if (u.pathname === '/events' && request.method === 'GET') {
    if(!authorized)return json({error:'unauthorized'},401,cors);
    const r=await env.DB.prepare('SELECT * FROM market_events ORDER BY created_at DESC LIMIT 100').all();
    return json(r.results,200,cors);
   }
   if (u.pathname === '/compare' && request.method === 'GET') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const key = u.searchParams.get('product_key'); if (!key) return json({ error:'product_key_required' }, 400, cors);
    const r = await env.DB.prepare('SELECT o.*,s.product_name,s.specification,s.delivery,s.tax_basis FROM observations o JOIN sources s ON s.id=o.source_id WHERE o.product_key=? ORDER BY o.observed_at DESC LIMIT 100').bind(key).all();
    return json(r.results, 200, cors);
   }
   return json({ error:'not_found' }, 404, cors);
  } catch (error) { const m = error?.message || 'internal_error'; const bad = CLIENT_ERRORS.has(m) || error instanceof SyntaxError; return json({ error: bad ? m : 'internal_error' }, bad ? 400 : 500, cors); }
 },
 async scheduled(event, env, ctx) {
  if (!env.DB) return;
  ctx.waitUntil((async () => {
   const time = now();
   // slack of 90s: cron ticks start slightly earlier than the previous attempt finished
   const { results = [] } = await env.DB.prepare('SELECT * FROM sources WHERE enabled=1 AND (last_attempt_at IS NULL OR last_attempt_at <= ? - interval_minutes * 60000 + 90000) ORDER BY COALESCE(last_attempt_at,0) ASC LIMIT 20').bind(time).all();
   for (const source of results) {
    // claim atomically so overlapping cron runs do not duplicate observations
    const claim = await env.DB.prepare('UPDATE sources SET last_attempt_at=? WHERE id=? AND (last_attempt_at IS NULL OR last_attempt_at<=?)').bind(time, source.id, time - source.interval_minutes * 60000 + 90000).run();
    if (claim?.meta && claim.meta.changes === 0) continue;
    try {
     const {price} = await fetchSourcePrice(source, env);
     await recordObservation(env, source, price, now());
    } catch (error) { await recordFailure(env, source.id, error); }
   }
  })());
 }
};
export { normalize, parse, selectorText, validPublicUrl };