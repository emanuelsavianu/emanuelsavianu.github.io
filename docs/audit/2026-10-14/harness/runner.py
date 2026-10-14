# Audit runner for savianu.it — used inside browser_exec calls.
# Usage: exec(open('/home/es/.hermes/cache/scratch/sav-audit/runner.py').read()); run_batch([...])
import json as _json, time as _time, os as _os

OUT = '/home/es/.hermes/cache/scratch/sav-verify/results.jsonl'
PROBE_SRC = open('/home/es/.hermes/cache/scratch/sav-verify/probe.js').read()
AXE_SRC = open('/home/es/.hermes/cache/scratch/sav-verify/axe.min.js').read()

AXE_ARGS = ("{resultTypes:['violations','incomplete'],"
            "runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}")
AXE_COLLECT = ("window.__axeRes='PENDING'; axe.run(document," + AXE_ARGS + ").then("
               "r=>{window.__axeRes=JSON.stringify({v:r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,"
               "t:v.nodes.slice(0,4).map(n=>n.target.join(' ')),h:v.help})),"
               "i:r.incomplete.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,t:v.nodes.slice(0,2).map(n=>n.target.join(' '))}))})})"
               ".catch(e=>{window.__axeRes='ERR '+e}); 'started'")

SET_THEME = ("(()=>{const want='%s';const isDark=document.documentElement.classList.contains('dark-mode')"
             "||document.body.classList.contains('dark-mode');"
             "if((want==='dark')!==isDark && typeof toggleDarkMode==='function'){try{toggleDarkMode()}catch(e){}}"
             "const w=want==='dark';"
             "document.documentElement.classList.toggle('dark-mode',w);document.body.classList.toggle('dark-mode',w);"
             "try{localStorage.setItem('savianu-theme',want)}catch(e){}"
             "return [document.documentElement.classList.contains('dark-mode'),document.body.classList.contains('dark-mode')]})()")

PERF = ("(()=>{const n=performance.getEntriesByType('navigation')[0]||{};"
        "const res=performance.getEntriesByType('resource');"
        "return JSON.stringify({dcl:Math.round(n.domContentLoadedEventEnd||0),load:Math.round(n.loadEventEnd||0),"
        "ttfb:Math.round((n.responseStart||0)-(n.startTime||0)),nres:res.length,"
        "bytes:res.reduce((a,r)=>a+(r.encodedBodySize||0),0),vis:document.visibilityState,"
        "h:document.documentElement.scrollHeight})})()")


def _visible():
    try:
        cdp('Page.bringToFront')
    except Exception:
        pass
    for _ in range(10):
        try:
            if js("document.visibilityState") == 'visible':
                return True
        except Exception:
            pass
        _time.sleep(0.2)
    return False


def _scroll_sweep():
    """Trigger IntersectionObserver reveals / lazy content, then return to top."""
    try:
        h = js("document.documentElement.scrollHeight") or 1000
        vh = js("innerHeight") or 800
        y = 0
        while y < h:
            js("window.scrollTo(0,%d); 1" % y)
            _time.sleep(0.28)
            y += int(vh * 0.9)
            h = max(h, (js("document.documentElement.scrollHeight") or h))
        js("window.scrollTo(0,0); 1")
        _time.sleep(0.5)
    except Exception as e:
        print('   scroll sweep warn:', str(e)[:80])


def inject_axe(chunk=20000):
    js("window.__axeChunks=[]; 1")
    for i in range(0, len(AXE_SRC), chunk):
        js("window.__axeChunks.push(%s); 1" % _json.dumps(AXE_SRC[i:i + chunk]))
    return js("(0,eval)(window.__axeChunks.join('')); window.__axeChunks=null; (typeof axe!=='undefined'?axe.version:'none')")


def _axe_result():
    try:
        inject_axe()
        js(AXE_COLLECT)
        for _ in range(40):
            v = js("window.__axeRes")
            if v and v != 'PENDING':
                return _json.loads(v) if v.startswith('{') else {'error': str(v)[:200]}
            _time.sleep(0.5)
        return {'error': 'axe poll timeout'}
    except Exception as e:
        return {'error': str(e)[:200]}


def run_batch(pages, width=390, height=844, dsf=2, mobile=True, modes=('light', 'dark'), do_axe=True,
              label='', settle=1.8, sweep=True):
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=dsf, mobile=mobile)
    n = 0
    with open(OUT, 'a') as fh:
        for url in pages:
            for mode in modes:
                rec = {'url': url, 'mode': mode, 'w': width, 'label': label}
                try:
                    goto_url(url + ('&' if '?' in url else '?') + 'cb=' + str(int(_time.time() * 1000)))
                    wait_for_load()
                    _time.sleep(settle)
                    rec['visible'] = _visible()
                    if sweep:
                        _scroll_sweep()
                    rec['themeClasses'] = js(SET_THEME % mode)
                    _time.sleep(0.4)
                    rec['perf'] = _json.loads(js(PERF))
                    rec['probe'] = _json.loads(js(PROBE_SRC))
                    if do_axe:
                        rec['axe'] = _axe_result()
                    fh.write(_json.dumps(rec, ensure_ascii=False) + '\n')
                    fh.flush()
                    p = rec['probe']
                    n += 1
                    print('%-44s %-5s vis=%d err=%-2d contrast=%-2d unm=%-2d taps=%-2d stuck=%-2d axe=%s' % (
                        url.replace('https://savianu.it', '') or '/', mode, int(bool(rec['visible'])), len(p['errors']),
                        p['counts']['contrast'], p['counts']['unmeasurable'], p['counts']['taps'],
                        p['counts'].get('stuck', 0), len(rec.get('axe', {}).get('v', []))))
                except Exception as e:
                    rec['error'] = str(e)[:300]
                    fh.write(_json.dumps(rec, ensure_ascii=False) + '\n')
                    fh.flush()
                    print('FAIL', url, mode, str(e)[:140])
    print('records written:', n, '->', OUT)
