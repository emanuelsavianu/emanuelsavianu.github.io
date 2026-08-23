/**
 * Cloudflare Worker — Branded Booking Redirect
 * prenota.savianu.it -> Doctolib profile (302 Temporary Redirect)
 *
 * Deploy: cd cloudflare && npx wrangler deploy --config wrangler-booking.toml
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 302 Temporary Redirect to real Doctolib profile URL
    // (use 302 instead of 301 because the underlying Doctolib URL might change)
    const targetUrl = 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/booking?source=profile';

    // Preserve query string if any
    const target = new URL(targetUrl);
    target.search = url.search;

    return Response.redirect(target.toString(), 302);
  },
};