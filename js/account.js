import {
  auth, db, $, esc, onAuthStateChanged, signOut, ensureProfile, roleOf, fmtDate, remaining, friendlyError, localNow,
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from './fb.js';

const app = $('app');
let me = null, profile = null;

function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 3200); }
$('logout').onclick = async () => { await signOut(auth); location.replace('login.html'); };

async function list(col, field, value) {
  const snap = await getDocs(query(collection(db, col), where(field, '==', value)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
const byDate = (a, b) => String(a.date || '').localeCompare(String(b.date || ''));

function header(roleLabel) {
  const name = esc(profile.name || me.displayName || me.email);
  return '<div class="who"><div><span class="label">' + roleLabel + '</span><h1>Hi, ' + name.split(' ')[0] + '</h1>' +
    '<p class="muted small">' + esc(me.email) + '</p></div>' +
    (roleOf(me, profile) === 'admin' ? '<a class="btn btn-red" href="admin.html">Open admin</a>' : '') + '</div>' +
    (!me.emailVerified && me.providerData.some((p) => p.providerId === 'password')
      ? '<p class="note">Please confirm your email address. We sent you a link when you signed up (check spam).</p>' : '');
}

function sessionRow(s, canEdit) {
  const actions = canEdit && s.status === 'scheduled'
    ? '<span class="row"><button class="btn btn-red btn-sm" data-done="' + s.id + '">Mark done</button>' +
      '<button class="btn btn-line btn-sm" data-cancel="' + s.id + '">Cancel</button></span>'
    : canEdit && s.status === 'done' ? '<button class="link small" data-undo="' + s.id + '">Undo</button>' : '';
  return '<li><span><strong>' + (s.date ? fmtDate(s.date) : 'No date') + '</strong>' +
    (canEdit ? ' · ' + esc(s.clientName || '') : '') + (s.note ? '<br><span class="muted small">' + esc(s.note) + '</span>' : '') +
    '</span><span class="row"><span class="pill ' + esc(s.status) + '">' + esc(s.status) + '</span>' + actions + '</span></li>';
}

/* ---------------- Client ---------------- */
async function renderClient() {
  const [pkgs, sessions] = await Promise.all([list('packages', 'clientUid', me.uid), list('sessions', 'clientUid', me.uid)]);
  sessions.sort(byDate);
  const now = localNow();
  const active = pkgs.filter((p) => p.status !== 'cancelled');
  let html = header('My training');
  if (!active.length) {
    html += '<div class="card"><h2>No sessions yet</h2><p>Once your package is confirmed, your sessions will appear here.</p>' +
      '<div class="row"><a class="btn btn-red" href="index.html#book">Book a session</a>' +
      '<a class="btn btn-line" href="https://wa.me/971525700118" target="_blank" rel="noopener">WhatsApp us</a></div></div>';
  }
  active.forEach((p) => {
    const r = remaining(p, sessions);
    const mine = sessions.filter((s) => s.packageId === p.id);
    const upcoming = mine.filter((s) => s.status === 'scheduled' && (s.date || '') >= now);
    const past = mine.filter((s) => !(s.status === 'scheduled' && (s.date || '') >= now)).reverse();
    html += '<section class="card hot" style="margin-bottom:22px">' +
      '<div class="row" style="justify-content:space-between"><div><span class="label">' + esc(p.title || (p.total + ' sessions')) + '</span>' +
      '<h2 style="margin:4px 0 0">Coach ' + esc(p.coachName || '') + '</h2></div>' +
      '<div style="text-align:end"><div class="big">' + r.left + '</div><span class="muted small">sessions left of ' + esc(p.total) + '</span></div></div>' +
      '<div class="bar" aria-hidden="true"><span style="width:' + (p.total ? Math.round(r.done / p.total * 100) : 0) + '%"></span></div>' +
      '<p class="small muted">' + r.done + ' done' + (p.paid ? ' · Paid' : ' · Payment pending') + (p.startDate ? ' · Started ' + esc(p.startDate) : '') + '</p>' +
      '<h3>Upcoming</h3>' + (upcoming.length ? '<ul class="list">' + upcoming.map((s) => sessionRow(s, false)).join('') + '</ul>' : '<p class="muted">Your coach will schedule your next session.</p>') +
      (past.length ? '<h3>History</h3><ul class="list">' + past.map((s) => sessionRow(s, false)).join('') + '</ul>' : '') +
      '</section>';
  });
  app.innerHTML = html;
}

/* ---------------- Coach ---------------- */
async function renderCoach() {
  const [pkgs, sessions] = await Promise.all([list('packages', 'coachId', profile.coachId), list('sessions', 'coachId', profile.coachId)]);
  sessions.sort(byDate);
  const active = pkgs.filter((p) => p.status !== 'cancelled');
  const now = localNow();
  const upcoming = sessions.filter((s) => s.status === 'scheduled' && (s.date || '') >= now);
  let html = header('Coach dashboard');
  html += '<section style="margin-bottom:28px"><h2>Upcoming sessions</h2>' +
    (upcoming.length ? '<ul class="list">' + upcoming.map((s) => sessionRow(s, true)).join('') + '</ul>' : '<p class="muted">Nothing scheduled yet.</p>') + '</section>';
  html += '<h2>My clients</h2>';
  if (!active.length) html += '<p class="muted">No clients assigned yet. The admin assigns clients to you.</p>';
  html += '<div class="stack">';
  active.forEach((p) => {
    const r = remaining(p, sessions);
    const mine = sessions.filter((s) => s.packageId === p.id).reverse();
    html += '<section class="card"><div class="row" style="justify-content:space-between"><div><h3>' + esc(p.clientName || 'Client') + '</h3>' +
      '<span class="muted small">' + esc(p.title || '') + (p.clientPhone ? ' · <a href="https://wa.me/' + esc(String(p.clientPhone).replace(/\D/g, '')) + '" target="_blank" rel="noopener">' + esc(p.clientPhone) + '</a>' : '') + '</span></div>' +
      '<div style="text-align:end"><div class="big">' + r.left + '</div><span class="muted small">left of ' + esc(p.total) + '</span></div></div>' +
      '<form class="row" data-sched="' + p.id + '"><div class="field" style="flex:1;min-width:200px"><label>Schedule a session</label>' +
      '<input type="datetime-local" required></div><div class="field" style="flex:1;min-width:160px"><label>Note (optional)</label><input maxlength="120" placeholder="e.g. Marina beach"></div>' +
      '<button class="btn btn-red" type="submit"' + (r.left ? '' : ' disabled') + '>Add</button></form>' +
      (mine.length ? '<ul class="list">' + mine.map((s) => sessionRow(s, true)).join('') + '</ul>' : '') + '</section>';
  });
  html += '</div>';
  app.innerHTML = html;

  app.querySelectorAll('form[data-sched]').forEach((f) => {
    f.onsubmit = async (e) => {
      e.preventDefault();
      const p = active.find((x) => x.id === f.dataset.sched);
      const [dateEl, noteEl] = f.querySelectorAll('input');
      if (!dateEl.value) return;
      try {
        await addDoc(collection(db, 'sessions'), {
          packageId: p.id, clientUid: p.clientUid, clientName: p.clientName || '', coachId: p.coachId, coachName: p.coachName || '',
          date: dateEl.value, note: noteEl.value.trim().slice(0, 120), status: 'scheduled',
          createdAt: serverTimestamp(), updatedBy: me.uid
        });
        toast('Session scheduled'); renderCoach();
      } catch (x) { toast(friendlyError(x)); }
    };
  });
  const setStatus = async (id, status) => {
    try { await updateDoc(doc(db, 'sessions', id), { status, updatedAt: serverTimestamp(), updatedBy: me.uid }); toast('Updated'); renderCoach(); }
    catch (x) { toast(friendlyError(x)); }
  };
  app.querySelectorAll('[data-done]').forEach((b) => { b.onclick = () => setStatus(b.dataset.done, 'done'); });
  app.querySelectorAll('[data-undo]').forEach((b) => { b.onclick = () => setStatus(b.dataset.undo, 'scheduled'); });
  app.querySelectorAll('[data-cancel]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('Cancel this session? It will be removed.')) return;
      try { await deleteDoc(doc(db, 'sessions', b.dataset.cancel)); toast('Session removed'); renderCoach(); }
      catch (x) { toast(friendlyError(x)); }
    };
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.replace('login.html');
  me = user; $('logout').hidden = false;
  try {
    profile = (await ensureProfile(user)).profile;
    const role = roleOf(user, profile);
    if (role === 'blocked') {
      app.innerHTML = '<h1>Account paused</h1><p>Your account is not active. Contact OwnFit on <a href="https://wa.me/971525700118">WhatsApp</a>.</p>';
      return;
    }
    if (role === 'coach' && profile.coachId) await renderCoach();
    else await renderClient();
  } catch (x) {
    app.innerHTML = '<p class="err">' + esc(friendlyError(x)) + '</p>';
  }
});
