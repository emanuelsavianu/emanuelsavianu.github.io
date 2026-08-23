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
  //  • fonts.googleapis.com / gstatic: Google Fonts — STILL REQUIRED by the
  //    self-contained pages (ssn/poster-*, bengalese/urdu, salutementale/vivisano,
  //    colleghi/malattia+installazione, RUAP). Main-site pages now self-host
  //    Montserrat/Cormorant Garamond via /assets/fonts/fonts.css (2026-08-22),
  //    so these origins could be dropped only when every remaining GF page is
  //    also self-hosted.
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
      "img-src 'self' data: https://savianu.it https://www.gstatic.com",
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

// ── Inquiry form endpoint (/api/intl-inquiry) ────────────────────────────────
// Receives the /international/ inquiry form and forwards it via Email Routing
// (SEND_EMAIL binding). No storage, no auto-reply to the patient. Setup:
// Setup: docs/cloudflare-email-worker-setup.md

const INQUIRY_TO = 'private@savianu.it';
const RATE_LIMIT_HOURS = 5;          // max emails per hour per IP

const rate = new Map();              // ip -> [timestamps] (per-isolate; best-effort)

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function handleInquiry(request, env, ctx) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResp({ ok: false, error: 'invalid_body' }, 400);
  }

  // Honeypot + time-trap: silently accept and drop obvious bots.
  if (data.website || !data.ts || Date.now() - Number(data.ts) < 3000 ||
      Date.now() - Number(data.ts) > 86400000) {
    return jsonResp({ ok: true });
  }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const consent = data.consent === true;
  if (!name || name.length > 200 || consent !== true) {
    return jsonResp({ ok: false, error: 'invalid_fields' }, 400);
  }
  // Deliberately permissive email shape check — real validation is the MX round-trip.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResp({ ok: false, error: 'invalid_email' }, 400);
  }

  const pick = (v, allowed) => (allowed.includes(v) ? v : '');
  const lang = pick(data.lang, ['en', 'it']);
  const status = pick(data.status, ['resident', 'second-home', 'visitor', 'nomad']);
  const reason = pick(data.reason, ['new-patient', 'documentation', 'coordination', 'home-visit', 'other']);
  if (!lang || !reason) {
    return jsonResp({ ok: false, error: 'invalid_fields' }, 400);
  }
  const note = String(data.note || '').trim().slice(0, 2000);
  const phone = String(data.phone || '').trim().slice(0, 40);

  // Best-effort rate limit (per isolate — resets on deploy; acceptable here)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const hits = (rate.get(ip) || []).filter(t => now - t < 3600000);
  if (hits.length >= RATE_LIMIT_HOURS || (hits.length && now - hits[hits.length - 1] < 600000)) {
    return jsonResp({ ok: false, error: 'rate_limited' }, 429);
  }

  const label = {
    en: 'English', it: 'Italiano',
  };
  const reasonLabel = {
    'new-patient': 'New patient consultation',
    documentation: 'Medical documentation or certificate',
    coordination: 'Care coordination',
    'home-visit': 'Home visit request',
    other: 'Other',
  };
  const statusLabel = {
    resident: 'Resident',
    'second-home': 'Second-home owner',
    visitor: 'Visitor',
    nomad: 'Remote worker / digital nomad',
  };

  const lines = [
    'International patient inquiry — savianu.it/international/',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || '(not provided)'}`,
    `Preferred language: ${label[lang]}`,
    `Status: ${statusLabel[status] || '(not specified)'}`,
    `Reason: ${reasonLabel[reason]}`,
    `Note: ${note || '(none)'}`,
    '',
    'Privacy policy accepted: yes',
    '(Administrative details only - medical history to be collected through a secure channel.)',
  ].join('\n');

  const message = {
    from: 'savianu.it inquiries <noreply@savianu.it>',
    to: INQUIRY_TO,
    reply_to: email,                       // reply goes straight to the patient
    subject: `[International inquiry] ${reasonLabel[reason]} - ${name}`,
    text: lines,
  };

  try {
    hits.push(now);
    rate.set(ip, hits);
    await env.SEND_EMAIL.send(message);   // requires Email Routing active (see setup doc)
  } catch {
    return jsonResp({ ok: false, error: 'send_failed' }, 502);
  }

  return jsonResp({ ok: true });
}

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
