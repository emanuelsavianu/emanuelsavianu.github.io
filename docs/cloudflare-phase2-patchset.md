# Cloudflare Phase 2 Patch Set

This patch set starts the edge-hardening phase while keeping GitHub Pages as origin.

## 1) DNS and SSL

- Put `savianu.it` behind Cloudflare proxy (orange cloud).
- SSL/TLS mode: `Full (strict)`.
- Enable HTTP/2 and HTTP/3.
- Always Use HTTPS: `ON`.

## 2) Response Security Headers (Transform Rule or Worker)

Apply these headers to HTML responses:

- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://calendar.app.google https://calendar.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https:; frame-src https://calendar.google.com https://calendar.app.google; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

Notes:
- Keep `'unsafe-inline'` only while inline scripts/styles remain.
- Move inline scripts/styles to files later to tighten CSP.

## 3) Caching Rules

- HTML (`*.html`, `/`): `Cache-Control: public, max-age=0, must-revalidate`.
- Static assets (`*.css`, `*.js`, images): `Cache-Control: public, max-age=31536000, immutable` only for versioned files (`?v=` or hashed filenames).

## 4) Bot and Abuse Protection

- Enable Cloudflare WAF managed rules.
- Add rate limit on sensitive endpoints/paths if added later.
- Add a bot fight mode profile suitable for static brochure sites.

## 5) Optional Worker Skeleton (headers enforcement)

```js
export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);

    const ctype = newHeaders.get("content-type") || "";
    if (ctype.includes("text/html")) {
      newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      newHeaders.set("X-Content-Type-Options", "nosniff");
      newHeaders.set("X-Frame-Options", "DENY");
      newHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
      newHeaders.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://calendar.app.google https://calendar.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https:; frame-src https://calendar.google.com https://calendar.app.google; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests");
      newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
```

## 6) Verification checklist

- Security headers visible in browser devtools network tab.
- CSP does not break booking flows, external fonts/icons, or PWA behavior.
- Lighthouse Best Practices and SEO scores unchanged or improved.
