# DESIGN.md — Studio Medico Ippocrate design tokens

Single source of truth for savianu.it. Mirrors SOUL.md §2.3 brand identity.
Apply these tokens to every new page/component; do not hardcode hex values in HTML.

## Colors

```yaml
colors:
  primary:            { value: "#1A2F4C", usage: "brand navy — headers, primary buttons, hero" }
  on-primary:         { value: "#FFFFFF", usage: "text on primary" }
  primary-dark:       { value: "#0F1A2A", usage: "gradients, dark-mode contrast anchor" }
  primary-light:      { value: "#285078", usage: "hover states, dark-mode surfaces" }
  accent:             { value: "#C29B57", usage: "gold — borders, icons, CTA accents. NEVER small text on light bg" }
  accent-strong:      { value: "#7A5C2E", usage: "gold for TEXT on cream/white (AA-compliant)" }
  neutral-bg:         { value: "#F3EFE6", usage: "cream page background" }
  neutral-bg-alt:     { value: "#E8E2D2", usage: "alternating sections, wells" }
  surface:            { value: "#FFFFFF", usage: "cards, modals" }
  text:               { value: "#1A2F4C", usage: "body headings on light" }
  text-muted:         { value: "#4A5568", usage: "secondary body text" }
  border:             { value: "#D1C7B3", usage: "card/table borders" }
  danger:             { value: "#B91C1C", usage: "errors, emergency alerts" }
  success:            { value: "#166534", usage: "positive status" }

dark_mode:
  bg:                 { value: "#0A1628" }
  bg_alt:             { value: "#11223A" }
  surface:            { value: "#162438" }
  accent:             { value: "#E0B976", note: "lightened gold — passes AA on navy" }
```

### WCAG rules (linted)

Misure calcolate (WCAG 2.x, luminanza relativa), non stimate:

| Coppia | Rapporto | Esito |
|---|---|---|
| Gold `#C29B57` su crema `#F3EFE6` | **2.25:1** | FAIL come testo → usa `--accent-text` |
| Gold su bianco `#FFFFFF` | 2.59:1 | FAIL come testo |
| Gold su crema-alt `#E8E2D2` | 2.00:1 | FAIL come testo |
| Gold su navy `#1A2F4C` | 5.22:1 | OK su fondo scuro |
| `--accent-text` `#7A5C2E` su crema | 5.39:1 | OK testo |
| `#2E7D6B` (verde sezione colleghi) su crema | **4.29:1** | **FAIL come testo normale**; usalo per bordi/icone o alleggeriscilo |
| `#2E7D6B` su bianco | 4.93:1 | OK testo |
| Gold chiaro `#E0B976` su navy dark `#0A1628` | 9.82:1 | OK |

- Gold `#C29B57` su crema = **2.25:1 → FAIL**. Per il testo usa sempre `--accent-text` (#7A5C2E): 5.39:1 su crema, 6.18:1 su bianco.
- Gold come *decorativo* (bordi, icone, stati attivi) è accettabile.
- Dark mode usa il gold schiarito `#E0B976` ovunque compaia l'oro.
- **`#2E7D6B` non va mai usato come testo a dimensione normale su crema** (4.29:1, sotto AA 4.5): solo bordi, icone o testo grande.
- Nessun hex nuovo fuori dai blocchi token: il gate `tools/check-tokens.mjs` (dentro `npm test`) blocca gli incrementi rispetto a `tools/token-baseline.json`.

## Typography

```yaml
typography:
  display:
    family: "Cormorant Garamond"
    fallback: serif
    usage: "serif display headings only (--font-serif)"
  body:
    family: "Montserrat"
    weights: [400, 700]
    fallback: sans-serif
    usage: "all UI and body text (--font-sans)"
  scale:
    xs: 0.75rem
    sm: 0.85rem
    base: 0.95rem
    md: 1rem
    lg: 1.1rem
    xl: 1.25rem
    xxl: 1.5rem
```

Google Fonts link (canonical):
`https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap`

## Spacing & shape

```yaml
spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48]  # px --space-N
radius:  { lg: 12px, md: 8px }
shadow-md: "0 8px 24px rgba(26, 47, 76, 0.12)"
z_index: { banner: 999, nav: 1000, modal: 2000, toast: 99999 }
```

## Section accents

```yaml
section_accents:
  ssn:      "#1A2F4C"
  privati:  "#C29B57"
  colleghi: "#2E7D6B"
  international: "#285078"   # primary-light — reuses existing token, no new hex
```

## Component rules

- **Triage cards (landing):** Pazienti = `--primary` gradient card (primary path);
  Privati/Colleghi = ghost cards (transparent, border-only). Do not equalize.
- **Operate pages** (ssn/, privati/, colleghi/ dashboards): primary action isolated
  above the fold; secondary actions de-emphasized; guides flat with border (no hover-lift).
- **Elevation:** reserved for triage/hero; lists and FAQ stay flat.
- **Mobile:** quick-actions-bar owns FAQ below 768px — `.floating-faq` is hidden there.

## Assets

- Logo: `/assets/bluelogo.png` (navy contexts), `/assets/bronzelogo.png` (gold contexts)
- Motif: Asclepius staff × Arezzo Chimera fusion
- Every document dual-use print + web.
