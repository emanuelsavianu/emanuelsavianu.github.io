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
  //  • cdnjs.cloudflare.com: Font Awesome CSS + font files
  //  • calendar.app.google: Google Calendar booking links open in new tab —
  //    no frame-src required, but listed for future embed safety.
  //  • millebook.it: external link only — no embed.
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https://savianu.it",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
};

// ── Worker entry point ────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // Pass the request to the origin as-is
    const response = await fetch(request);

    const url = new URL(request.url);
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
