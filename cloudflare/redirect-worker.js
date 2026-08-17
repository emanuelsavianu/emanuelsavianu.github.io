/**
 * Cloudflare Worker — 301 Permanent Redirects
 * dottemanuelsavianu.it -> savianu.it (legacy path map, spec §10)
 *
 * Deploy: cd cloudflare && npx wrangler deploy --config wrangler-redirect.toml
 */

// Legacy -> new path map (docs/superpowers/specs/2026-08-08-unified-savianu-site-design.md §10).
// Unknown paths fall through to a same-path redirect (keeps assets working).
const REDIRECTS = {
  '/faq.html': '/ssn/faq.html',
  '/esenzioni.html': '/ssn/esenzioni.html',
  '/impegnative.html': '/ssn/impegnative.html',
  '/cert-malattia.html': '/ssn/cert-malattia.html',
  '/visite-private.html': '/privati/',
  '/colleghi.html': '/colleghi/',
  '/malattia.html': '/colleghi/malattia.html',
  '/guida_interattiva_mmg.html': '/colleghi/guida-interattiva-mmg.html',
  '/lo_scudo_del_medico.html': '/colleghi/lo-scudo-del-medico.html',
  '/calcolatore-ferie.html': '/colleghi/calcolatore-ferie.html',
  '/calcolatoreferiegemini.html': '/colleghi/calcolatore-ferie-gemini.html',
  '/certificato-invalidita-civile.html': '/privati/certificato-invalidita-civile.html',
  '/faq-riforma.html': '/privati/faq-riforma.html',
  '/protocollo-certificati-inps.html': '/colleghi/protocollo-certificati-inps.html',
  '/installazione.html': '/colleghi/installazione.html',
  '/xsegretarie.html': '/colleghi/xsegretarie.html',
  '/ferie.html': '/ssn/',
  '/privacy.html': '/privacy.html',
  '/offline.html': '/offline.html',
  '/index.html': '/',
  '/RUAP/': '/colleghi/RUAP/',
  '/gestoreturni/': '/colleghi/gestoreturni/',
  '/salutementale.html': '/ssn/salutementale.html',
  '/vivisano.html': '/ssn/vivisano.html',
  '/bengalese.html': '/ssn/bengalese.html',
  '/urdu.html': '/ssn/urdu.html',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    url.pathname = REDIRECTS[url.pathname] || url.pathname;
    url.hostname = 'savianu.it';
    url.protocol = 'https:';
    url.port = '';

    // 301 Permanent Redirect for SEO preservation (query string preserved)
    return Response.redirect(url.toString(), 301);
  },
};
