#!/usr/bin/env python3
"""bump-module-token.py <nuovo-token> [dir-RUAP]

Porta TUTTE le URL dei moduli della RUAP al nuovo token di cache. Serve perché
Cloudflare/GitHub Pages servono le URL con `?v=` come `immutable` (1 anno): se il
token non cambia, i client che hanno già la pagina NON scaricano il codice nuovo.
E peggio: se solo l'entry point viene bumpato, i moduli figli restano vecchi e il
grafo ES non si collega più (import di un export inesistente) → app bianca.

Tocca:
  * index.html            -> js/events.js?v=...
  * js/events.js          -> import di ./engine.js?v=... (unico import versionato)
  * ogni js/*.js          -> tutti gli import relativi `from './x.js'` e `from './x.js?v=…'`
                            diventano `'./x.js?v=<token>'`
Esclude di proposito index.html/config.js (il token del DATA seed lo scrive
merge-month.py a ogni pubblicazione).

Uso: python3 bump-module-token.py 20261015c ~/Projects/savianu.it/colleghi/RUAP
Poi: node --check js/*.js e verifica live con curl del file sotto il nuovo token.
"""
import os, re, sys, glob

if len(sys.argv) < 2:
    sys.exit(__doc__)
token = sys.argv[1]
root = os.path.expanduser(sys.argv[2] if len(sys.argv) > 2
                          else '~/Projects/savianu.it/colleghi/RUAP')
js_dir = os.path.join(root, 'js')
if not os.path.isdir(js_dir):
    sys.exit(f"REFUSING: {js_dir} non esiste")

mod_re = re.compile(r"""(from\s+['"])(\./[^'"]+?\.js)(?:\?v=[^'"]*)?(['"])""")
changed = []
for path in sorted(glob.glob(os.path.join(js_dir, '*.js'))):
    txt = open(path, encoding='utf-8').read()
    new, n = mod_re.subn(lambda m: f"{m.group(1)}{m.group(2)}?v={token}{m.group(3)}", txt)
    if n and new != txt:
        open(path, 'w', encoding='utf-8').write(new)
        changed.append((os.path.basename(path), n))

idx = os.path.join(root, 'index.html')
if os.path.exists(idx):
    html = open(idx, encoding='utf-8').read()
    new_html, n = re.subn(r"src=([\"'])js/events\.js(?:\?v=[^\"']*)?\1",
                          "src=\\1js/events.js?v=" + token + "\\1", html, count=1)
    if n and new_html != html:
        open(idx, 'w', encoding='utf-8').write(new_html)
        changed.append(('index.html', n))

print(f"token {token} applicato:")
for name, n in changed:
    print(f"   {name}: {n} import/script")
if not changed:
    print("   (nessuna modifica: token già applicato?)")
# controllo finale: nessun import relativo senza token
left = []
for path in sorted(glob.glob(os.path.join(js_dir, '*.js'))):
    for m in re.finditer(mod_re.pattern, open(path, encoding='utf-8').read()):
        if f'?v={token}' not in m.group(0):
            left.append((os.path.basename(path), m.group(0)))
print("import senza token residui:", left if left else "nessuno")
