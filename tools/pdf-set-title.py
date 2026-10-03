#!/usr/bin/env python3
"""Imposta /Title e /Subject nei PDF di modulistica con un aggiornamento
INCREMENTALE della sezione xref: i byte originali restano identici
(verificato con new_file.startswith(old_file)), cambia solo il dizionario /Info.

Uso (dalla radice del repo):
    python3 tools/pdf-set-title.py            # dry-run: mostra cosa farebbe
    python3 tools/pdf-set-title.py --apply    # applica a tutti i PDF in TITLES
    python3 tools/pdf-set-title.py --apply file.pdf

Aggiungere un PDF = aggiungere una voce a TITLES. Dopo l'applicazione:
`npm test` (la guardia PII resta valida: i metadati non entrano in pdftotext).
"""
import pathlib
import re
import struct
import subprocess
import sys
import zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MOD = ROOT / 'colleghi' / 'modulistica'
SUBJECT = ("Modulistica e facsimili per MMG e PLS — Studio Medico Ippocrate, Arezzo "
           "(contenuto del modulo invariato)")
KEYWORDS = "modulistica MMG, medicina generale, Toscana, USL Toscana Sud Est"

TITLES = {
    # facsimili dei certificati
    'facsimile-anamnestico-patente-guida.pdf': "Facsimile — Certificato anamnestico per patente di guida",
    'facsimile-anamnestico-porto-armi.pdf': "Facsimile — Certificato anamnestico per porto d'armi",
    'facsimile-capacita-intendere-volere.pdf': "Facsimile — Certificazione di capacità di intendere e di volere",
    'facsimile-constatazione-decesso.pdf': "Facsimile — Constatazione di decesso",
    'facsimile-attestato-trasporto-salma.pdf': "Facsimile — Attestato medico per il trasporto di salma",
    'facsimile-consenso-vaccinazione.pdf': "Facsimile — Modulo di consenso informato alla vaccinazione",
    'facsimile-certificato-malattia-inps.pdf': "Facsimile — Certificato di malattia INPS",
    'facsimile-inail-infortunio-mod1ss.pdf': "Facsimile INAIL — Certificazione medica di infortunio sul lavoro (Mod. 1 SS)",
    'facsimile-inail-malattia-professionale-mod5ssbis.pdf': "Facsimile INAIL — Certificazione medica di malattia professionale (Mod. 5 SS bis)",
    'certificati-gratuiti-a-pagamento-iva-omceo-arezzo.pdf': "Nota OMCeO Arezzo — Certificati gratuiti, a pagamento e soggetti a IVA (prot. 1012/2014)",
    # modulistica aziendale e regionale
    'modulo-domanda-scelta-mmg-pls-deroga-territoriale.pdf': "Modulo — Domanda di scelta del MMG/PLS in deroga territoriale",
    'modulo-comunicazione-sostituzione-mmg-pls.pdf': "Modulo — Comunicazione di sostituzione di MMG o PLS",
    'cartella-clinico-assistenziale-territoriale-adi-adp.pdf': "Cartella clinico-assistenziale territoriale — ADI/ADP (USL Toscana Sud Est)",
    'modulo-picc-team-accessi-vascolari.pdf': "Modulo PICC team — Accessi vascolari: scheda di valutazione, consenso e informativa",
    'modulo-attivazione-afa.pdf': "Modulo di attivazione AFA — Attività Fisica Adattata (Allegato B)",
    'modulo-esenzione-diabete.pdf': "Modulo di certificazione per esenzione ticket — Diabete",
    'modulo-esenzione-ipertensione.pdf': "Modulo di certificazione per esenzione ticket — Ipertensione",
    'modulo-rinnovo-esenzione-048.pdf': "Modulo di rinnovo dell'esenzione 048 — Patologia oncologica",
    'modulo-prescrizione-incontinenza-urinaria.pdf': "Modulo di prescrizione dispositivi medici — Incontinenza urinaria stabilizzata",
    'modulo-prescrizione-autocontrollo-glicemico.pdf': "Modulo di prescrizione dispositivi medici — Autocontrollo glicemico (Allegato B)",
    'modulo-richiesta-fornitura-protesi-ausili.pdf': "Modulo di richiesta fornitura o riparazione di protesi e ausili (Mod. 0583)",
    # documenti pubblicati in precedenza nella stessa cartella
    'PAI.pdf': "Modulo PAI — Piano Assistenziale Integrato (ADI · ADP · ADI infermieristica · Cure intermedie)",
    'STU-scheda-terapeutica-unica.pdf': "Modulo STU — Scheda Terapeutica Unica (Mod. 031-std domiciliare)",
    'valutazione-iniziale-inquadramento-clinico.pdf': "Modulo 010 rev. 1 — Valutazione iniziale: inquadramento clinico del MMG",
    'accessi-vascolari-scheda-pre-procedura.pdf': "Accessi vascolari — Scheda di valutazione pre-procedura (Mod. 0607 rev. 002)",
    'accessi-vascolari-consenso-informato.pdf': "Accessi vascolari — Modulo di consenso informato per impianto di dispositivo venoso (PAISCI 011)",
    'pdta-disturbi-cognitivi-demenze.pdf': "PDTA — Disturbi cognitivi e demenze (PDA-PCUR-003)",
}

WS = b'\x00\t\n\x0c\r '


def skip_ws(data, i):
    while i < len(data) and data[i:i+1] in [b'\x00', b'\t', b'\n', b'\x0c', b'\r', b' ']:
        i += 1
    return i


def read_dict(data, start):
    assert data[start:start+2] == b'<<'
    i, depth = start + 2, 1
    while i < len(data) and depth:
        c = data[i:i+1]
        if c == b'(':
            j, nest = i + 1, 1
            while j < len(data) and nest:
                if data[j:j+1] == b'\\':
                    j += 2
                    continue
                if data[j:j+1] == b'(':
                    nest += 1
                elif data[j:j+1] == b')':
                    nest -= 1
                j += 1
            i = j
            continue
        if c == b'<':
            if data[i:i+2] == b'<<':
                depth += 1
                i += 2
                continue
            i = data.find(b'>', i) + 1
            continue
        if c == b'>' and data[i:i+2] == b'>>':
            depth -= 1
            i += 2
            continue
        i += 1
    return data[start:i], i


def last_trailer(data):
    hits = list(re.finditer(rb'startxref\s+(\d+)', data))
    if not hits:
        return None
    off = int(hits[-1].group(1))
    j = skip_ws(data, off)
    if data[j:j+4] == b'xref':
        tpos = data.find(b'trailer', j)
        dstart = data.index(b'<<', tpos)
        d, _ = read_dict(data, dstart)
        return {'kind': 'table', 'startxref': off, 'dict': d}
    m = re.match(rb'\d+\s+\d+\s+obj', data[j:j+40])
    if m:
        dstart = data.index(b'<<', j)
        d, _ = read_dict(data, dstart)
        return {'kind': 'stream', 'startxref': off, 'dict': d}
    return {'kind': 'unknown', 'startxref': off, 'dict': b''}


def dict_entries(d):
    """[(key, value)] di primo livello di un dizionario PDF (bytes), senza regex fragili."""
    i, end, out, depth = 2, len(d) - 2, [], 0
    i = skip_ws(d, i)
    while i < end:
        c = d[i:i+1]
        if c == b'/' and depth == 0:
            m = re.match(rb'/([A-Za-z0-9#]+)', d[i:])
            if not m:
                i += 1
                continue
            key = b'/' + m.group(1)
            j = skip_ws(d, i + m.end())
            k = j
            while k < end:
                ch = d[k:k+1]
                if ch == b'(':
                    nest, k2 = 1, k + 1
                    while k2 < end and nest:
                        if d[k2:k+1] == b'\\':
                            k2 += 2
                            continue
                        if d[k2:k+1] == b'(':
                            nest += 1
                        elif d[k2:k+1] == b')':
                            nest -= 1
                        k2 += 1
                    k = k2
                    continue
                if ch == b'<' and d[k:k+2] == b'<<':
                    depth += 1
                    k += 2
                    continue
                if ch == b'<' :
                    k = d.find(b'>', k) + 1
                    continue
                if ch == b'>' and d[k:k+2] == b'>>':
                    if depth == 0:
                        break
                    depth -= 1
                    k += 2
                    continue
                if ch == b'[':
                    depth += 1
                    k += 1
                    continue
                if ch == b']':
                    depth -= 1
                    k += 1
                    continue
                if ch == b'/' and depth == 0:
                    break
                k += 1
            out.append((key, d[j:k].strip()))
            i = k
            continue
        i += 1
    return out


def kw(d, key):
    for k, v in dict_entries(d):
        if k == key:
            return v
    return None


def pdf_string(text):
    """Stringa PDF come hex UTF-16BE con BOM (sicuro per accenti e apostrofi)."""
    return b'<' + (b'\xfe\xff' + text.encode('utf-16-be')).hex().upper().encode() + b'>'


def pdfinfo(path):
    out = subprocess.run(['pdfinfo', str(path)], capture_output=True, text=True).stdout
    meta = {}
    for line in out.splitlines():
        for k in ('Title', 'Author', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'Subject', 'Keywords'):
            if line.startswith(k + ':'):
                meta[k] = line.split(':', 1)[1].strip()
    pages = next((l.split(':', 1)[1].strip() for l in out.splitlines() if l.startswith('Pages:')), None)
    meta['_pages'] = pages
    return meta


def build_info(meta, title):
    parts = [b'<<']
    parts.append(b'/Title ' + pdf_string(title))
    parts.append(b'/Subject ' + pdf_string(SUBJECT))
    parts.append(b'/Keywords ' + pdf_string(KEYWORDS))
    for k in ('Author', 'Creator', 'Producer', 'CreationDate', 'ModDate'):
        if meta.get(k):
            parts.append(('/' + k).encode() + b' ' + pdf_string(meta[k]))
    parts.append(b'>>')
    return b'\n'.join(parts)


def update(path, title):
    data = path.read_bytes()
    t = last_trailer(data)
    if t is None or t['kind'] == 'unknown':
        return False, 'sezione xref non riconosciuta'
    d = t['dict']
    root, size, idv, info_old = kw(d, b'/Root'), kw(d, b'/Size'), kw(d, b'/ID'), kw(d, b'/Info')
    if not root or not size:
        return False, 'trailer senza /Root o /Size'
    size = int(size)
    info_num = int(re.match(rb'(\d+)', info_old).group(1)) if info_old else size
    new_size = max(size, info_num + 1)
    meta = pdfinfo(path)
    info_bytes = build_info(meta, title)

    out = bytearray(data)
    if not out.endswith(b'\n'):
        out += b'\n'
    info_off = len(out)
    out += f'{info_num} 0 obj\n'.encode() + info_bytes + b'\nendobj\n'

    if t['kind'] == 'table':
        xref_off = len(out)
        out += b'xref\n' + f'{info_num} 1\n'.encode() + f'{info_off:010d} 00000 n \n'.encode()
        trailer = [b'<<', b'/Size ' + str(new_size).encode(), b'/Root ' + root,
                   b'/Info ' + str(info_num).encode() + b' 0 R']
        if idv:
            trailer.append(b'/ID ' + idv)
        trailer.append(b'/Prev ' + str(t['startxref']).encode())
        trailer.append(b'>>')
        out += b'trailer\n' + b'\n'.join(trailer) + b'\n'
    else:
        xref_off = len(out)
        xref_num = new_size
        new_size = max(new_size, xref_num + 1)
        entries = sorted([(info_num, 1, info_off, 0), (xref_num, 1, xref_off, 0)])
        payload = b''.join(struct.pack('>BIH', typ, off, gen) for _, typ, off, gen in entries)
        index = ' '.join(f'{n} 1' for n, _, _, _ in entries)
        head = (f'{xref_num} 0 obj\n<< /Type /XRef /Size {new_size} /Index [ {index} ] /W [1 4 2] '
                f'/Root {root.decode()} /Info {info_num} 0 R '
                + (f'/ID {idv.decode()} ' if idv else '')
                + f'/Prev {t["startxref"]} /Length {len(payload)} >>\nstream\n')
        out += head.encode() + payload + b'\nendstream\nendobj\n'

    out += b'startxref\n' + str(xref_off).encode() + b'\n%%EOF\n'

    # ── verifiche prima di scrivere ──
    assert bytes(out).startswith(data), 'il prefisso originale è cambiato!'
    return True, bytes(out)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    apply = '--apply' in sys.argv
    only = args[0] if args else None
    ok = bad = 0
    for f, title in sorted(TITLES.items()):
        if only and f != only:
            continue
        p = MOD / f
        if not p.exists():
            print(f'SKIP {f}: assente'); bad += 1; continue
        before = pdfinfo(p)
        if before.get('Title') == title and before.get('Subject') == SUBJECT:
            print(f'OK   {f}: già a posto'); ok += 1; continue
        res = update(p, title)
        if not res[0]:
            print(f'FAIL {f}: {res[1]}'); bad += 1; continue
        new_bytes = res[1]
        if apply:
            orig_len = len(p.read_bytes())
            tmp = p.with_suffix('.pdf.new')
            tmp.write_bytes(new_bytes)
            after = pdfinfo(tmp)
            assert after['Title'] == title, (after['Title'], title)
            assert after['_pages'] == before['_pages'], (after['_pages'], before['_pages'])
            assert tmp.read_bytes().startswith(p.read_bytes())
            tmp.replace(p)
            print(f'WROTE {f} (+{len(new_bytes)-orig_len} byte)\n      Title: {title}')
        else:
            print(f'DRY  {f}: +{len(new_bytes)-len(p.read_bytes())} byte -> {title}')
        ok += 1
    print(f'\n{ok} ok, {bad} problemi' + ('' if apply else '  (dry-run: usa --apply)'))


main()
