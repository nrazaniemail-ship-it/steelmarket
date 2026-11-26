const now = () => Date.now();
function json(data, status = 200, cors = {}) {
 return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...cors } });
}
function corsHeaders(req, env) {
 const origin = req.headers.get('origin') || '';
 const allowed = env.APP_ORIGIN || '';
 return origin && origin === allowed ? { 'access-control-allow-origin':origin, 'access-control-allow-methods':'GET,POST,OPTIONS', 'access-control-allow-headers':'content-type,authorization', 'vary':'Origin' } : {};
}
function validPublicUrl(raw, allowed) {
 let u; try { u = new URL(raw); } catch { throw Error('invalid_url'); }
 if (u.protocol !== 'https:' || u.username || u.password) throw Error('https_required');
 const h = u.hostname.toLowerCase();
 if (!allowed.includes(h)) throw Error('host_not_allowlisted');
 if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') ||
     /^127\\.|^10\\.|^192\\.168\\.|^169\\.254\\.|^172\\.(1[6-9]|2\\d|3[01])\\./.test(h) || h === '::1') throw Error('private_host_blocked');
 return u;
}
function normalize(value) {
 const s = String(value ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\\s]/g, '')
  .replace('٫', '.').replace(/[^0-9.+-]/g, '');
 const n = Number(s); if (!(n > 0 && Number.isFinite(n))) throw Error('invalid_price'); return n;
}
function attr(attrs, name) {
 const re = new RegExp('\\\\b' + name + '\\\\s*=\\\\s*([\\\\\"\\\'])(.*?)\\\\1', 'i');
 return attrs.match(re)?.[2] || '';
}
function selectorText(body, selector) {
 const q = String(selector || '').trim();
 const matches = body.matchAll(/<([a-z][a-z0-9:-]*)\\b([^>]*)>([\\s\\S]*?)<\\/\\1\\s*>/gi);
 for (const m of matches) {
  const attrs = m[2] || '';
  let ok = false;
  if (q.startsWith('#')) ok = attr(attrs, 'id') === q.slice(1);
  else if (q.startsWith('.')) ok = attr(attrs, 'class').split(/\\s+/).includes(q.slice(1));
  else if (q === '[data-price]') ok = /\\bdata-price(?:\\s|=|>)/i.test(attrs);
  else if (q === '[itemprop=price]') ok = attr(attrs, 'itemprop') === 'price';
  else throw Error('supported_selectors: #id, .class, [data-price], [itemprop=price]');
  if (ok) return attr(attrs, 'content') || attr(attrs, 'data-price') || m[3].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
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
  const meta = body.match(/<meta[^>]*(?:property=["']product:price:amount["']|itemprop=["']price["'])[^>]*content=["']([^"']+)["']/i);
  if (meta) return normalize(meta[1]);
  try { return normalize(selectorText(body, '[data-price]')); } catch {}
  for (const cls of ['.price', '.price-value', '.last-price']) {
   try { return normalize(selectorText(body, cls)); } catch {}
  }
 }
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
 if (!/text\\/html|application\\/json|text\\/plain/i.test(response.headers.get('content-type') || '')) throw Error('unsupported_content_type');
 const body = await response.text(); if (body.length > 1500000) throw Error('response_too_large'); return body;
}
export default {
 async fetch(request, env) {
  const u = new URL(request.url), cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { headers:cors });
  if (u.pathname === '/health') return json({ ok:true, service:'fooladban-steel-api', time:now() }, 200, cors);
  if (!env.DB) return json({ error:'D1 binding DB is not configured' }, 503, cors);
  const authorized = env.API_TOKEN && request.headers.get('authorization') === 'Bearer ' + env.API_TOKEN;
  try {
   if (u.pathname === '/sources' && request.method === 'POST') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const s = await request.json();
    if (!s.id || !s.product_key || !s.product_name || !s.url || !s.source_kind) return json({ error:'missing_required_fields' }, 400, cors);
    validPublicUrl(s.url, (env.ALLOWED_HOSTS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
    await env.DB.prepare('INSERT INTO sources(id,product_key,product_name,specification,source_kind,market,url,parser_mode,selector,regex,json_path,currency,measure_unit,delivery,tax_basis,interval_minutes,enabled,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)')
     .bind(s.id,s.product_key,s.product_name,s.specification||'',s.source_kind,s.market||'Iran',s.url,s.parser_mode||'auto',s.selector||null,s.regex||null,s.json_path||'price',s.currency||'IRR',s.measure_unit||'kg',s.delivery||'',s.tax_basis||'',Math.max(15,Number(s.interval_minutes)||15),now()).run();
    return json({ ok:true, id:s.id }, 201, cors);
   }
   if (u.pathname === '/sources' && request.method === 'GET') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const r = await env.DB.prepare('SELECT id,product_key,product_name,specification,source_kind,market,currency,measure_unit,enabled,last_attempt_at,last_success_at,last_error,consecutive_failures FROM sources ORDER BY product_name').all();
    return json(r.results, 200, cors);
   }
   if (u.pathname === '/observations' && request.method === 'GET') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const key = u.searchParams.get('product_key'); if (!key) return json({ error:'product_key_required' }, 400, cors);
    const r = await env.DB.prepare('SELECT * FROM observations WHERE product_key=? ORDER BY observed_at DESC LIMIT 1000').bind(key).all();
    return json(r.results, 200, cors);
   }
   if (u.pathname === '/compare' && request.method === 'GET') {
    if (!authorized) return json({ error:'unauthorized' }, 401, cors);
    const key = u.searchParams.get('product_key'); if (!key) return json({ error:'product_key_required' }, 400, cors);
    const r = await env.DB.prepare('SELECT o.*,s.product_name,s.specification,s.delivery,s.tax_basis FROM observations o JOIN sources s ON s.id=o.source_id WHERE o.product_key=? ORDER BY o.observed_at DESC LIMIT 100').bind(key).all();
    return json(r.results, 200, cors);
   }
   return json({ error:'not_found' }, 404, cors);
  } catch (error) { return json({ error:error.message || 'internal_error' }, 500, cors); }
 },
 async scheduled(event, env, ctx) {
  if (!env.DB) return;
  ctx.waitUntil((async () => {
   const time = now();
   const { results = [] } = await env.DB.prepare('SELECT * FROM sources WHERE enabled=1 AND (last_attempt_at IS NULL OR last_attempt_at <= ? - interval_minutes * 60000)').bind(time).all();
   for (const source of results) {
    try {
     const body = await fetchSafe(source, env), price = parse(body, source);
     const rates = { IRR:1, IRT:10, USD:Number(env.USD_IRR), AED:Number(env.AED_IRR), EUR:Number(env.EUR_IRR) };
     const fx = rates[source.currency] || 0, factor = source.measure_unit === 'ton' ? 0.001 : 1;
     const normalized = fx > 0 ? price * factor * fx : null, id = crypto.randomUUID(), recorded = now();
     await env.DB.prepare('INSERT INTO observations(id,source_id,product_key,source_kind,raw_price,currency,measure_unit,irr_per_kg,observed_at,recorded_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind(id,source.id,source.product_key,source.source_kind,price,source.currency,source.measure_unit,normalized,recorded,recorded).run();
     await env.DB.prepare('UPDATE sources SET last_attempt_at=?,last_success_at=?,last_error=NULL,consecutive_failures=0 WHERE id=?').bind(recorded,recorded,source.id).run();
    } catch (error) {
     await env.DB.prepare('UPDATE sources SET last_attempt_at=?,last_error=?,consecutive_failures=consecutive_failures+1 WHERE id=?').bind(now(),String(error.message||error).slice(0,300),source.id).run();
    }
   }
  })());
 }
};
export { normalize, parse, selectorText, validPublicUrl };