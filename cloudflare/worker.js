/**
 * Cloudflare Worker — Security Header Injector
 * savianu.it  (GitHub Pages origin)
 *
 * Deploy:  cd cloudflare && npx wrangler deploy
 * Preview: cd cloudflare && npx wrangler dev
 *
 * This worker:
 *  1. Passes every request through to the GitHub Pages origin unchanged.
 *  2. Adds hardened security headers to every HTML response.
 *  3. Leaves non-HTML assets (CSS/JS/images/fonts) untouched.
 */

// ── Security header values ────────────────────────────────────────────────────

const SECURITY_HEADERS = {
  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Block framing from external origins (no iframes needed on this site)
  'X-Frame-Options': 'DENY',

  // Force HTTPS for 1 year, include subdomains, eligible for preload list
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Only send origin (no path/query) on cross-origin navigations
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Disable features that a medical info site should never need
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'interest-cohort=()',    // opt out of FLoC/Topics
    'screen-wake-lock=()',
    'serial=()',
  ].join(', '),

  // Content Security Policy
  // Notes:
  //  • 'unsafe-inline' for scripts/styles is required because the site uses
  //    inline <script> blocks and inline style attributes without a build step.
  //    Once a build step is added, replace with nonces or hashes.
  //  • fonts.googleapis.com / gstatic: Google Fonts
  //  • cdnjs.cloudflare.com: RUAP/gestoreturni CSS (all.min.css) + font files + JS (jsPDF, html2canvas, xlsx)
  //  • cdn.tailwindcss.com: Tailwind CDN used by RUAP and other tool pages
  //  • cdn.jsdelivr.net: chart.js on malattia/guida/scudo pages
  //  • unpkg.com: react/react-dom/babel on calcolatore-ferie pages
  //  • cdn.sheetjs.com: xlsx on calcolatore-ferie
  //  • calendar.google.com: private-practice booking button (script/style-src)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://calendar.google.com https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://cdn.sheetjs.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://calendar.google.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https://savianu.it",
    "connect-src 'self'",
    "frame-src https://calendar.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
};

// ── Legacy path redirects (pre-merge URLs -> new structure) ─────────────────
// Same map as cloudflare/redirect-worker.js (spec §10), except /malattia.html
// which was the patient guide on this domain -> ssn/malattia.html.

const LEGACY_REDIRECTS = {
  '/faq.html': '/ssn/faq.html',
  '/malattia.html': '/ssn/malattia.html',
  '/esenzioni.html': '/ssn/esenzioni.html',
  '/impegnative.html': '/ssn/impegnative.html',
  '/cert-malattia.html': '/ssn/cert-malattia.html',
  '/visite-private.html': '/privati/',
  '/colleghi.html': '/colleghi/',
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
  '/salutementale.html': '/ssn/salutementale.html',
  '/vivisano.html': '/ssn/vivisano.html',
  '/bengalese.html': '/ssn/bengalese.html',
  '/urdu.html': '/ssn/urdu.html',
};

// ── Worker entry point ────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Legacy URLs: 301 before hitting the origin (they would 404 on GitHub Pages)
    const legacyTarget = LEGACY_REDIRECTS[url.pathname];
    if (legacyTarget) {
      url.pathname = legacyTarget;
      return Response.redirect(url.toString(), 301);
    }

    // Pass the request to the origin as-is
    const response = await fetch(request);

    const contentType = response.headers.get('Content-Type') || '';

    // Fix sitemap.xml MIME type (GitHub Pages may serve as plain text)
    if (url.pathname === '/sitemap.xml') {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Content-Type', 'application/xml; charset=UTF-8');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // Only modify HTML responses — leave CSS, JS, images, fonts untouched
    if (!contentType.includes('text/html')) {
      return response;
    }

    // Clone headers and inject security headers
    const newHeaders = new Headers(response.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      newHeaders.set(name, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
