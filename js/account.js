import {
  auth, db, $, esc, onAuthStateChanged, signOut, ensureProfile, roleOf, isOwner, fmtDate, remaining, friendlyError, localNow,
  collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, BACKEND, profileComplete, validPhone
} from './fb.js';

const app = $('app');
let me = null, profile = null;
// who = the account shown on this page. Normally yourself; the super admin can "View as" anyone.
let who = null, viewing = false;
// Which part of the page is open: the dashboard or the profile
let view = location.hash === '#profile' ? 'profile' : 'main', mainLabel = 'My training', renderMain = null;

function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 3200); }
$('logout').onclick = async () => { await signOut(auth); location.replace('login.html'); };

async function list(col, field, value) {
  const snap = await getDocs(query(collection(db, col), where(field, '==', value)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
const byDate = (a, b) => String(a.date || '').localeCompare(String(b.date || ''));

function header(roleLabel) {
  const name = esc(profile.name || who.name || who.email);
  const banner = viewing ? '<div class="viewas"><span>Viewing as <strong>' + esc(profile.name || who.email) + '</strong> (' + esc(roleLabel.toLowerCase()) + ') – this is exactly what they see.</span>' +
    '<a href="admin.html">Back to admin</a></div>' : '';
  return banner + '<div class="who"><div><span class="label">' + roleLabel + '</span><h1>Hi, ' + name.split(' ')[0] + '</h1>' +
    '<p class="muted small">' + esc(who.email) + '</p></div>' +
    (!viewing && roleOf(me, profile) === 'admin' ? '<a class="btn btn-red" href="admin.html">Open admin</a>' : '') + '</div>' +
    (!viewing && !me.emailVerified && me.providerData.some((p) => p.providerId === 'password')
      ? '<p class="note">Please confirm your email address. We sent you a link when you signed up (check spam).</p>' : '');
}

function tabsHtml() {
  return '<div class="tabs" role="tablist" style="margin-bottom:24px">' +
    [['main', mainLabel], ['profile', 'My profile']].map(([k, l]) =>
      '<button type="button" role="tab" data-view="' + k + '" aria-selected="' + (view === k) + '">' + l + '</button>').join('') + '</div>';
}
function wireTabs() {
  app.querySelectorAll('[data-view]').forEach((b) => {
    b.onclick = () => {
      view = b.dataset.view;
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + (view === 'profile' ? '#profile' : ''));
      route();
    };
  });
}
async function route() {
  if (view === 'profile') return renderProfile();
  return renderMain();
}

/* ---------------- Complete your profile (required before anything else) ---------------- */
function renderComplete(role) {
  app.innerHTML = '<div class="card hot" style="max-width:560px;margin:10px auto">' +
    '<span class="label">One last step</span><h1 style="margin:4px 0">Complete your profile</h1>' +
    '<p class="muted" style="margin:0">We need your name and mobile number so your coach and the OwnFit team can reach you.</p>' +
    '<form id="cp" class="stack" novalidate style="margin-top:12px">' +
      '<div class="field"><label for="cp-name">Full name *</label><input id="cp-name" maxlength="80" autocomplete="name" required value="' + esc(profile.name || me.displayName || '') + '"></div>' +
      '<div class="field"><label for="cp-phone">Mobile number *</label><input id="cp-phone" type="tel" dir="ltr" maxlength="30" autocomplete="tel" placeholder="+971 5X XXX XXXX" required value="' + esc(profile.phone || '') + '"></div>' +
      '<div class="field"><label for="cp-email">Email</label><input id="cp-email" type="email" dir="ltr" value="' + esc(me.email || '') + '" readonly></div>' +
      '<p class="err" id="cp-err" role="alert" hidden></p>' +
      '<button class="btn btn-red btn-block" type="submit" id="cp-save">Save and continue</button>' +
    '</form></div>';
  setTimeout(() => { const el = !String(profile.name || me.displayName || '').trim() ? $('cp-name') : $('cp-phone'); el.focus(); }, 0);
  $('cp').onsubmit = async (e) => {
    e.preventDefault();
    const name = $('cp-name').value.trim().slice(0, 80), phone = $('cp-phone').value.trim().slice(0, 30), er = $('cp-err');
    const fail = (m, el) => { er.textContent = m; er.hidden = false; el.focus(); };
    if (name.length < 2) return fail('Please enter your full name.', $('cp-name'));
    if (!validPhone(phone)) return fail('Please enter a valid mobile number.', $('cp-phone'));
    const b = $('cp-save'); b.disabled = true;
    try {
      await updateDoc(doc(db, 'users', me.uid), { name, phone });
      if (me.displayName !== name) { try { await updateProfile(me, { displayName: name }); } catch (x) { /* not critical */ } }
      profile.name = name; profile.phone = phone;
      if (history.replaceState) history.replaceState(null, '', location.pathname);
      if (role === 'admin') { location.replace('admin.html'); return; }
      toast('Thanks – your profile is complete'); view = 'main'; route();
    } catch (x) { b.disabled = false; fail(friendlyError(x), $('cp-save')); }
  };
}

/* ---------------- My profile (everyone) ---------------- */
async function renderProfile() {
  const self = !viewing;
  const ownerSelf = self && isOwner(me); // the super admin has no users/ record (so other admins never see it)
  const providers = self ? me.providerData.map((x) => x.providerId) : [profile.provider === 'google.com' ? 'google.com' : 'password'];
  const hasPw = providers.includes('password'), hasGoogle = providers.includes('google.com');
  const since = profile.createdAt && profile.createdAt.toDate ? profile.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const roleName = profile.role === 'admin' && profile.coachId ? 'Admin + Trainer' : ({ client: 'Customer', coach: 'Trainer', admin: 'Admin' }[profile.role] || 'Customer');
  let coachCard = '';
  if ((profile.role === 'coach' || profile.role === 'admin') && profile.coachId) {
    let c = null;
    try {
      const pub = await getDoc(doc(db, 'site', 'published'));
      if (pub.exists()) c = (JSON.parse(pub.data().json || '[]') || []).find((x) => x.id === profile.coachId) || null;
    } catch (x) { /* show the card without details */ }
    const SV = { 'personal-training': 'Personal Training', boxing: 'Boxing', kickboxing: 'Kickboxing', 'muay-thai': 'Muay Thai' };
    const url = 'coach.html#' + encodeURIComponent(profile.coachId);
    coachCard = '<section class="card" style="margin-top:22px"><h2 style="margin:0">My public trainer profile</h2>' +
      (c ? '<div class="row" style="gap:18px;align-items:flex-start;flex-wrap:wrap">' +
          (c.photo ? '<img src="' + esc(c.photo) + '" alt="" style="width:110px;height:130px;object-fit:cover;border:2px solid var(--line)">' : '') +
          '<div style="flex:1;min-width:220px"><h3 style="margin:0">' + esc(c.name || '') + '</h3>' +
          '<p class="muted" style="margin:4px 0">' + esc(c.headline || '') + '</p>' +
          '<p class="small" style="margin:4px 0">' + esc((c.services || []).map((k) => SV[k] || k).join(' · ')) + '</p>' +
          (c.languages && c.languages.length ? '<p class="small muted" style="margin:4px 0">Languages: ' + esc(c.languages.join(', ')) + '</p>' : '') + '</div></div>'
        : '<p class="muted">Your public page isn’t live yet.</p>') +
      '<p class="small muted">This is what clients see on the website. To change your photo, bio, certifications or achievements, send the update to OwnFit and the team will publish it.</p>' +
      '<div class="row" style="gap:10px;flex-wrap:wrap">' + (c ? '<a class="btn btn-line btn-sm" href="' + url + '" target="_blank" rel="noopener">View my public page</a>' : '') +
      '<a class="btn btn-line btn-sm" href="https://wa.me/971525700118?text=' + encodeURIComponent('Hi OwnFit, I would like to update my trainer profile (' + (c ? c.name : profile.name || '') + '):') + '" target="_blank" rel="noopener">Request a change on WhatsApp</a></div></section>';
  }
  app.innerHTML = header(mainLabel === 'My sessions' ? 'Coach dashboard' : 'My training') + tabsHtml() +
    '<section class="card"><h2 style="margin:0">Personal details</h2>' +
    '<form id="pf" class="grid2" novalidate>' +
      '<div class="field"><label for="pf-name">Full name *</label><input id="pf-name" maxlength="80" autocomplete="name" required value="' + esc(profile.name || '') + '"></div>' +
      (ownerSelf ? '' : '<div class="field"><label for="pf-phone">Mobile number *</label><input id="pf-phone" type="tel" dir="ltr" maxlength="30" autocomplete="tel" placeholder="+971 5X XXX XXXX" value="' + esc(profile.phone || '') + '"></div>') +
      '<div class="field"><label for="pf-email">Email (login)</label><input id="pf-email" type="email" dir="ltr" value="' + esc(who.email || profile.email || '') + '" readonly></div>' +
      '<div class="field"><label>Account</label><input value="' + esc(roleName + (since ? ' · since ' + since : '')) + '" readonly></div>' +
      '<p class="small muted" style="grid-column:1/-1;margin:0">Need to change your login email? Message OwnFit and we’ll update it for you.</p>' +
      '<div style="grid-column:1/-1"><button class="btn btn-red" type="submit" id="pf-save">Save changes</button></div>' +
    '</form></section>' +
    '<section class="card" style="margin-top:22px"><h2 style="margin:0">Login &amp; password</h2>' +
      '<p class="small muted" style="margin:0">You sign in with: ' + esc([hasPw ? 'Email & password' : '', hasGoogle ? 'Google' : ''].filter(Boolean).join(' and ') || 'Email & password') + '</p>' +
      (viewing ? '<p class="note">You’re viewing someone else’s account. To set a new password for them, use <strong>Login</strong> on their row in Admin → Users &amp; access.</p>'
      : hasPw ? '<form id="pw" class="grid2" novalidate autocomplete="off">' +
          '<div class="field"><label for="pw-cur">Current password</label><input id="pw-cur" type="password" autocomplete="current-password" required></div>' +
          '<div class="field"><label for="pw-new">New password</label><input id="pw-new" type="password" minlength="8" maxlength="64" autocomplete="new-password" required></div>' +
          '<div class="field"><label for="pw-new2">Repeat new password</label><input id="pw-new2" type="password" minlength="8" maxlength="64" autocomplete="new-password" required></div>' +
          '<div class="field" style="justify-content:flex-end"><button class="btn btn-red" type="submit" id="pw-save">Change password</button></div>' +
          '<p class="small muted" style="grid-column:1/-1;margin:0">Forgot your current password? <button type="button" class="link" id="pw-reset">Email me a reset link</button></p>' +
        '</form>'
      : '<p class="muted">You sign in with Google, so there’s no separate OwnFit password to change. Manage your password in your Google account.</p>') +
    '</section>' + coachCard;
  wireTabs();

  $('pf').onsubmit = async (e) => {
    e.preventDefault();
    const name = $('pf-name').value.trim().slice(0, 80), phone = ownerSelf ? '' : $('pf-phone').value.trim().slice(0, 30);
    if (name.length < 2) { toast('Please enter your full name.'); $('pf-name').focus(); return; }
    if (!ownerSelf && !validPhone(phone)) { toast('Your mobile number is required.'); $('pf-phone').focus(); return; }
    const btn = $('pf-save'); btn.disabled = true;
    try {
      if (!ownerSelf) await updateDoc(doc(db, 'users', who.uid), { name, phone });
      if (self && me.displayName !== name) { try { await updateProfile(me, { displayName: name }); } catch (x) { /* profile doc is what matters */ } }
      profile.name = name; profile.phone = phone;
      toast('Your details are saved'); renderProfile();
    } catch (x) { toast(friendlyError(x)); btn.disabled = false; }
  };
  if ($('pw')) {
    $('pw').onsubmit = async (e) => {
      e.preventDefault();
      const cur = $('pw-cur').value, nw = $('pw-new').value, nw2 = $('pw-new2').value;
      if (!cur) { toast('Enter your current password.'); $('pw-cur').focus(); return; }
      if (nw.length < 8) { toast('New password must be at least 8 characters.'); $('pw-new').focus(); return; }
      if (nw !== nw2) { toast('The new passwords don’t match.'); $('pw-new2').focus(); return; }
      if (nw === cur) { toast('Choose a password different from your current one.'); return; }
      const btn = $('pw-save'); btn.disabled = true;
      try {
        await reauthenticateWithCredential(me, EmailAuthProvider.credential(me.email, cur));
        await updatePassword(me, nw);
        $('pw').reset(); toast('Password changed');
      } catch (x) {
        const c = x && x.code || '';
        toast(/wrong-password|invalid-credential|invalid-login/.test(c) ? 'Your current password is not correct.' :
          /too-many-requests/.test(c) ? 'Too many tries. Please wait a few minutes and try again.' : friendlyError(x));
      } finally { btn.disabled = false; }
    };
    $('pw-reset').onclick = async () => {
      const b = $('pw-reset'); b.disabled = true;
      try { await fetch(BACKEND, { method: 'POST', body: new URLSearchParams({ action: 'forgot', email: me.email }) }); toast('Reset link sent to ' + me.email + ' (check spam too)'); }
      catch (x) { toast('Could not send the email. Please try again.'); b.disabled = false; }
    };
  }
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
  const [pkgs, sessions] = await Promise.all([list('packages', 'clientUid', who.uid), list('sessions', 'clientUid', who.uid)]);
  sessions.sort(byDate);
  const now = localNow();
  const active = pkgs.filter((p) => p.status !== 'cancelled');
  let html = header('My training') + tabsHtml();
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
  wireTabs();
}

/* ---------------- Coach ---------------- */
async function renderCoach() {
  const [pkgs, sessions] = await Promise.all([list('packages', 'coachId', profile.coachId), list('sessions', 'coachId', profile.coachId)]);
  sessions.sort(byDate);
  const active = pkgs.filter((p) => p.status !== 'cancelled');
  const now = localNow();
  const upcoming = sessions.filter((s) => s.status === 'scheduled' && (s.date || '') >= now);
  let html = header('Coach dashboard') + tabsHtml();
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
  wireTabs();

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
        toast('Session scheduled'); route();
      } catch (x) { toast(friendlyError(x)); }
    };
  });
  const setStatus = async (id, status) => {
    try { await updateDoc(doc(db, 'sessions', id), { status, updatedAt: serverTimestamp(), updatedBy: me.uid }); toast('Updated'); route(); }
    catch (x) { toast(friendlyError(x)); }
  };
  app.querySelectorAll('[data-done]').forEach((b) => { b.onclick = () => setStatus(b.dataset.done, 'done'); });
  app.querySelectorAll('[data-undo]').forEach((b) => { b.onclick = () => setStatus(b.dataset.undo, 'scheduled'); });
  app.querySelectorAll('[data-cancel]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('Cancel this session? It will be removed.')) return;
      try { await deleteDoc(doc(db, 'sessions', b.dataset.cancel)); toast('Session removed'); route(); }
      catch (x) { toast(friendlyError(x)); }
    };
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.replace('login.html');
  me = user; $('logout').hidden = false;
  try {
    profile = (await ensureProfile(user)).profile;
    who = { uid: user.uid, email: user.email, name: user.displayName };
    const as = new URLSearchParams(location.search).get('as');
    if (as && isOwner(user)) { // super admin "View as"
      const snap = await getDoc(doc(db, 'users', as));
      if (!snap.exists()) { app.innerHTML = '<p class="err">That account no longer exists.</p><p><a href="admin.html">Back to admin</a></p>'; return; }
      profile = { id: snap.id, ...snap.data() };
      if (profile.role === 'admin' && !profile.coachId) { location.replace('admin.html?as=' + encodeURIComponent(as)); return; }
      who = { uid: snap.id, email: profile.email, name: profile.name };
      viewing = true;
    }
    const role = viewing ? (profile.status !== 'active' ? 'blocked' : profile.role || 'client') : roleOf(user, profile);
    if (role === 'blocked') {
      app.innerHTML = (viewing ? '<div class="viewas"><span>Viewing as <strong>' + esc(profile.name || who.email) + '</strong> – this account is inactive.</span><a href="admin.html">Back to admin</a></div>' : '') +
        '<h1>Account paused</h1><p>Your account is not active. Contact OwnFit on <a href="https://wa.me/971525700118">WhatsApp</a>.</p>';
      return;
    }
    // Trainers, and admins the super admin has also made a trainer, get the trainer dashboard
    if ((role === 'coach' || role === 'admin') && profile.coachId) { mainLabel = 'My sessions'; renderMain = renderCoach; }
    else { mainLabel = 'My training'; renderMain = renderClient; }
    // Name and mobile are required: finish the profile before anything else
    if (!viewing && !profileComplete(user, profile)) { renderComplete(role); return; }
    await route();
  } catch (x) {
    app.innerHTML = '<p class="err">' + esc(friendlyError(x)) + '</p>';
  }
});
