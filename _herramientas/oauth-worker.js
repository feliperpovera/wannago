// Inicio de sesión con GitHub para el panel /admin (Decap CMS).
// Se publica gratis como Cloudflare Worker; los pasos están en LEEME_CONTEXTO.md.
// Variables del Worker: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (secreto) y ORIGEN (https://feliperpovera.github.io).
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const gh = new URL('https://github.com/login/oauth/authorize');
      gh.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, scope: 'public_repo,user', state, redirect_uri: url.origin + '/callback' });
      return new Response(null, {
        status: 302,
        headers: { Location: gh.toString(), 'Set-Cookie': `wg_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600` },
      });
    }

    if (url.pathname === '/callback') {
      const state = url.searchParams.get('state');
      const okState = state && (req.headers.get('Cookie') || '').includes(`wg_state=${state}`);
      let msg = 'authorization:github:error:' + JSON.stringify({ error: 'La sesión expiró. Intenta de nuevo.' });
      if (okState) {
        const r = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: url.searchParams.get('code') }),
        });
        const j = await r.json();
        if (j.access_token) msg = 'authorization:github:success:' + JSON.stringify({ token: j.access_token, provider: 'github' });
      }
      // Protocolo de Decap: la ventana avisa "authorizing", el panel responde y entonces se entrega el token solo a ORIGEN
      const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
      return new Response(`<!doctype html><meta charset="utf-8"><p>Conectando con el panel…</p><script>
const msg = ${js(msg)}, origen = ${js(env.ORIGEN)};
addEventListener('message', e => { if (e.origin === origen) { opener.postMessage(msg, origen); close(); } });
opener.postMessage('authorizing:github', origen);
</script>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }

    return new Response('Wanna Go · inicio de sesión del panel', { status: 404 });
  },
};
