/**
 * Cloudflare Worker — 301 Permanent Redirect
 * dottemanuelsavianu.it -> savianu.it
 *
 * Deploy: cd cloudflare && npx wrangler deploy --config wrangler-redirect.toml
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Target domain destination
    url.hostname = 'savianu.it';
    url.protocol = 'https:';
    url.port = '';

    // 301 Permanent Redirect for SEO preservation
    return Response.redirect(url.toString(), 301);
  },
};
