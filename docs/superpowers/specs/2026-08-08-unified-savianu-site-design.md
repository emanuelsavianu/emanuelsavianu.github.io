# Unified savianu.it — Merge & Refactor Design

**Date:** 2026-08-08
**Status:** Approved by user (2026-08-08)
**Repos involved:**
- `emanuelsavianu.github.io` (patient portal, GitHub Pages → savianu.it) — base repo, transformed in place
- `dottemanuelsavianu.it` (private practice + colleagues portal) — content merged in

## 1. Goals

1. Merge both repositories into a single, clean, modern static project for `savianu.it`.
2. New home page: three-choice landing gateway — 🏥 **Pazienti SSN**, 💼 **Pazienti Privati**, 🤝 **Colleghi** — each leading to a dedicated section dashboard.
3. Migrate ALL content, mapping pages logically under the three sections.
4. Unify the design system, ensure full responsiveness and WCAG 2.1 AA accessibility.
5. Clean up redundant files, unused CSS/JS, duplicated assets, and stale redirect pages.
6. All internal links rewritten to **relative paths** so the site works on `savianu.it` (user handles DNS + Cloudflare redirects for old domains).

## 2. Tech Stack (user-approved)

**Pure static HTML/CSS/JS** — no build step, GitHub Pages + Cloudflare, service worker PWA, instant deploys on push. One shared `styles.css`, one shared `app.js`, one shared `config.js`. Both repos already share design tokens (navy `#1a2f4c` / gold `#c29b57`, Montserrat + Playball, ~1200-line diverged `styles.css` base), which makes the merge low-risk.

**Migration approach:** transform `emanuelsavianu.github.io` in place via `git mv` (preserves history); copy files from `dottemanuelsavianu.it` (its history stays in that repo). Old-domain redirects are the user's responsibility at Cloudflare; we deliver the URL mapping (Section 10).

## 3. Final File Structure

```
/                                   index.html = NEW 3-choice landing
├── styles.css                      merged design system
├── app.js                          merged JS (i18n IT/EN, dark mode, large-text, flowchart, badges, components)
├── config.js                       merged: SCHEDULE + ASSENZE + DOCTOLIB + GOOGLE_CAL
├── sw.js · manifest.json · CNAME · robots.txt · sitemap.xml · 404.html (new)
├── privacy.html                    canonical GDPR (merged from both)
├── offline.html                    canonical SW fallback
├── assets/
│   ├── bluelogo.png                (from dott repo — fixes missing icon in current repo)
│   └── bronzelogo.png              (OG image)
├── cloudflare/worker.js            CSP updated: allow calendar.google.com frames
│
├── ssn/                            🏥 PAZIENTI SSN
│   ├── index.html                  dashboard: Doctolib booking, 116 117, contacts, quick links
│   ├── faq.html                    ONE merged FAQ (union of both repos' Q&As, IT/EN)
│   ├── esenzioni.html              (from dott)
│   ├── impegnative.html            (from dott)
│   ├── cert-malattia.html          (from dott)
│   ├── malattia.html               patient sick-leave guide (from current repo)
│   ├── bengalese.html              (from current)
│   ├── urdu.html                   (from current)
│   ├── salutementale.html          A3 poster (from current)
│   └── vivisano.html               A3 poster (from current)
│
├── privati/                        💼 PAZIENTI PRIVATI
│   ├── index.html                  dashboard: Google Calendar booking iframe, services, contacts
│   ├── certificato-invalidita-civile.html   (from dott)
│   └── faq-riforma.html                     (from dott)
│
├── colleghi/                       🤝 COLLEGHI (IT-only content; internal audience)
│   ├── index.html                  dashboard (from dott colleghi.html: tools, protocols, facsimili hub)
│   ├── protocollo-certificati-inps.html     (from dott)
│   ├── rsa.html                             (from dott)
│   ├── installazione.html                   (from dott)
│   ├── xsegretarie.html                     (from dott, staff, noindex)
│   ├── malattia.html                        MMG legal guide (from dott; distinct from ssn/malattia.html)
│   ├── guida-interattiva-mmg.html           (from dott guida_interattiva_mmg.html)
│   ├── lo-scudo-del-medico.html             (from dott lo_scudo_del_medico.html)
│   ├── calcolatore-ferie.html               (from dott)
│   ├── calcolatore-ferie-gemini.html        (from dott calcolatoreferiegemini.html)
│   ├── RUAP/                                as-is, untouched
│   └── gestoreturni/                        as-is, untouched
│
└── (removed) ferie.html            legacy landing — unique content folded into ssn/
```

## 4. Content Mapping

### From dottemanuelsavianu.it
| Old path | New path | Action |
|---|---|---|
| `index.html` | — | **Replaced** by new landing (was meta-refresh redirect) |
| `visite-private.html` | `privati/index.html` | Migrate + integrate contacts/hours; booking iframe kept |
| `colleghi.html` | `colleghi/index.html` | Migrate; fix `#facsimili` anchors |
| `faq.html` | `ssn/faq.html` | **Merged** with current-repo FAQ (union of Q&As) |
| `esenzioni.html`, `impegnative.html`, `cert-malattia.html` | `ssn/` | Migrate; backlinks `index.html#facsimili` → `../colleghi/index.html#facsimili` |
| `malattia.html` | `colleghi/malattia.html` | Rename-location only; content kept (MMG legal) |
| `guida_interattiva_mmg.html` | `colleghi/guida-interattiva-mmg.html` | Renamed (kebab-case) |
| `lo_scudo_del_medico.html` | `colleghi/lo-scudo-del-medico.html` | Renamed (kebab-case) |
| `calcolatore-ferie.html`, `calcolatoreferiegemini.html` | `colleghi/calcolatore-ferie.html`, `colleghi/calcolatore-ferie-gemini.html` | Migrate |
| `certificato-invalidita-civile.html` | `privati/certificato-invalidita-civile.html` | Migrate |
| `faq-riforma.html` | `privati/faq-riforma.html` | Migrate |
| `protocollo-certificati-inps.html`, `rsa.html`, `installazione.html`, `xsegretarie.html` | `colleghi/` | Migrate |
| `ferie.html` | — | **Retired**; verify unique content (visit types, guardia medica, contacts) is covered by `ssn/index.html` + Doctolib |
| `privacy.html`, `offline.html` | root (canonical) | Merge/align with current-repo versions |
| `RUAP/`, `gestoreturni/` | `colleghi/` | Copy as-is, untouched |
| `bluelogo.png` | `assets/bluelogo.png` | Copy |
| `email-templates/`, `schema-templates/` | keep at root (admin assets, not linked from site) | Copy as-is |
| `config.js`, `app.js`, `styles.css` | merged into root equivalents | See §5–7 |

### From emanuelsavianu.github.io (base repo)
| Old path | New path | Action |
|---|---|---|
| `index.html` | — | **Replaced** by new landing |
| `faq.html` | `ssn/faq.html` | Merged (union with dott FAQ) |
| `malattia.html` | `ssn/malattia.html` | Migrate (patient guide, Tailwind standalone) |
| `bengalese.html`, `urdu.html` | `ssn/` | Migrate |
| `salutementale.html`, `vivisano.html` | `ssn/` | Migrate (posters, self-contained) |
| `privacy.html`, `offline.html` | root (canonical) | Merge/align |
| `cloudflare/`, `.claude/`, `docs/`, `manifest.json`, `sw.js`, `sitemap.xml`, `robots.txt` | keep | Update (see §8) |
| `logo.png` | — | Referenced but missing; add `assets/bluelogo.png` and update refs (or generate `assets/logo.png`) |

## 5. Design System (merged styles.css)

- **Tokens:** keep both repos' identical `:root` tokens; extend with concrete section accents — `--ssn: #1a2f4c` (navy, matches brand), `--privati: #c29b57` (gold, matches brand), `--colleghi: #2e7d6b` (teal, distinct from brand pair). Accents used for card icons/borders/headers (decorative + large text), never for small body text (contrast).
- **Merge strategy:** diff the two ~1200-line `styles.css` files; take union, dedupe repeated rules (e.g., `.flow-option-btn` dark-mode block duplicated in dott), keep per-page rules used by >1 page in shared file.
- **Extract shared component CSS** currently copy-pasted as per-page inline styles: `.btn-back`, topbar, accordion, FAQ pills/filters, hours-table, quick-actions bar, `.flow-*` flowchart, `.doctolib-cta`, contact rows, badges (`badge-open`/`badge-closed`).
- **Keep inline:** genuinely page-specific CSS (A3 posters, RUAP, gestoreturni, standalone Tailwind pages, xsegretarie).
- **Dark mode:** consolidate on `body.dark-mode` (both repos already use it). Fix duplicates. `html.dark` variant remains only inside RUAP (untouched).
- **Print styles:** add `@media print` for key patient pages (FAQ, guides) where trivial.
- **Large-text accessibility mode:** merge dott's `large-text` implementation into shared app.js (currently missing from base repo).

### WCAG 2.1 AA requirements (implementation checklist)
- Color contrast ≥ 4.5:1 for normal text, 3:1 for large text. Gold `#c29b57` on cream fails for small text → introduce darker gold text token (e.g., `#8a6d3b`-range) and verify dark-mode variants.
- Visible `:focus-visible` styles (2px outline) on all interactive elements.
- Skip link to `#main-content` on every page.
- Semantic landmarks: `header role="banner"`, `nav aria-label`, `main role="main"`, `footer role="contentinfo"`.
- Accordions: `aria-expanded`, `aria-controls`, keyboard operable.
- Modals (welcome/doctolib): `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap + return focus on close.
- Heading hierarchy: single `h1` per page, no skipped levels.
- `alt` text on all images; `aria-hidden` on decorative icons.
- Form controls (FAQ search): label + placeholder i18n.
- `prefers-reduced-motion: reduce` honored (already present).
- Touch targets ≥ 44px on mobile CTAs.
- `lang` attribute matches content language per page.

## 6. i18n Architecture (merged app.js)

- Single `translations` object: `it` + `en` blocks. Base repo's EN block is the seed; **add EN entries for all content moved in from dott** (landing, dashboards, private pages, merged FAQ).
- `setLanguage()` mechanism preserved (`data-i18n`, `data-i18n-placeholder`, `data-i18n-aria-label`, `localStorage.preferredLanguage`).
- **Language switch:** ITA/ENG toggle + Google Translate widget on `ssn/*` and `privati/*` pages (patient-facing). **Colleghi pages: Italian-only** — no ITA/ENG toggle and no Google Translate widget (internal audience). Dark mode remains available everywhere.
- Multilingual pages (`bengalese.html`, `urdu.html`) and quadrilingual posters keep their hardcoded translations — untouched.
- New pages authored with `data-i18n` keys from the start; both languages in sync. Verify with `grep` that no `data-i18n` key lacks an EN entry.

## 7. config.js (merged)

```js
CONFIG = {
  SCHEDULE: { ... }            // CLINIC hours (badge): Mon/Wed/Fri 16–19, Tue/Thu 10–13 (from dott)
  SECRETARY_HOURS: { ... }     // Lun–Ven 09:30–12:30 + 16:00–19:00 (from base repo) — hours table
  ASSENZE: [ ... ]             // from dott (relocation banner) + future entries
  DOCTOLIB: { booking, patientRequest, profile }   // from base repo
  GOOGLE_CAL: { iframe, visit-type URLs }          // from dott visite-private (private booking); ferie.html's legacy SSN calendar links are retired with that page — SSN booking is Doctolib-only
}
```
**Note:** the two repos carried different schedules — base repo `SCHEDULE` is *secretary* hours (Mon–Fri 09:30–12:30 + 16:00–19:00), dott `SCHEDULE` is *clinic* hours (Mon/Wed/Fri 16–19, Tue/Thu 10–13). Both are kept as distinct keys and each renders in its own context: open/closed badge and hours tables use the **clinic** schedule; the secretary hours table on the SSN dashboard uses `SECRETARY_HOURS`. The badge label reads "Segreteria" only where secretary hours are shown — on the new unified pages the badge reflects clinic availability.

Absence banner logic (`getActiveAbsence()`) merged; both repos' banner/modal implementations unified (dott's config-driven banner is the canonical one).

## 8. Infra

- **sw.js:** `urlsToCache` updated to new structure (root, ssn/index, ssn/faq, privati/index, colleghi/index, offline, styles/app/config, assets). Cache version auto-bumped by existing PostToolUse hook — never edit manually.
- **manifest.json:** fix icons → `assets/bluelogo.png` (192/512, `any maskable`); keep name/theme.
- **404.html:** new, styled consistently, with emergency contacts + link to landing.
- **sitemap.xml:** rebuild with all new URLs (exclude xsegretarie, RUAP, offline, posters optionally).
- **robots.txt:** keep allow-all + disallow `/offline.html`, `/cloudflare/`, private paths (`/colleghi/xsegretarie.html`), `/colleghi/RUAP/`.
- **cloudflare/worker.js:** add `calendar.google.com` to `frame-src` (private booking iframe); keep HSTS/security headers. Verify CSP still allows `cdnjs.cloudflare.com`, fonts, `translate.google.com` (script-src), `calendar.google.com` (frame-src).
- **.claude/:** update `new-page` skill template to new structure (relative `../` asset paths, data-i18n boilerplate, section header/footer includes). `bump-sw.js` hook unchanged.

## 9. Landing Page (index.html)

Three-choice gateway, reviving the old dott triage design (`.triage-grid` remnants) modernized:
- **Header:** logo, practice name, ITA/ENG toggle, dark mode, Google Translate.
- **Emergency strip:** 112 / 116 117 (from config).
- **Hero:** short welcome, open/closed badge, absence banner (config-driven).
- **Three cards** (equally prominent, large targets, icons, distinct accent per section, keyboard-focusable, responsive 3→1 column):
  1. 🏥 **Pazienti SSN** — "Sei assistito dal Dott. Savianu" → Doctolib booking, FAQ, esenzioni, impegnative → `ssn/`
  2. 💼 **Pazienti Privati** — "Consulenze, certificati INPS, Legge 104" → `privati/`
  3. 🤝 **Colleghi** — "Area riservata professionisti" → `colleghi/`
- **Footer:** hours, contacts, privacy link, auto year.
- **SEO:** JSON-LD (Physician + WebSite), canonical `https://savianu.it/`, OG/Twitter, geo meta (keep).
- Each section dashboard (`ssn/index.html` etc.) carries the same header/footer with a breadcrumb back to landing and cross-links between sections.

## 10. Redirect Map (deliverable for user's Cloudflare config)

All old domains → `https://savianu.it/...` (301):

| Old URL | New URL |
|---|---|
| `dottemanuelsavianu.it/` | `/` |
| `dottemanuelsavianu.it/visite-private.html` | `/privati/` |
| `dottemanuelsavianu.it/colleghi.html` | `/colleghi/` |
| `dottemanuelsavianu.it/faq.html` | `/ssn/faq.html` |
| `dottemanuelsavianu.it/esenzioni.html` | `/ssn/esenzioni.html` |
| `dottemanuelsavianu.it/impegnative.html` | `/ssn/impegnative.html` |
| `dottemanuelsavianu.it/cert-malattia.html` | `/ssn/cert-malattia.html` |
| `dottemanuelsavianu.it/malattia.html` | `/colleghi/malattia.html` |
| `dottemanuelsavianu.it/guida_interattiva_mmg.html` | `/colleghi/guida-interattiva-mmg.html` |
| `dottemanuelsavianu.it/lo_scudo_del_medico.html` | `/colleghi/lo-scudo-del-medico.html` |
| `dottemanuelsavianu.it/calcolatore-ferie.html` | `/colleghi/calcolatore-ferie.html` |
| `dottemanuelsavianu.it/calcolatoreferiegemini.html` | `/colleghi/calcolatore-ferie-gemini.html` |
| `dottemanuelsavianu.it/certificato-invalidita-civile.html` | `/privati/certificato-invalidita-civile.html` |
| `dottemanuelsavianu.it/faq-riforma.html` | `/privati/faq-riforma.html` |
| `dottemanuelsavianu.it/protocollo-certificati-inps.html` | `/colleghi/protocollo-certificati-inps.html` |
| `dottemanuelsavianu.it/rsa.html` | `/colleghi/rsa.html` |
| `dottemanuelsavianu.it/installazione.html` | `/colleghi/installazione.html` |
| `dottemanuelsavianu.it/xsegretarie.html` | `/colleghi/xsegretarie.html` |
| `dottemanuelsavianu.it/ferie.html` | `/ssn/` |
| `dottemanuelsavianu.it/privacy.html` | `/privacy.html` |
| `dottemanuelsavianu.it/offline.html` | `/offline.html` |
| `dottemanuelsavianu.it/RUAP/` | `/colleghi/RUAP/` |
| `dottemanuelsavianu.it/gestoreturni/` | `/colleghi/gestoreturni/` |
| `emanuelsavianu.github.io/faq.html` | `/ssn/faq.html` |
| `emanuelsavianu.github.io/malattia.html` | `/ssn/malattia.html` |
| `emanuelsavianu.github.io/bengalese.html` | `/ssn/bengalese.html` |
| `emanuelsavianu.github.io/urdu.html` | `/ssn/urdu.html` |
| `emanuelsavianu.github.io/salutementale.html` | `/ssn/salutementale.html` |
| `emanuelsavianu.github.io/vivisano.html` | `/ssn/vivisano.html` |

## 11. Execution Phases

1. **Scaffold:** create `ssn/`, `privati/`, `colleghi/`, `assets/`; `git mv` base-repo pages; copy dott pages; wire relative paths.
2. **Core merge:** `config.js` → `app.js` (i18n union, flowchart, badges, large-text, components, visitMeta/selectVisitType) → `styles.css` (dedupe + extraction + WCAG tokens).
3. **Landing + 3 dashboards:** build `index.html`, `ssn/index.html`, `privati/index.html`, `colleghi/index.html` (designer-led).
4. **Content migration:** merge FAQs; migrate remaining pages; rewrite every internal link relative; verify with link scan.
5. **Multilingual + posters:** move under `ssn/`.
6. **Sub-apps:** move `RUAP/`, `gestoreturni/` under `colleghi/`; fix links.
7. **Infra:** sw.js cache list, manifest icons, 404.html, sitemap, robots, Cloudflare worker CSP.
8. **WCAG + QA:** contrast audit, focus/keyboard, aria, dark mode, i18n toggle per page, responsive check (mobile emulation), broken-link scan, local browser test of landing → all three paths.
9. **Docs:** redirect map (this spec §10) + README update.

## 12. Risks & Notes

- FAQ merge is the heaviest content task: union of two FAQ sets (~20 Q&As × 2 languages) with no content loss.
- Dott pages carry heavy per-page inline CSS (627 L on visite-private); selective extraction only, avoid gold-plating.
- Two `malattia.html` files are genuinely different content — keep same name in separate folders (`ssn/` vs `colleghi/`).
- `index.html#facsimili` backlinks from dott pages must be remapped to `../colleghi/index.html#facsimili`.
- Standalone pages (Tailwind/Chart.js/React calculators, posters) stay self-contained — no forced restyle.
- Base repo references `logo.png`/`bluelogo.png` that don't exist locally; fixed by copying `bluelogo.png` from dott repo into `assets/` and updating manifest/OG/JSON-LD refs.
- `sw.js` version is auto-bumped by the PostToolUse hook on every edit — expected churn during implementation, do not edit manually.
- Git history: `git mv` in base repo preserves provenance; dott repo retains its own history.
