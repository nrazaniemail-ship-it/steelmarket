// Optional CORS proxy for the local PWA. Configure ALLOWED_HOSTS and APP_ORIGIN.
function cors(origin, env) {
 const list = String(env.APP_ORIGIN || '').split(',').map(x => x.trim().replace(/\/+$/, '')).filter(Boolean);
 return origin && list.includes(origin.replace(/\/+$/, '')) ? {
  'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods':'GET,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type', 'Vary':'Origin'
 } : {};
}
function safeUrl(raw, allowed) {
 let u; try { u = new URL(raw); } catch { throw Error('Invalid URL'); }
 if (u.protocol !== 'https:' || u.username || u.password) throw Error('HTTPS URL required');
 const h = u.hostname.toLowerCase();
 if (u.port && u.port !== '443') throw Error('Port not allowed');
 const bare = x => String(x).toLowerCase().replace(/^www\./, '');
 if (!allowed.some(a => bare(a) === bare(h))) throw Error('Host not allowlisted');
 if (h.startsWith('[') || /^\d+(\.\d+){0,3}$/.test(h)) throw Error('IP literal blocked');
 if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.localhost') ||
     /^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(h) || h === '::1') throw Error('Private host blocked');
 return u;
}
export default {
 async fetch(request, env) {
  const origin = request.headers.get('Origin') || '', headers = cors(origin, env);
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  const url = new URL(request.url);
  if (url.pathname !== '/fetch' || request.method !== 'GET') return new Response('Not found', { status:404, headers });
  try {
   const raw = url.searchParams.get('url'); if (!raw) return new Response('Missing url', { status:400, headers });
   const allowed = (env.ALLOWED_HOSTS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
   let target = safeUrl(raw, allowed), upstream;
   for (let hop = 0; hop < 4; hop++) {
    upstream = await fetch(target, { redirect:'manual', signal:AbortSignal.timeout(15000),
     headers:{ 'User-Agent':'FooladbanProxy/1.1', 'Accept':'text/html,application/json,text/plain,*/*' } });
    if ([301,302,303,307,308].includes(upstream.status)) {
     const location = upstream.headers.get('Location'); if (!location) throw Error('Redirect without Location');
     target = safeUrl(new URL(location, target).toString(), allowed); continue;
    }
    break;
   }
   if (!upstream || !upstream.ok) return new Response('Upstream error', { status:502, headers });
   const type = upstream.headers.get('content-type') || '';
   if (!/text\/html|application\/json|text\/plain/i.test(type)) return new Response('Unsupported content type', { status:415, headers });
   const body = await upstream.text(); if (body.length > 1500000) return new Response('Response too large', { status:413, headers });
   return new Response(body, { status:200, headers:{ ...headers, 'Content-Type':/json/i.test(type)?'application/json; charset=utf-8':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"sandbox; default-src 'none'" } });
  } catch (error) { return new Response(error.message || 'Proxy error', { status:400, headers }); }
 }
};