// OwnFit – Visitors dashboard (super admin only)
// Raw records live in events/. Each finished day is summarised once into stats/{YYYY-MM-DD},
// so older days load fast and are never re-counted.
import { db, esc, collection, getDocs, query, where, doc, setDoc } from './fb.js';

const START = '2026-11-01'; // first day of tracking
const cache = {};           // day -> summary
let state = { range: '7d', group: 'day', from: '', to: '' };
let coachList = [];

/* ---------- dates (UAE time, UTC+4, no daylight saving) ---------- */
const uaeDay = (ms = Date.now()) => new Date(ms + 4 * 3600e3).toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const listDays = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };
// A day is closed (safe to summarise for good) two hours after UAE midnight.
const isClosed = (d) => d < uaeDay(Date.now() - 2 * 3600e3);
const weekStart = (d) => { const w = new Date(d + 'T00:00:00Z').getUTCDay(); return addDays(d, -((w + 6) % 7)); };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nice = (d) => Number(d.slice(8, 10)) + ' ' + MONTHS[Number(d.slice(5, 7)) - 1] + ' ' + d.slice(0, 4);
const niceShort = (d) => Number(d.slice(8, 10)) + ' ' + MONTHS[Number(d.slice(5, 7)) - 1];

function rangeDates(r) {
  const today = uaeDay();
  const m0 = today.slice(0, 8) + '01';
  switch (r) {
    case 'today': return [today, today];
    case 'yesterday': return [addDays(today, -1), addDays(today, -1)];
    case '7d': return [addDays(today, -6), today];
    case '30d': return [addDays(today, -29), today];
    case 'month': return [m0, today];
    case 'lastmonth': { const end = addDays(m0, -1); return [end.slice(0, 8) + '01', end]; }
    case '90d': return [addDays(today, -89), today];
    case '12m': return [addDays(today, -364), today];
    case 'all': return [START, today];
    default: return [state.from || today, state.to || today];
  }
}

/* ---------- loading & summarising ---------- */
const bump = (o, k, n = 1) => { if (k) o[k] = (o[k] || 0) + n; };
const toArr = (o) => Object.keys(o).map((k) => ({ k, n: o[k] }));
const toObj = (a) => { const o = {}; (a || []).forEach((x) => { o[x.k] = x.n; }); return o; };

function summarise(d, evs) {
  const vids = new Set(), sids = new Set(), pages = {}, clicks = {}, forms = {}, refs = {}, dev = {}, lang = {}, seen = {};
  let views = 0, newVisitors = 0;
  evs.forEach((e) => {
    vids.add(e.v); sids.add(e.s);
    if (!seen[e.s]) { seen[e.s] = 1; bump(dev, e.dv || 'desktop'); bump(lang, e.lg || 'en'); }
    if (e.t === 'view') { views++; bump(pages, e.p); if (e.r) bump(refs, e.r); }
    else if (e.t === 'click') bump(clicks, e.l || '(unnamed)');
    else if (e.t === 'form') bump(forms, e.l || 'Form');
  });
  return { d, views, visits: sids.size, vids: [...vids], newVisitors, pages: toArr(pages), clicks: toArr(clicks), forms: toArr(forms),
    refs: toArr(refs), dev: toArr(dev), lang: toArr(lang), events: evs.length };
}

async function load(from, to, fresh) {
  if (from < START) from = START;
  if (from > to) return [];
  const days = listDays(from, to);
  if (fresh) days.forEach((d) => { if (!isClosed(d)) delete cache[d]; });
  let need = days.filter((d) => !cache[d]);
  if (need.length) {
    const closed = need.filter(isClosed);
    if (closed.length) {
      const st = await getDocs(query(collection(db, 'stats'), where('d', '>=', closed[0]), where('d', '<=', closed[closed.length - 1])));
      st.forEach((s) => { cache[s.id] = s.data(); });
    }
    need = need.filter((d) => !cache[d]);
  }
  if (need.length) {
    const evSnap = await getDocs(query(collection(db, 'events'), where('d', '>=', need[0]), where('d', '<=', need[need.length - 1])));
    const byDay = {};
    evSnap.forEach((s) => { const e = s.data(); (byDay[e.d] = byDay[e.d] || []).push(e); });
    const writes = [];
    need.forEach((d) => {
      const sum = summarise(d, byDay[d] || []);
      cache[d] = sum;
      if (isClosed(d)) writes.push(setDoc(doc(db, 'stats', d), sum).catch(() => {}));
    });
    await Promise.all(writes);
  }
  return days.map((d) => cache[d]);
}

function merge(list) {
  const vids = new Set(), pages = {}, clicks = {}, forms = {}, refs = {}, dev = {}, lang = {};
  let views = 0, visits = 0;
  list.forEach((s) => {
    views += s.views || 0; visits += s.visits || 0;
    (s.vids || []).forEach((v) => vids.add(v));
    [[pages, s.pages], [clicks, s.clicks], [forms, s.forms], [refs, s.refs], [dev, s.dev], [lang, s.lang]]
      .forEach(([o, a]) => (a || []).forEach((x) => bump(o, x.k, x.n)));
  });
  const bookings = Object.keys(forms).filter((k) => /^Booking request/.test(k)).reduce((n, k) => n + forms[k], 0);
  return { views, visits, visitors: vids.size, vids, pages, clicks, forms, refs, dev, lang, bookings, whatsapp: clicks.WhatsApp || 0 };
}

/* ---------- friendly names ---------- */
const PAGE = {
  index: 'Home', 'personal-training': 'Personal training', boxing: 'Boxing', kickboxing: 'Kickboxing', 'muay-thai': 'Muay Thai',
  login: 'Login page', account: 'Customer account', coach: 'Trainer profile',
  'personal-trainer-dubai': 'Personal trainer – Dubai', 'personal-trainer-abu-dhabi': 'Personal trainer – Abu Dhabi',
  'personal-trainer-sharjah': 'Personal trainer – Sharjah', 'personal-trainer-ajman': 'Personal trainer – Ajman'
};
function coachName(id) {
  const c = coachList.find((x) => x.id === id);
  return c ? c.name : String(id).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function trainerOf(p) {
  const m = p.match(/^coach(?:-ar)?\.html#(.+)$/) || p.match(/^coach-(.+?)(?:-ar)?\.html$/);
  return m ? m[1] : null;
}
function pageName(p) {
  const ar = /-ar\.html/.test(p) ? ' (Arabic)' : '';
  const t = trainerOf(p);
  if (t) return 'Trainer: ' + coachName(t) + ar;
  const base = p.replace(/(-ar)?\.html.*$/, '');
  return (PAGE[base] || p) + ar;
}
function clickName(l) {
  let m = l.match(/^Trainer profile: (.+)$/);
  if (m) return 'Opened trainer profile: ' + coachName(m[1]);
  m = l.match(/^Package: (.+)$/);
  if (m) return 'Chose package: ' + m[1];
  return l;
}
function formName(l) {
  const m = l.match(/^Booking request: (.+)$/);
  return m ? 'Booking request – ' + coachName(m[1]) : l;
}
function sourceName(h) {
  if (h === 'direct') return 'Direct (typed, bookmark or app)';
  if (/(^|\.)google\./.test(h) || h === 'google-ads') return h === 'google-ads' ? 'Google Ads' : 'Google';
  if (/instagram/.test(h)) return 'Instagram';
  if (/facebook|^fb\.|^m\.facebook/.test(h)) return 'Facebook';
  if (/tiktok/.test(h)) return 'TikTok';
  if (/bing\./.test(h)) return 'Bing';
  if (/chatgpt|openai/.test(h)) return 'ChatGPT';
  if (/t\.co$|twitter|x\.com/.test(h)) return 'X (Twitter)';
  if (/linkedin|lnkd/.test(h)) return 'LinkedIn';
  if (/youtube/.test(h)) return 'YouTube';
  return h;
}
const regroup = (o, fn) => { const out = {}; Object.keys(o).forEach((k) => bump(out, fn(k), o[k])); return out; };

/* ---------- drawing ---------- */
function table(title, obj, nameFn, colLabel, note) {
  const rows = Object.keys(obj).map((k) => [nameFn ? nameFn(k) : k, obj[k]]).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((n, r) => n + r[1], 0) || 1;
  return '<div class="card"><h2 style="margin-top:0">' + title + '</h2>' + (note ? '<p class="small muted">' + note + '</p>' : '') +
    (rows.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>' + colLabel[0] + '</th><th style="text-align:end">' + colLabel[1] + '</th><th style="width:30%"></th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td>' + esc(r[0]) + '</td><td style="text-align:end"><strong>' + r[1] + '</strong></td><td><div class="bar" style="height:8px"><span style="width:' +
        Math.max(2, Math.round(r[1] / total * 100)) + '%"></span></div></td></tr>').join('') + '</tbody></table></div>'
      : '<p class="muted">Nothing yet for this period.</p>') + '</div>';
}

function chart(periods) {
  if (!periods.length) return '';
  const max = Math.max(1, ...periods.map((p) => p.views));
  const W = Math.max(600, periods.length * 34), H = 190, bw = Math.min(26, W / periods.length - 6);
  const step = W / periods.length, every = Math.ceil(periods.length / 16);
  let g = '';
  periods.forEach((p, i) => {
    const x = i * step + (step - bw) / 2, hv = Math.round(p.views / max * 150), hu = Math.round(p.visitors / max * 150);
    g += '<rect x="' + x + '" y="' + (165 - hv) + '" width="' + bw + '" height="' + hv + '" fill="var(--line)"><title>' + esc(p.label) + ': ' + p.views + ' page views</title></rect>';
    g += '<rect x="' + (x + bw * 0.2) + '" y="' + (165 - hu) + '" width="' + bw * 0.6 + '" height="' + hu + '" fill="var(--red)"><title>' + esc(p.label) + ': ' + p.visitors + ' visitors</title></rect>';
    if (i % every === 0) g += '<text x="' + (x + bw / 2) + '" y="182" text-anchor="middle" font-size="11" fill="currentColor">' + esc(p.short) + '</text>';
  });
  return '<div class="card"><div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">Over time</h2>' +
    '<span class="small"><span style="display:inline-block;width:10px;height:10px;background:var(--red)"></span> Visitors &nbsp; ' +
    '<span style="display:inline-block;width:10px;height:10px;background:var(--line)"></span> Page views</span></div>' +
    '<div style="overflow-x:auto;margin-top:12px"><svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Visitors and page views over time">' +
    '<line x1="0" x2="' + W + '" y1="165" y2="165" stroke="var(--line)"/>' + g + '</svg></div></div>';
}

function periodsOf(days, group) {
  const groups = new Map();
  days.forEach((s) => {
    const k = group === 'month' ? s.d.slice(0, 7) : group === 'week' ? weekStart(s.d) : s.d;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  });
  return [...groups.entries()].map(([k, list]) => {
    const m = merge(list);
    const label = group === 'month' ? MONTHS[Number(k.slice(5, 7)) - 1] + ' ' + k.slice(0, 4) : group === 'week' ? 'Week of ' + nice(k) : nice(k);
    const short = group === 'month' ? MONTHS[Number(k.slice(5, 7)) - 1] + ' ' + k.slice(2, 4) : niceShort(k);
    return { key: k, label, short, ...m };
  });
}

function csv(periods, tot) {
  const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const lines = [['Period', 'Visitors', 'Visits', 'Page views', 'Booking requests', 'WhatsApp clicks'].map(q).join(',')];
  periods.forEach((p) => lines.push([p.label, p.visitors, p.visits, p.views, p.bookings, p.whatsapp].map(q).join(',')));
  lines.push('');
  const sec = (title, obj, fn) => { lines.push(q(title) + ',' + q('Count')); Object.keys(obj).sort((a, b) => obj[b] - obj[a]).forEach((k) => lines.push(q(fn ? fn(k) : k) + ',' + obj[k])); lines.push(''); };
  sec('Page', tot.pages, pageName); sec('Click', tot.clicks, clickName); sec('Form', tot.forms, formName);
  sec('Came from', regroup(tot.refs, sourceName)); sec('Device', tot.dev); sec('Language', tot.lang);
  return '﻿' + lines.join('\r\n');
}

/* ---------- main ---------- */
export async function renderInsights(panel, coaches) {
  coachList = coaches || [];
  try { localStorage.setItem('ownfit_notrack', '1'); } catch (x) { /* ignore */ } // don't count your own visits
  const opt = (v, l) => '<option value="' + v + '"' + (state.range === v ? ' selected' : '') + '>' + l + '</option>';
  const gopt = (v, l) => '<option value="' + v + '"' + (state.group === v ? ' selected' : '') + '>' + l + '</option>';
  panel.innerHTML = '<div class="card"><div class="row" style="gap:12px;align-items:flex-end;flex-wrap:wrap">' +
    '<div class="field" style="margin:0"><label for="in-range">Period</label><select id="in-range">' +
      opt('today', 'Today') + opt('yesterday', 'Yesterday') + opt('7d', 'Last 7 days') + opt('30d', 'Last 30 days') + opt('month', 'This month') +
      opt('lastmonth', 'Last month') + opt('90d', 'Last 90 days') + opt('12m', 'Last 12 months') + opt('all', 'Since tracking began') + opt('custom', 'Choose dates…') + '</select></div>' +
    '<div class="field" style="margin:0" id="in-dates"' + (state.range === 'custom' ? '' : ' hidden') + '><label>From – to</label><div class="row" style="gap:6px;flex-wrap:nowrap">' +
      '<input type="date" id="in-from" min="' + START + '" value="' + esc(state.from) + '"><input type="date" id="in-to" min="' + START + '" value="' + esc(state.to) + '"></div></div>' +
    '<div class="field" style="margin:0"><label for="in-group">Show by</label><select id="in-group">' + gopt('day', 'Day') + gopt('week', 'Week') + gopt('month', 'Month') + '</select></div>' +
    '<button class="btn btn-line btn-sm" id="in-refresh" type="button">Refresh</button>' +
    '<button class="btn btn-line btn-sm" id="in-csv" type="button">Download CSV</button></div>' +
    '<p class="small muted" style="margin-bottom:0">Counts every visitor, with or without an account. Times are UAE time. Your own visits on this browser are not counted. Tracking started ' + nice(START) + '.</p></div>' +
    '<div id="in-body"><p><span class="spinner"></span> Loading visitors…</p></div>';

  const draw = async (fresh) => {
    const body = panel.querySelector('#in-body');
    if (!body) return;
    body.innerHTML = '<p><span class="spinner"></span> Loading visitors…</p>';
    try {
      const [from, to] = rangeDates(state.range);
      const days = await load(from, to, fresh);
      if (!panel.querySelector('#in-body')) return;
      const tot = merge(days);
      const periods = periodsOf(days, state.group);
      const tile = (n, l) => '<div class="card" style="margin:0;text-align:center"><div class="big">' + n + '</div><div class="small muted">' + l + '</div></div>';
      const trainers = {};
      Object.keys(tot.pages).forEach((p) => { const t = trainerOf(p); if (t) bump(trainers, t, tot.pages[p]); });
      const trainerBookings = {};
      Object.keys(tot.forms).forEach((k) => { const m = k.match(/^Booking request: (.+)$/); if (m) bump(trainerBookings, m[1], tot.forms[k]); });
      const tIds = [...new Set([...Object.keys(trainers), ...Object.keys(trainerBookings)])];
      const trainerTable = '<div class="card"><h2 style="margin-top:0">Trainer profiles</h2>' + (tIds.length ?
        '<div class="table-wrap"><table class="t"><thead><tr><th>Trainer</th><th style="text-align:end">Profile views</th><th style="text-align:end">Booking requests</th></tr></thead><tbody>' +
        tIds.sort((a, b) => (trainers[b] || 0) - (trainers[a] || 0)).map((t) => '<tr><td>' + esc(coachName(t)) + '</td><td style="text-align:end"><strong>' + (trainers[t] || 0) +
          '</strong></td><td style="text-align:end">' + (trainerBookings[t] || 0) + '</td></tr>').join('') + '</tbody></table></div>'
        : '<p class="muted">Nothing yet for this period.</p>') + '</div>';
      const periodTable = '<div class="card"><h2 style="margin-top:0">By ' + state.group + '</h2><div class="table-wrap"><table class="t"><thead><tr><th>' +
        (state.group === 'day' ? 'Day' : state.group === 'week' ? 'Week' : 'Month') + '</th><th style="text-align:end">Visitors</th><th style="text-align:end">Visits</th><th style="text-align:end">Page views</th>' +
        '<th style="text-align:end">Booking requests</th><th style="text-align:end">WhatsApp</th></tr></thead><tbody>' +
        periods.slice().reverse().map((p) => '<tr><td>' + esc(p.label) + '</td><td style="text-align:end"><strong>' + p.visitors + '</strong></td><td style="text-align:end">' + p.visits +
          '</td><td style="text-align:end">' + p.views + '</td><td style="text-align:end">' + p.bookings + '</td><td style="text-align:end">' + p.whatsapp + '</td></tr>').join('') +
        '</tbody></table></div></div>';
      const label = from === to ? nice(from < START ? START : from) : nice(from < START ? START : from) + ' – ' + nice(to);
      body.innerHTML = '<p class="muted">' + esc(label) + '</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:22px">' +
          tile(tot.visitors, 'Visitors (people)') + tile(tot.visits, 'Visits') + tile(tot.views, 'Page views') + tile(tot.bookings, 'Booking requests') + tile(tot.whatsapp, 'WhatsApp clicks') + '</div>' +
        chart(periods) + periodTable +
        table('Pages visited', tot.pages, pageName, ['Page', 'Views']) +
        trainerTable +
        table('What they clicked', tot.clicks, clickName, ['Click', 'Times'], 'Buttons and links pressed on the website.') +
        table('Forms sent', tot.forms, formName, ['Form', 'Times']) +
        table('Where visitors came from', regroup(tot.refs, sourceName), null, ['Source', 'Visits']) +
        '<div class="grid2">' + table('Device', tot.dev, (k) => k.charAt(0).toUpperCase() + k.slice(1), ['Device', 'Visits']) +
          table('Language', tot.lang, (k) => (k === 'ar' ? 'Arabic' : 'English'), ['Language', 'Visits']) + '</div>';
      panel.querySelector('#in-csv').onclick = () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv(periods, tot)], { type: 'text/csv;charset=utf-8' }));
        a.download = 'ownfit-visitors-' + (from < START ? START : from) + '-to-' + to + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
      };
    } catch (x) {
      body.innerHTML = '<p class="err">Couldn’t load visitors: ' + esc(x && x.message || x) + '</p>';
    }
  };

  panel.querySelector('#in-range').onchange = (e) => {
    state.range = e.target.value;
    panel.querySelector('#in-dates').hidden = state.range !== 'custom';
    if (state.range === 'custom') {
      if (!state.to) state.to = uaeDay();
      if (!state.from) state.from = addDays(state.to, -13) < START ? START : addDays(state.to, -13);
      panel.querySelector('#in-from').value = state.from; panel.querySelector('#in-to').value = state.to;
    }
    if (['12m', 'all', '90d'].includes(state.range) && state.group === 'day') { state.group = 'week'; panel.querySelector('#in-group').value = 'week'; }
    draw();
  };
  const dates = () => {
    const f = panel.querySelector('#in-from').value, t = panel.querySelector('#in-to').value;
    if (f && t) { state.from = f <= t ? f : t; state.to = f <= t ? t : f; draw(); }
  };
  panel.querySelector('#in-from').onchange = dates;
  panel.querySelector('#in-to').onchange = dates;
  panel.querySelector('#in-group').onchange = (e) => { state.group = e.target.value; draw(); };
  panel.querySelector('#in-refresh').onclick = () => draw(true);
  draw();
}
