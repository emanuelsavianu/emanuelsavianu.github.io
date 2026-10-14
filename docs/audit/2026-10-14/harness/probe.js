(() => {
  const out = { url: location.href, vw: innerWidth, vh: innerHeight, lang: document.documentElement.lang || null,
                theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light',
                errors: (window.__jsErrors || []).slice(0, 20) };
  const F = { contrast: [], invisible: [], smallText: [], taps: [], overflowX: [], imgAlt: [], imgDim: [],
              iframeTitle: [], headings: [], links: [], blankNoRel: [], dupIds: [], ariaHiddenFocus: [],
              labels: [], onclickDivs: [], trunc: [], unmeasurable: [], landmarks: [], skip: null,
              tinyClick: [], placeholders: [], chars: [], stuck: [] };

  function parseColor(c) {
    if (!c) return null;
    c = String(c).trim();
    if (c === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    let m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[,\s\/]+/).filter(x => x !== '').map(Number);
      if (p.length < 3 || p.some(isNaN)) return null;
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = c.match(/^#([0-9a-fA-F]{3,8})$/);
    if (m) {
      let h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map(x => x + x).join('');
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
               a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
    }
    return null;
  }
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                     return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const rr = n => Math.round(n * 100) / 100;

  function extractColors(str) {
    const res = [];
    const re = /(#[0-9a-fA-F]{3,8})|(rgba?\([^)]+\))/g;
    let m;
    while ((m = re.exec(str))) { const c = parseColor(m[0]); if (c) res.push(c); }
    return res;
  }

  // effective background: walk up composing alpha layers; stop at first gradient (report stops)
  function bgFor(el) {
    let node = el, layers = [], grad = null, gradFrom = null;
    while (node) {
      const cs = getComputedStyle(node);
      const bi = cs.backgroundImage;
      const cols = (bi && bi !== 'none') ? extractColors(bi) : [];
      if (cols.length) { grad = cols; gradFrom = node.tagName.toLowerCase() + (node.id ? '#' + node.id : ''); break; }
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 0.999) break; }
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { bg: base, grad: grad, gradFrom: gradFrom };
  }

  function pathOf(el) {
    let p = [], n = el, d = 0;
    while (n && n.nodeType === 1 && d < 4) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; p.unshift(s); break; }
      if (n.classList.length) s += '.' + Array.from(n.classList).slice(0, 2).join('.');
      const par = n.parentElement;
      if (par) { const sib = Array.from(par.children).filter(c => c.tagName === n.tagName); if (sib.length > 1) s += ':nth-of-type(' + (sib.indexOf(n) + 1) + ')'; }
      p.unshift(s); n = n.parentElement; d++;
    }
    return p.join(' > ');
  }
  const txt = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);

  const visible = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const directText = el => Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
  const isLarge = (fs, fw) => fs >= 24 || (fs >= 18.66 && fw >= 700);

  const all = Array.from(document.body.querySelectorAll('*')).filter(e => !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(e.tagName));

  // ---------- text contrast ----------
  for (const el of all) {
    if (!directText(el)) continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize) || 16, fw = parseInt(cs.fontWeight) || 400;
    const fg0 = parseColor(cs.color);
    if (!fg0) continue;
    const bgInfo = bgFor(el);
    const large = isLarge(fs, fw), need = large ? 3.0 : 4.5;
    let fg = fg0.a < 1 ? over(fg0, bgInfo.bg) : fg0;
    let r, extra = '';
    if (bgInfo.grad) {
      const rs = bgInfo.grad.map(g => ratio(fg, g));
      r = Math.max(...rs);
      extra = ' grad=' + bgInfo.grad.map(hex).join('/') + ' from=' + bgInfo.gradFrom;
      if (r < need) F.unmeasurable.push({ sel: pathOf(el), text: txt(el), color: hex(fg), font: fs + '/' + fw, ratio: rr(r), need: need, note: extra.trim() });
    } else {
      r = ratio(fg, bgInfo.bg);
      if (r < need) F.contrast.push({ sel: pathOf(el), text: txt(el), color: hex(fg), bg: hex(bgInfo.bg),
                                      font: Math.round(fs * 10) / 10 + '/' + fw, ratio: rr(r), need: need,
                                      ariaHidden: el.closest('[aria-hidden="true"]') ? 1 : 0 });
    }
    if (fs < 12) F.smallText.push({ sel: pathOf(el), text: txt(el), font: Math.round(fs * 10) / 10 });
  }

  // ---------- placeholders ----------
  for (const el of Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]'))) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el, '::placeholder');
    const pc = parseColor(cs.color), bgi = bgFor(el);
    if (pc && !bgi.grad) {
      const c = pc.a < 1 ? over(pc, bgi.bg) : pc;
      const r = ratio(c, bgi.bg);
      if (r < 4.5) F.placeholders.push({ sel: pathOf(el), color: hex(c), bg: hex(bgi.bg), ratio: rr(r) });
    }
  }

  // ---------- invisible controls ----------
  for (const el of Array.from(document.querySelectorAll('a, button, [role="button"], summary, input[type="button"], input[type="submit"]'))) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color); if (!fg) continue;
    const bgInfo = bgFor(el);
    if (bgInfo.grad) continue;
    const c = fg.a < 1 ? over(fg, bgInfo.bg) : fg;
    const r = ratio(c, bgInfo.bg);
    if (r < 1.7) F.invisible.push({ sel: pathOf(el), text: txt(el), color: hex(c), bg: hex(bgInfo.bg), ratio: rr(r) });
  }

  // ---------- tap targets ----------
  for (const el of Array.from(document.querySelectorAll('a, button, [role="button"], summary, input, select, textarea, label[for]'))) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && getComputedStyle(el).display.startsWith('inline') && el.closest('p,li,td,span,div.PIR,article');
    if (r.width < 40 || r.height < 40) F.taps.push({ sel: pathOf(el), text: txt(el), w: Math.round(r.width), h: Math.round(r.height), inline: inline ? 1 : 0 });
  }

  // ---------- horizontal overflow ----------
  const de = document.documentElement;
  out.docOverflow = de.scrollWidth - de.clientWidth;
  if (out.docOverflow > 1) {
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)) {
        F.overflowX.push({ sel: pathOf(el), text: txt(el).slice(0, 30), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
        if (F.overflowX.length > 25) break;
      }
    }
  }

  // ---------- images / iframes ----------
  for (const img of Array.from(document.images)) {
    if (!img.hasAttribute('alt')) F.imgAlt.push({ src: (img.currentSrc || img.src || '').split('/').slice(-1)[0], sel: pathOf(img) });
    if (!img.hasAttribute('width') || !img.hasAttribute('height')) F.imgDim.push({ src: (img.currentSrc || img.src || '').split('/').slice(-1)[0], w: img.getAttribute('width'), h: img.getAttribute('height') });
  }
  for (const f of Array.from(document.querySelectorAll('iframe'))) {
    const t = f.getAttribute('title');
    if (!t || !t.trim()) F.iframeTitle.push({ src: (f.src || '').slice(0, 80), sel: pathOf(f) });
  }

  // ---------- headings ----------
  const hs = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  const h1s = Array.from(document.querySelectorAll('h1'));
  out.h1count = h1s.length;
  out.h1text = h1s.map(h => (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80));
  out.h1br = h1s.map(h => h.innerHTML.includes('<br')).filter(Boolean).length;
  let prev = 0;
  for (const h of hs) {
    const lvl = parseInt(h.tagName[1], 10);
    if (prev && lvl > prev + 1) F.headings.push({ sel: pathOf(h), from: 'h' + prev, to: 'h' + lvl, text: txt(h) });
    prev = lvl;
  }
  out.headingBr = hs.filter(h => h.innerHTML.includes('<br')).length;

  // ---------- links ----------
  const generic = /^(qui|premi qui|clicca qui|clicca|leggi di pi[uù]|scopri di pi[uù]|link|vai|dettagli|more|click here|here|read more)$/i;
  for (const a of Array.from(document.querySelectorAll('a'))) {
    const href = a.getAttribute('href') || '';
    const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!href || href === '#') F.links.push({ reason: 'empty/no href', sel: pathOf(a), text: t.slice(0, 40) });
    if (!t && !a.getAttribute('aria-label') && !a.querySelector('img[alt]:not([alt=""])') && !a.querySelector('i[aria-hidden="true"]') && !a.getAttribute('title'))
      F.links.push({ reason: 'no accessible name', sel: pathOf(a), text: '' });
    if (generic.test(t)) F.links.push({ reason: 'generic link text', sel: pathOf(a), text: t });
    if (/^tel:/i.test(href) && !/^tel:\+?[0-9]+$/.test(href)) F.links.push({ reason: 'tel: not dialable', sel: pathOf(a), text: href });
    if (/^mailto:/i.test(href) && !/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(href)) F.links.push({ reason: 'mailto malformed', sel: pathOf(a), text: href });
    if (a.target === '_blank' && !/(noopener|noreferrer)/.test(a.rel || '')) F.blankNoRel.push({ sel: pathOf(a), text: t.slice(0, 40), href: href.slice(0, 60) });
  }

  // ---------- ids / aria ----------
  const seen = {};
  for (const el of all) if (el.id) seen[el.id] = (seen[el.id] || 0) + 1;
  for (const k in seen) if (seen[k] > 1) F.dupIds.push({ id: k, n: seen[k] });
  for (const el of Array.from(document.querySelectorAll('[aria-hidden="true"]'))) {
    const f = el.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (f.length) F.ariaHiddenFocus.push({ sel: pathOf(el), n: f.length });
  }

  // ---------- forms ----------
  for (const el of Array.from(document.querySelectorAll('input:not([type=hidden]), select, textarea'))) {
    if (!visible(el)) continue;
    const id = el.id, lbl = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
    const wrap = el.closest('label');
    const name = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (lbl && lbl.textContent) || (wrap && wrap.textContent);
    if (!name || !String(name).trim()) F.labels.push({ sel: pathOf(el), type: el.type || el.tagName, ph: el.getAttribute('placeholder') || '', reason: 'no label' });
    if (['text', 'email', 'tel', 'name'].includes(el.type || '') && el.name && !el.getAttribute('autocomplete'))
      F.labels.push({ sel: pathOf(el), type: el.type, reason: 'no autocomplete', name: el.name });
  }

  // ---------- clickable non-semantic ----------
  for (const el of Array.from(document.querySelectorAll('[onclick]'))) {
    if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION)$/.test(el.tagName)) continue;
    if (el.getAttribute('role') || el.hasAttribute('tabindex')) continue;
    F.onclickDivs.push({ sel: pathOf(el), text: txt(el).slice(0, 40), onclick: (el.getAttribute('onclick') || '').slice(0, 40) });
  }

  // ---------- truncation ----------
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (!(cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis')) continue;
    if (el.scrollWidth > el.clientWidth + 3 && el.clientWidth > 0 && directText(el))
      F.trunc.push({ sel: pathOf(el), text: txt(el).slice(0, 30), scroll: el.scrollWidth, client: el.clientWidth });
  }

  // ---------- landmarks / skip ----------
  const mains = document.querySelectorAll('main, [role="main"]');
  out.mains = mains.length;
  out.mainId = mains.length ? (mains[0].id || '(no id)') : null;
  const skip = document.querySelector('a.skip-link, a[href^="#main"], a[href^="#content"]');
  out.skip = skip ? { text: (skip.textContent || '').trim(), href: skip.getAttribute('href'),
                      targetExists: !!document.querySelector(skip.getAttribute('href') || '#!') } : null;
  out.navNoLabel = Array.from(document.querySelectorAll('nav')).filter(n => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length;
  out.navs = document.querySelectorAll('nav').length;
  out.landmarks = Array.from(document.querySelectorAll('header, footer, nav, aside, section[aria-label], [role]')).length;

  // ---------- legal chars ----------
  const bodyText = document.body.innerText || '';
  out.bodyChars = bodyText.length;
  out.asterisks = (bodyText.match(/\*/g) || []).length;
  out.hasPlaceholderText = /lorem ipsum|\[inserire|TODO|FIXME|XXX/i.test(bodyText);
  out.langAttrInPage = document.querySelectorAll('[lang]').length;

  // ---------- stuck / never-revealed content ----------
  for (const el of all) {
    if (!directText(el)) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const op = parseFloat(cs.opacity);
    const hiddenButRendered = (cs.visibility === 'hidden' || (op >= 0 && op < 0.15));
    if (!hiddenButRendered) continue;
    if (el.closest('[hidden], .sr-only, .visually-hidden, [aria-hidden="true"]')) continue;
    if (txt(el).length < 15) continue;
    F.stuck.push({ sel: pathOf(el), text: txt(el).slice(0, 45), opacity: op, visibility: cs.visibility });
  }

  // ---------- cta summary ----------
  out.counts = {};
  for (const k in F) if (Array.isArray(F[k])) out.counts[k] = F[k].length;
  out.findings = F;
  return JSON.stringify(out);
})()
