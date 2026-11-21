// ====================================================
// publish.js — pubblicazione del mese sul sito (coda KV + drain Hermes)
// ====================================================
// Il pulsante è visibile solo se c'è il token (link `#editore=<token>` una volta).
// Il preflight è locale; il gate vero lo rifà `publish-queue.py` con check-rules.
import { state } from './state.js?v=20261121c';
import { el, toast, escapeHtml } from './core-utils.js?v=20261121c';
import { getMonthlyStats, getConflicts } from './renderers.js?v=20261121c';
import {
  STORAGE_PUBLISH_TOKEN, STORAGE_PUBLISH_LAST, PUBLISH_BASE, PUBLISH_APP_VERSION, CONFIG_DATA_KEY,
} from './config.js?v=20261121c';

let pollTimer = null;
let lastJob = null;

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

export function publishToken() {
  try { return localStorage.getItem(STORAGE_PUBLISH_TOKEN) || ''; } catch { return ''; }
}

/** Legge `#editore=<token>`, lo salva e ripulisce l'hash (il fragment non va nei log). */
export function bootEditorFromHash() {
  const match = /(?:^|[#&])editore=([A-Za-z0-9._-]{16,128})/.exec(location.hash || '');
  if (!match) return false;
  try { localStorage.setItem(STORAGE_PUBLISH_TOKEN, match[1]); } catch { /* storage non disponibile */ }
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}

/** Salva il codice incollato a mano (secondo dispositivo, link perso, rotazione). */
export function saveToken(value) {
  const token = String(value || '').trim();
  if (!/^[A-Za-z0-9._-]{16,128}$/.test(token)) {
    toast('Codice non valido: incolla il codice ricevuto (almeno 16 caratteri)', 'error', 6000);
    return false;
  }
  try {
    localStorage.setItem(STORAGE_PUBLISH_TOKEN, token);
  } catch (err) {
    toast('Salvataggio non disponibile su questo browser', 'error', 6000);
    return false;
  }
  updatePublishButton();
  renderTokenRow();
  const confirm = el('btn-publish-confirm');
  if (confirm) confirm.disabled = preflight().conflicts > 0;
  toast('Codice di pubblicazione salvato su questo dispositivo', 'success', 4000);
  return true;
}

export function saveTokenFromInput() {
  return saveToken(el('publish-token-input')?.value || '');
}

function renderTokenRow() {
  const stateLine = el('publish-token-state');
  const input = el('publish-token-input');
  const has = Boolean(publishToken());
  if (stateLine) {
    stateLine.textContent = has
      ? 'Codice configurato su questo dispositivo.'
      : 'Nessun codice su questo dispositivo: incollalo qui una volta sola (o apri il link con #editore=…).';
  }
  if (input) {
    input.value = '';
    input.placeholder = has ? 'incolla un nuovo codice per sostituirlo' : 'incolla il codice ricevuto';
  }
}

export function currentMonthKey() {
  return `${state.calYear}-${String(state.calMonth + 1).padStart(2, '0')}`;
}

export function buildMonthExport(month = currentMonthKey()) {
  const assignments = {};
  for (const [key, docId] of Object.entries(state.assignments)) {
    if (key.startsWith(month + '-')) assignments[key] = docId;
  }
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    doctors: state.doctors,
    assignments,
    closedDays: state.closedDays,
    placeOpenDays: state.placeOpenDays || {},
    extraShifts: state.extraShifts || [],
  };
}

export function preflight(month = currentMonthKey()) {
  const stats = getMonthlyStats();
  const conflicts = getConflicts().filter(c => String(c.dateKey).startsWith(month));
  const perPlace = {};
  for (const key of Object.keys(state.assignments)) {
    if (!key.startsWith(month + '-')) continue;
    const place = key.split('_')[2];
    perPlace[place] = (perPlace[place] || 0) + 1;
  }
  return {
    month,
    cells: stats.filledSlots,
    openCells: stats.totalSlots,
    empty: stats.emptySlots,
    hours: stats.totalHours,
    extraHours: stats.extraHours,
    coverage: stats.coverage,
    conflicts: conflicts.length,
    conflictSamples: conflicts.slice(0, 6).map((c) => {
      const doc = state.doctors.find(d => d.id === c.docId);
      return `${c.dateKey} ${c.slotKey} · ${doc ? doc.name : c.docId}`;
    }),
    perPlace,
  };
}

function summaryHtml(pre) {
  const places = Object.entries(pre.perPlace).map(([p, n]) => `${escapeHtml(p)} ${n}`).join(' · ');
  const bad = pre.conflicts > 0;
  const extra = pre.extraHours ? ` (di cui ${pre.extraHours} extra)` : '';
  return `
    <div class="space-y-2 text-sm text-slate-700">
      <p><strong>${escapeHtml(pre.month)}</strong> · ${pre.cells}/${pre.openCells} celle · ${pre.hours} ore${extra} · copertura ${pre.coverage}%</p>
      <p class="text-xs text-slate-600">Sedi: ${places || '—'}</p>
      <p class="${bad ? 'text-red-700 font-semibold' : 'text-emerald-700'}">
        ${bad ? `${pre.conflicts} conflitti da risolvere prima di pubblicare` : 'Nessun conflitto nel mese'}
      </p>
      ${bad ? `<ul class="text-xs text-red-700 list-disc pl-5">${pre.conflictSamples.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
      <p class="text-xs text-slate-500">Il roster (disponibilità e assenze) è globale: viene aggiornato per tutti i mesi.</p>
    </div>`;
}

function setChip(text, tone) {
  const chip = el('publish-chip');
  if (!chip) return;
  chip.textContent = text;
  chip.style.display = 'inline-block';
  const tones = {
    ok: 'bg-emerald-100 text-emerald-800',
    bad: 'bg-red-100 text-red-800',
    wait: 'bg-amber-100 text-amber-900',
    info: 'bg-slate-100 text-slate-700',
  };
  chip.className = 'text-xs font-semibold px-2 py-1 rounded-full ' + (tones[tone] || tones.info);
}

export function updatePublishButton() {
  const button = el('btn-publish');
  if (!button) return;
  const wrap = el('publish-wrap');
  // Il pulsante è sempre visibile: senza codice la modale spiega come inserirlo.
  // (Con un solo editor non c'è ragione di nasconderlo, e così il link non è l'unica via.)
  if (wrap) wrap.style.display = 'flex';
  button.style.display = 'inline-flex';
  const saved = readJson(STORAGE_PUBLISH_LAST, null);
  if (saved && saved.jobId) {
    lastJob = saved;
    if (saved.status === 'published') setChip('pubblicato', 'ok');
    else if (saved.status === 'queued' || saved.status === 'running') setChip('in coda', 'wait');
    else setChip(saved.status === 'rejected' ? 'rifiutato' : 'errore', 'bad');
  }
  const notify = el('btn-publish-notify');
  if (notify) {
    const stale = saved && saved.jobId && saved.status === 'queued';
    notify.style.display = stale ? 'inline-flex' : 'none';
    if (stale) {
      const minutes = Math.max(0, Math.round((Date.now() - (saved.startedAt || 0)) / 60000));
      notify.textContent = `Avvisa Emanuel (in coda da ${minutes} min)`;
    }
  }
}

export function openPublishModal() {
  const pre = preflight();
  const body = el('publish-summary');
  // innerHTML è sicuro qui: ogni valore dinamico passa da escapeHtml() e il resto è
  // template statico — stessa convenzione degli altri renderer.
  if (body) body.innerHTML = summaryHtml(pre);
  renderTokenRow();
  const confirm = el('btn-publish-confirm');
  // Senza codice la conferma è bloccata: il codice si incolla nella stessa modale.
  if (confirm) confirm.disabled = pre.conflicts > 0 || !publishToken();
  const modal = el('publish-modal');
  if (modal) modal.style.display = 'flex';
}

export function closePublishModal() {
  const modal = el('publish-modal');
  if (modal) modal.style.display = 'none';
}

export async function confirmPublish() {
  const token = publishToken();
  if (!token) { toast('Codice di pubblicazione mancante', 'error'); return; }
  const pre = preflight();
  if (pre.conflicts > 0) { toast('Risolvi i conflitti prima di pubblicare', 'error'); return; }
  const button = el('btn-publish-confirm');
  if (button) { button.disabled = true; button.textContent = 'Invio…'; }
  try {
    const auth = 'Bearer ' + token;
    const response = await fetch(`${PUBLISH_BASE}/publish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: auth },
      body: JSON.stringify({
        appVersion: PUBLISH_APP_VERSION,
        month: pre.month,
        export: buildMonthExport(pre.month),
        preflight: pre,
      }),
    });
    const out = await response.json().catch(() => ({}));
    if (response.status !== 202) {
      setChip('rifiutato', 'bad');
      const details = Array.isArray(out.details) ? ' — ' + out.details.join('; ') : '';
      toast(`Pubblicazione rifiutata: ${out.error || response.status}${details}`, 'error', 8000);
      return;
    }
    lastJob = { jobId: out.jobId, month: pre.month, startedAt: Date.now(), status: 'queued' };
    try { localStorage.setItem(STORAGE_PUBLISH_LAST, JSON.stringify(lastJob)); } catch { /* pieno */ }
    closePublishModal();
    setChip('in coda', 'wait');
    toast('Pubblicazione in coda: il sito si aggiorna in pochi minuti', 'info', 6000);
    schedulePoll(out.jobId);
  } catch (err) {
    setChip('offline', 'bad');
    toast('Rete non raggiungibile: scarica il JSON e invialo a Emanuel', 'error', 8000);
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Pubblica sul sito'; }
  }
}

export async function notifyEmanuel() {
  const saved = readJson(STORAGE_PUBLISH_LAST, null);
  if (!saved || !saved.jobId) { toast('Nessuna pubblicazione in coda', 'error'); return; }
  try {
    const auth = 'Bearer ' + publishToken();
    const response = await fetch(`${PUBLISH_BASE}/jobs/${saved.jobId}/notify`, {
      method: 'POST',
      headers: { authorization: auth },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    toast('Avviso inviato a Emanuel con il JSON in allegato', 'success', 6000);
  } catch (err) {
    toast('Invio non riuscito: scarica il JSON e mandalo a Emanuel', 'error', 8000);
  }
}

async function fetchJob(jobId) {
  const auth = 'Bearer ' + publishToken();
  const response = await fetch(`${PUBLISH_BASE}/jobs/${jobId}`, { headers: { authorization: auth } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function pollJob(jobId) {
  clearTimeout(pollTimer);
  let out;
  try {
    out = await fetchJob(jobId);
  } catch (err) {
    pollTimer = setTimeout(() => pollJob(jobId), 15000);
    return;
  }
  lastJob = { ...(lastJob || {}), jobId, status: out.status, detail: out.detail, numbers: out.numbers };
  try { localStorage.setItem(STORAGE_PUBLISH_LAST, JSON.stringify(lastJob)); } catch { /* pieno */ }
  if (out.status === 'queued' || out.status === 'running') {
    setChip('in coda', 'wait');
    pollTimer = setTimeout(() => pollJob(jobId), 10000);
    return;
  }
  if (out.status === 'published') {
    setChip('pubblicato', 'ok');
    if (out.version) {
      try { localStorage.setItem(CONFIG_DATA_KEY, out.version); } catch { /* pieno */ }
    }
    const numbers = out.numbers || {};
    toast(`Pubblicato: ${numbers.cells ?? '?'} celle, ${numbers.hours ?? '?'}h · versione ${out.version}`, 'success', 9000);
    return;
  }
  setChip(out.status === 'rejected' ? 'rifiutato' : 'errore', 'bad');
  toast(`${out.status}: ${out.detail || ''}`.slice(0, 400), 'error', 10000);
}

function schedulePoll(jobId) {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(() => pollJob(jobId), 4000);
}

export function initPublish() {
  bootEditorFromHash();
  updatePublishButton();
  // Se la pagina è già aperta, il link `#editore=…` produce solo un cambio di hash:
  // senza questo listener il token non verrebbe mai letto (caso reale: si clicca il
  // link dalla chat con l'app già aperta).
  window.addEventListener('hashchange', () => {
    if (bootEditorFromHash()) {
      updatePublishButton();
      toast('Codice di pubblicazione salvato', 'success', 4000);
    }
  });
  const saved = readJson(STORAGE_PUBLISH_LAST, null);
  const fresh = saved && Date.now() - (saved.startedAt || 0) < 30 * 60 * 1000;
  if (saved && saved.jobId && fresh && (saved.status === 'queued' || saved.status === 'running')) {
    pollJob(saved.jobId);
  }
}
