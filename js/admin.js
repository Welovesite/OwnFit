import {
  auth, db, $, esc, onAuthStateChanged, signOut, ensureProfile, roleOf, isOwner, fmtDate, remaining, friendlyError,
  backend, SHEET_URL, OWNER_EMAIL, PERMS, ALL_PERMS, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  serverTimestamp, writeBatch, query, where
} from './fb.js';
import { renderInsights } from './insights.js';

const app = $('app');
const SERVICES = { 'personal-training': 'Personal Training', boxing: 'Boxing', kickboxing: 'Kickboxing', 'muay-thai': 'Muay Thai' };
let me = null, users = [], coaches = [], packages = [], sessions = [], current = null;
// SUPER = signed in as the super admin and not previewing another admin.
// perms = what the current view may use; viewAs = the admin being previewed (super admin only).
let SUPER = false, perms = {}, viewAs = null;
const can = (p) => !!perms[p];

function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 3500); }
$('logout').onclick = async () => { await signOut(auth); location.replace('login.html'); };

async function all(col) { return (await getDocs(collection(db, col))).docs.map((d) => ({ id: d.id, ...d.data() })); }
async function loadAll() {
  const people = can('users') || can('sessions');
  [users, coaches, packages, sessions] = await Promise.all([
    people ? all('users') : [], all('coaches'), people ? all('packages') : [], people ? all('sessions') : []]);
  users = users.filter((u) => u.email !== OWNER_EMAIL); // the super admin never appears in lists
  users.sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email)));
  coaches.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.name).localeCompare(String(b.name)));
}
const coachName = (id) => (coaches.find((c) => c.id === id) || {}).name || id || '';
const userLabel = (u) => (u.name ? u.name + ' — ' : '') + u.email;

function shell() {
  const tabs = [['users', 'Users & access', 'users'], ['packages', 'Sessions & packages', 'sessions'], ['coaches', 'Coaches', 'coaches'], ['bookings', 'Bookings', 'bookings']]
    .filter((t) => can(t[2]));
  if (SUPER) tabs.push(['insights', 'Visitors', 'insights']); // super admin only
  if (!tabs.some((t) => t[0] === current)) current = tabs.length ? tabs[0][0] : null;
  const banner = viewAs ? '<div class="viewas"><span>Viewing as <strong>' + esc(viewAs.name || viewAs.email) + '</strong> (admin) – this is exactly what they see.</span>' +
    '<a href="admin.html">Back to my admin</a></div>' : '';
  const who = viewAs || { email: me.email };
  app.innerHTML = banner + '<div class="who"><div><span class="label">' + (SUPER ? 'Super admin' : 'Admin') + '</span><h1>OwnFit admin</h1><p class="muted small">' + esc(who.email) + '</p></div>' +
    (viewAs ? '' : '<a class="btn btn-line" href="account.html">My account view</a>') + '</div>' +
    (tabs.length ? '<div class="tabs" role="tablist" style="margin-bottom:24px">' + tabs.map(([k, l]) =>
      '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + (k === current) + '">' + l + '</button>').join('') + '</div>' +
      '<div id="panel"></div>'
      : '<div class="card"><h2>No access yet</h2><p>Your admin account has no areas switched on. Ask the super admin to give you access.</p></div>');
  app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { current = b.dataset.tab; shell(); }; });
  if (current) ({ users: renderUsers, packages: renderPackages, coaches: renderCoaches, bookings: renderBookings, insights: () => renderInsights($('panel'), coaches) })[current]();
}

/* ======================= Users & access ======================= */
function renderUsers() {
  const coachOpts = (sel) => '<option value="">—</option>' + coaches.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('');
  const opt = (v, l, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>';
  const rows = users.map((u) => {
    const isAdm = u.role === 'admin', locked = isAdm && !SUPER; // only the super admin can change admins
    const pk = packages.filter((p) => p.clientUid === u.id && p.status !== 'cancelled').length;
    const permText = isAdm ? '<br><span class="small muted">' + (PERMS.filter(([k]) => (u.perms || {})[k]).map(([, l]) => l).join(', ') || 'No access') + '</span>' : '';
    return '<tr data-uid="' + esc(u.id) + '"><td><strong>' + esc(u.name || '—') + '</strong><br><span class="small muted">' + esc(u.email) + '</span>' +
      (u.phone ? '<br><span class="small muted">' + esc(u.phone) + '</span>' : '') + '</td>' +
      '<td>' + (locked ? '<span class="pill admin">admin</span>' :
        '<select data-f="role">' + opt('client', 'Client', u.role) + opt('coach', 'Coach', u.role) + (SUPER ? opt('admin', 'Admin', u.role) : '') + '</select>') + permText + '</td>' +
      '<td>' + (isAdm ? '' : '<select data-f="coachId">' + coachOpts(u.coachId) + '</select>') + '</td>' +
      '<td>' + (locked ? '<span class="pill ' + (u.status === 'blocked' ? 'blocked' : 'client') + '">' + (u.status === 'blocked' ? 'inactive' : 'active') + '</span>'
        : '<select data-f="status">' + opt('active', 'Active', u.status === 'blocked' ? '' : 'active') + opt('blocked', 'Inactive', u.status) + '</select>') + '</td>' +
      '<td>' + pk + '</td><td class="small muted">' + esc(u.provider === 'google.com' ? 'Google' : 'Email') + '</td>' +
      (SUPER ? '<td><span class="row" style="gap:6px;flex-wrap:nowrap">' +
        '<button class="btn btn-line btn-sm" data-login="' + esc(u.id) + '">Login</button>' +
        (isAdm ? '<button class="btn btn-line btn-sm" data-perm="' + esc(u.id) + '">Access</button>' : '') +
        '<a class="btn btn-line btn-sm" href="' + (isAdm ? 'admin.html' : 'account.html') + '?as=' + encodeURIComponent(u.id) + '">View as</a>' +
        '<button class="link small" data-deluser="' + esc(u.id) + '">Delete</button></span></td>' : '') + '</tr>';
  }).join('');
  const addForm = SUPER ? '<details class="card" id="add-acc" style="margin-bottom:22px"' + (addOpen ? ' open' : '') + '><summary style="cursor:pointer;font-weight:700">+ Add account (email &amp; password)</summary>' +
    '<form id="acc-form" style="margin-top:16px"><div class="grid2">' +
    '<div class="field"><label for="a-name">Full name</label><input id="a-name" maxlength="80" required></div>' +
    '<div class="field"><label for="a-email">Email (their login)</label><input id="a-email" type="email" required autocomplete="off"></div>' +
    '<div class="field"><label for="a-phone">Mobile (optional)</label><input id="a-phone" maxlength="30" dir="ltr"></div>' +
    '<div class="field"><label for="a-role">Role</label><select id="a-role"><option value="client">Customer</option><option value="coach">Trainer</option><option value="admin">Admin</option></select></div>' +
    '<div class="field" id="a-coach-wrap" hidden><label for="a-coach">Trainer profile</label><select id="a-coach">' + coachOpts('') + '</select></div>' +
    '<div class="field"><label for="a-pass">Password</label><div class="row" style="gap:8px;flex-wrap:nowrap"><input id="a-pass" type="text" minlength="8" maxlength="64" required autocomplete="off" dir="ltr" style="flex:1"><button type="button" class="btn btn-line btn-sm" id="a-gen">Generate</button></div></div>' +
    '</div><p class="small muted">No email is sent. After creating, you’ll see the login to send them, and a “Send welcome email” button if you want one.</p>' +
    '<button class="btn btn-red" type="submit" id="a-submit">Create account</button></form><div id="acc-result"></div></details>' : '';
  $('panel').innerHTML = addForm + '<p class="muted">Everyone who signs in appears here as a <strong>client</strong>. To give a trainer their dashboard, set Role = Coach and link them to their coach profile. Inactive users can’t see anything.' +
    (SUPER ? ' As super admin you can make admins, choose what each admin can access, view any account as that person, and delete accounts.' : '') + '</p>' +
    '<div class="table-wrap"><table class="t"><thead><tr><th>User</th><th>Role</th><th>Coach profile (for coaches)</th><th>Access</th><th>Packages</th><th>Login</th>' + (SUPER ? '<th></th>' : '') + '</tr></thead><tbody>' +
    (rows || '<tr><td colspan="7" class="muted">No users yet.</td></tr>') + '</tbody></table></div><div id="u-detail" style="margin-top:24px"></div>';
  $('panel').querySelectorAll('select[data-f]').forEach((s) => {
    s.onchange = async () => {
      const uid = s.closest('tr').dataset.uid, f = s.dataset.f, u = users.find((x) => x.id === uid);
      const patch = { [f]: s.value || null };
      if (f === 'role' && s.value === 'admin' && !u.perms) patch.perms = ALL_PERMS;
      if (f === 'role' && s.value === 'coach' && !u.coachId) toast('Now pick which coach profile this person is.');
      try {
        await updateDoc(doc(db, 'users', uid), patch); Object.assign(u, patch); toast('Saved');
        if (f === 'role') { renderUsers(); if (s.value === 'admin') editPerms(uid); }
      } catch (x) { toast(friendlyError(x)); }
    };
  });
  $('panel').querySelectorAll('[data-perm]').forEach((b) => { b.onclick = () => editPerms(b.dataset.perm); });
  $('panel').querySelectorAll('[data-deluser]').forEach((b) => { b.onclick = () => deleteUser(b.dataset.deluser); });
  $('panel').querySelectorAll('[data-login]').forEach((b) => { b.onclick = () => loginPanel(b.dataset.login); });
  if (SUPER) wireAddAccount();
}

/* ---- Super admin: accounts & passwords (passwords can be SET, never read) ---- */
let addOpen = false;
function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', a = new Uint32Array(10);
  crypto.getRandomValues(a);
  return [...a].map((n) => chars[n % chars.length]).join('');
}
function loginCard(title, email, pw, uid) {
  const text = 'OwnFit login\nWebsite: https://ownfit.ae/login.html\nEmail: ' + email + '\nPassword: ' + pw;
  return '<div class="card hot" style="margin-top:16px"><h3>' + esc(title) + '</h3>' +
    '<p style="font-family:monospace;white-space:pre-line;margin:8px 0">Email: ' + esc(email) + '\nPassword: ' + esc(pw) + '</p>' +
    '<p class="small muted">Copy this now – the password is not saved anywhere and can’t be shown again (you can always set a new one).</p>' +
    '<div class="row"><button type="button" class="btn btn-line btn-sm" data-copy="' + esc(text) + '">Copy login</button>' +
    '<a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text) + '">Send on WhatsApp</a>' +
    (uid ? '<button type="button" class="btn btn-red btn-sm" data-welcome="' + esc(uid) + '">Send welcome email</button>' : '') + '</div></div>';
}
function wireCards(root) {
  root.querySelectorAll('[data-copy]').forEach((b) => {
    b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copied'); } catch (x) { toast('Copy failed – select the text instead.'); } };
  });
  root.querySelectorAll('[data-welcome]').forEach((b) => {
    b.onclick = async () => {
      b.disabled = true; b.textContent = 'Sending…';
      try { const r = await backend('sendWelcome', { uid: b.dataset.welcome }); if (!r.ok) throw new Error(r.error); b.textContent = 'Welcome email sent'; toast('Welcome email sent to ' + r.email); }
      catch (x) { b.disabled = false; b.textContent = 'Send welcome email'; toast(friendlyError(x)); }
    };
  });
}
function wireAddAccount() {
  const role = $('a-role'), wrap = $('a-coach-wrap');
  $('add-acc').ontoggle = () => { addOpen = $('add-acc').open; };
  role.onchange = () => { wrap.hidden = role.value !== 'coach'; };
  $('a-gen').onclick = () => { $('a-pass').value = genPassword(); };
  $('acc-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = $('a-name').value.trim(), email = $('a-email').value.trim().toLowerCase(), pw = $('a-pass').value;
    const r = role.value, coachId = $('a-coach').value, phone = $('a-phone').value.trim();
    if (name.length < 2) return toast('Add their name.');
    if (pw.length < 8) return toast('Password must be at least 8 characters.');
    if (r === 'coach' && !coachId) return toast('Pick which trainer profile this person is.');
    $('a-submit').disabled = true; $('a-submit').textContent = 'Creating…';
    try {
      const res = await backend('createUser', { name, email, password: pw });
      if (!res.ok) throw new Error(res.error || 'Could not create the account');
      const profile = { email: res.email, name, phone, role: r, status: 'active', provider: 'password', createdAt: serverTimestamp(), createdBy: 'super-admin' };
      if (r === 'coach') profile.coachId = coachId;
      if (r === 'admin') profile.perms = ALL_PERMS;
      await setDoc(doc(db, 'users', res.uid), profile);
      await loadAll(); addOpen = true; renderUsers();
      $('acc-result').innerHTML = loginCard('Account created for ' + name, res.email, pw, res.uid) +
        (r === 'admin' ? '<p class="small muted">Admins start with all four areas on – press “Access” on their row to change that.</p>' : '');
      wireCards($('acc-result'));
      toast('Account created');
    } catch (x) { toast(friendlyError(x)); }
    finally { if ($('a-submit')) { $('a-submit').disabled = false; $('a-submit').textContent = 'Create account'; } }
  };
}
async function loginPanel(uid) {
  const u = users.find((x) => x.id === uid); if (!u || !SUPER) return;
  $('u-detail').innerHTML = '<div class="card hot"><p class="muted"><span class="spinner"></span> Loading login details…</p></div>';
  $('u-detail').scrollIntoView({ behavior: 'smooth' });
  let info = {};
  try { info = await backend('accountInfo', { uid }); if (!info.ok) throw new Error(info.error); }
  catch (x) { $('u-detail').innerHTML = '<div class="card hot"><p class="err">' + esc(friendlyError(x)) + '</p></div>'; return; }
  const methods = (info.providers || []).map((p) => (p === 'google.com' ? 'Google' : p === 'password' ? 'Email & password' : p)).join(', ') || 'Email & password';
  $('u-detail').innerHTML = '<div class="card hot"><h2>Login for ' + esc(u.name || info.email) + '</h2>' +
    '<p><strong>Login email:</strong> <span dir="ltr">' + esc(info.email) + '</span><br><strong>Signs in with:</strong> ' + esc(methods) +
    (info.lastLogin ? '<br><strong>Last login:</strong> ' + esc(fmtDate(info.lastLogin)) : '') + '</p>' +
    '<p class="small muted">Passwords are stored scrambled, so nobody (not even you) can read a current password. You can set a new one or send a reset link.</p>' +
    '<form id="pw-form" class="row" style="align-items:flex-end"><div class="field" style="flex:1;min-width:220px"><label for="pw-new">New password</label>' +
    '<input id="pw-new" type="text" minlength="8" maxlength="64" required autocomplete="off" dir="ltr"></div>' +
    '<button type="button" class="btn btn-line btn-sm" id="pw-gen">Generate</button><button class="btn btn-red" type="submit" id="pw-save">Set new password</button></form>' +
    (methods.indexOf('Google') > -1 && methods.indexOf('Email') < 0 ? '<p class="small muted">This person signs in with Google. Setting a password lets them also sign in with email &amp; password.</p>' : '') +
    '<div class="row" style="margin-top:14px"><button type="button" class="btn btn-line btn-sm" id="pw-reset">Send password reset email</button>' +
    '<button type="button" class="btn btn-line btn-sm" data-welcome="' + esc(uid) + '">' + (info.welcomed ? 'Send welcome email again' : 'Send welcome email') + '</button>' +
    '<button type="button" class="btn btn-line btn-sm" id="pw-close">Close</button></div><div id="pw-result"></div></div>';
  wireCards($('u-detail'));
  $('pw-gen').onclick = () => { $('pw-new').value = genPassword(); };
  $('pw-close').onclick = () => { $('u-detail').innerHTML = ''; };
  $('pw-form').onsubmit = async (e) => {
    e.preventDefault();
    const pw = $('pw-new').value;
    if (pw.length < 8) return toast('Password must be at least 8 characters.');
    if (!confirm('Set a new password for ' + (u.name || info.email) + '? Their old password stops working.')) return;
    $('pw-save').disabled = true;
    try {
      const r = await backend('setPassword', { uid, password: pw }); if (!r.ok) throw new Error(r.error);
      $('pw-result').innerHTML = loginCard('New password set', info.email, pw, null); wireCards($('pw-result')); $('pw-new').value = '';
      toast('Password changed');
    } catch (x) { toast(friendlyError(x)); }
    finally { $('pw-save').disabled = false; }
  };
  $('pw-reset').onclick = async () => {
    const b = $('pw-reset'); b.disabled = true; b.textContent = 'Sending…';
    try { const r = await backend('sendReset', { uid }); if (!r.ok) throw new Error(r.error); b.textContent = 'Reset email sent'; toast('Reset link sent to ' + r.email); }
    catch (x) { b.disabled = false; b.textContent = 'Send password reset email'; toast(friendlyError(x)); }
  };
}

// Super admin: choose which areas an admin can open
function editPerms(uid) {
  const u = users.find((x) => x.id === uid); if (!u || !SUPER) return;
  const p = u.perms || {};
  $('u-detail').innerHTML = '<form id="perm-form" class="card hot"><h2>Access for ' + esc(u.name || u.email) + '</h2>' +
    '<p class="muted">Tick what this admin can see and change. Admins can never delete anything and can’t change other admins.</p>' +
    '<div class="checks">' + PERMS.map(([k, l]) => '<label><input type="checkbox" name="perm" value="' + k + '"' + (p[k] ? ' checked' : '') + '> ' + l + '</label>').join('') + '</div>' +
    '<div class="row" style="margin-top:14px"><button class="btn btn-red" type="submit">Save access</button><button type="button" class="btn btn-line" id="perm-close">Close</button></div></form>';
  $('perm-close').onclick = () => { $('u-detail').innerHTML = ''; };
  $('perm-form').onsubmit = async (e) => {
    e.preventDefault();
    const next = {}; PERMS.forEach(([k]) => { next[k] = !!document.querySelector('input[name=perm][value="' + k + '"]:checked'); });
    try { await updateDoc(doc(db, 'users', uid), { perms: next }); u.perms = next; toast('Access saved'); renderUsers(); }
    catch (x) { toast(friendlyError(x)); }
  };
  $('u-detail').scrollIntoView({ behavior: 'smooth' });
}

// Super admin: remove an account, its packages and sessions, and its login
async function deleteUser(uid) {
  const u = users.find((x) => x.id === uid); if (!u || !SUPER) return;
  const pk = packages.filter((p) => p.clientUid === uid), ss = sessions.filter((s) => s.clientUid === uid);
  const typed = prompt('Delete ' + (u.name || u.email) + '?\n\nThis removes the account, ' + pk.length + ' package(s) and ' + ss.length + ' session(s). It cannot be undone.\n\nType DELETE to confirm.');
  if (typed !== 'DELETE') return toast('Nothing deleted.');
  try {
    const b = writeBatch(db);
    ss.forEach((s) => b.delete(doc(db, 'sessions', s.id)));
    pk.forEach((p) => b.delete(doc(db, 'packages', p.id)));
    b.delete(doc(db, 'users', uid));
    await b.commit();
    let login = '';
    try { const r = await backend('deleteUser', { uid }); login = r && r.ok ? ' and their login' : ' (their login could not be removed: ' + ((r && r.error) || 'unknown') + ')'; }
    catch (x) { login = ' (their login could not be removed)'; }
    await loadAll(); renderUsers(); toast('Deleted the account' + login + '.');
  } catch (x) { toast(friendlyError(x)); }
}

/* ======================= Packages & sessions ======================= */
function renderPackages() {
  const clients = users.filter((u) => u.status !== 'blocked');
  const form = '<form id="pkg-form" class="card" style="margin-bottom:26px"><h2>Assign a paid package</h2>' +
    '<div class="grid2">' +
    '<div class="field"><label for="p-client">Client</label><select id="p-client" required><option value="">Choose client…</option>' +
      clients.map((u) => '<option value="' + esc(u.id) + '">' + esc(userLabel(u)) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="p-coach">Coach</label><select id="p-coach" required><option value="">Choose coach…</option>' +
      coaches.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="p-plan">Package</label><select id="p-plan"><option value="12|3500">12 sessions – AED 3,500</option><option value="16|4200">16 sessions – AED 4,200</option><option value="24|6000">24 sessions – AED 6,000</option><option value="custom">Custom…</option></select></div>' +
    '<div class="field"><label for="p-total">Sessions</label><input id="p-total" type="number" min="1" max="200" value="12"></div>' +
    '<div class="field"><label for="p-amount">Amount paid (AED)</label><input id="p-amount" type="number" min="0" value="3500"></div>' +
    '<div class="field"><label for="p-start">Start date</label><input id="p-start" type="date"></div>' +
    '</div><div class="field"><label for="p-notes">Notes (only admin & coach see this)</label><input id="p-notes" maxlength="200"></div>' +
    '<label class="checks"><label><input type="checkbox" id="p-paid" checked> Paid</label></label>' +
    '<p class="small muted">Client not in the list? Ask them to create an account at ownfit.ae/login.html first.</p>' +
    '<button class="btn btn-red" type="submit">Assign package</button></form>';
  const rows = packages.slice().sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || ''))).map((p) => {
    const r = remaining(p, sessions);
    return '<tr data-id="' + esc(p.id) + '"><td><strong>' + esc(p.clientName) + '</strong><br><span class="small muted">' + esc(p.clientEmail || '') + '</span></td>' +
      '<td><select data-f="coachId">' + coaches.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === p.coachId ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></td>' +
      '<td>' + esc(p.title || p.total + ' sessions') + '<br><span class="small muted">' + r.done + ' done · ' + r.left + ' left</span></td>' +
      '<td><select data-f="paid"><option value="1"' + (p.paid ? ' selected' : '') + '>Paid</option><option value="0"' + (!p.paid ? ' selected' : '') + '>Unpaid</option></select></td>' +
      '<td><select data-f="status"><option value="active"' + (p.status !== 'cancelled' ? ' selected' : '') + '>Active</option><option value="cancelled"' + (p.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option></select></td>' +
      '<td><span class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn btn-line btn-sm" data-open="' + esc(p.id) + '">Sessions</button>' +
      (SUPER ? '<button class="link small" data-delpkg="' + esc(p.id) + '">Delete</button>' : '') + '</span></td></tr>';
  }).join('');
  $('panel').innerHTML = form + '<h2>All packages</h2><div class="table-wrap"><table class="t"><thead><tr><th>Client</th><th>Coach</th><th>Package</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="6" class="muted">No packages yet.</td></tr>') + '</tbody></table></div><div id="pkg-detail" style="margin-top:24px"></div>';

  $('p-plan').onchange = () => {
    const v = $('p-plan').value; if (v === 'custom') return;
    const [n, a] = v.split('|'); $('p-total').value = n; $('p-amount').value = a;
  };
  $('p-start').value = new Date().toISOString().slice(0, 10);
  $('pkg-form').onsubmit = async (e) => {
    e.preventDefault();
    const u = users.find((x) => x.id === $('p-client').value), c = coaches.find((x) => x.id === $('p-coach').value);
    const total = parseInt($('p-total').value, 10);
    if (!u || !c || !(total > 0)) return toast('Choose a client, a coach and the number of sessions.');
    try {
      await addDoc(collection(db, 'packages'), {
        clientUid: u.id, clientName: u.name || u.email, clientEmail: u.email, clientPhone: u.phone || '',
        coachId: c.id, coachName: c.name, total, title: total + ' sessions',
        amount: Number($('p-amount').value) || 0, paid: $('p-paid').checked, startDate: $('p-start').value,
        notes: $('p-notes').value.trim(), status: 'active', createdAt: serverTimestamp(), createdBy: me.uid
      });
      toast('Package assigned to ' + (u.name || u.email));
      await loadAll(); renderPackages();
    } catch (x) { toast(friendlyError(x)); }
  };
  $('panel').querySelectorAll('tr[data-id] select').forEach((s) => {
    s.onchange = async () => {
      const id = s.closest('tr').dataset.id, f = s.dataset.f;
      const patch = f === 'paid' ? { paid: s.value === '1' } : f === 'coachId' ? { coachId: s.value, coachName: coachName(s.value) } : { [f]: s.value };
      try {
        await updateDoc(doc(db, 'packages', id), patch);
        if (f === 'coachId') { // move this package's sessions to the new coach too
          const b = writeBatch(db);
          sessions.filter((x) => x.packageId === id).forEach((x) => b.update(doc(db, 'sessions', x.id), { coachId: s.value, coachName: coachName(s.value) }));
          await b.commit();
        }
        await loadAll(); toast('Saved');
      } catch (x) { toast(friendlyError(x)); }
    };
  });
  $('panel').querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => openPackage(b.dataset.open); });
  $('panel').querySelectorAll('[data-delpkg]').forEach((b) => {
    b.onclick = async () => {
      const p = packages.find((x) => x.id === b.dataset.delpkg); if (!p || !SUPER) return;
      const ss = sessions.filter((s) => s.packageId === p.id);
      if (!confirm('Delete ' + (p.clientName || '') + '’s ' + (p.title || 'package') + ' and its ' + ss.length + ' session(s)? This cannot be undone.')) return;
      try {
        const wb = writeBatch(db);
        ss.forEach((s) => wb.delete(doc(db, 'sessions', s.id))); wb.delete(doc(db, 'packages', p.id));
        await wb.commit(); await loadAll(); renderPackages(); toast('Package deleted');
      } catch (x) { toast(friendlyError(x)); }
    };
  });
}

function openPackage(id) {
  const p = packages.find((x) => x.id === id); if (!p) return;
  const list = sessions.filter((s) => s.packageId === id).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const r = remaining(p, sessions);
  $('pkg-detail').innerHTML = '<section class="card hot"><h2>' + esc(p.clientName) + ' · ' + esc(p.title) + '</h2>' +
    '<p class="muted">' + r.done + ' done, ' + r.left + ' left · Coach ' + esc(p.coachName) + '</p>' +
    '<form class="row" id="s-add"><div class="field" style="flex:1;min-width:200px"><label>Add session</label><input type="datetime-local" id="s-date" required></div>' +
    '<div class="field"><label>Status</label><select id="s-status"><option value="scheduled">Scheduled</option><option value="done">Done</option></select></div>' +
    '<button class="btn btn-red" type="submit">Add</button></form>' +
    '<ul class="list">' + (list.map((s) => '<li><span>' + (s.date ? fmtDate(s.date) : 'No date') + (s.note ? ' · <span class="muted">' + esc(s.note) + '</span>' : '') + '</span>' +
      '<span class="row"><select data-sid="' + esc(s.id) + '"><option value="scheduled"' + (s.status === 'scheduled' ? ' selected' : '') + '>Scheduled</option><option value="done"' + (s.status === 'done' ? ' selected' : '') + '>Done</option><option value="cancelled"' + (s.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option></select>' +
      (SUPER ? '<button class="link small" data-del="' + esc(s.id) + '">Delete</button>' : '') + '</span></li>').join('') || '<li class="muted">No sessions yet.</li>') + '</ul></section>';
  $('s-add').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'sessions'), { packageId: p.id, clientUid: p.clientUid, clientName: p.clientName, coachId: p.coachId, coachName: p.coachName,
        date: $('s-date').value, note: '', status: $('s-status').value, createdAt: serverTimestamp(), updatedBy: me.uid });
      await loadAll(); renderPackages(); openPackage(id); toast('Session added');
    } catch (x) { toast(friendlyError(x)); }
  };
  $('pkg-detail').querySelectorAll('[data-sid]').forEach((s) => {
    s.onchange = async () => { try { await updateDoc(doc(db, 'sessions', s.dataset.sid), { status: s.value, updatedBy: me.uid }); await loadAll(); renderPackages(); openPackage(id); toast('Saved'); } catch (x) { toast(friendlyError(x)); } };
  });
  $('pkg-detail').querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = async () => { if (!confirm('Delete this session?')) return; try { await deleteDoc(doc(db, 'sessions', b.dataset.del)); await loadAll(); renderPackages(); openPackage(id); } catch (x) { toast(friendlyError(x)); } };
  });
  $('pkg-detail').scrollIntoView({ behavior: 'smooth' });
}

/* ======================= Coaches ======================= */
const LISTS = ['certifications', 'languages', 'areas', 'specialties'];
const PARAS = ['bio', 'highlights'];
const TEXTS = [['name', 'Name'], ['gender', 'Shown as (e.g. Female / Male)'], ['headline', 'Headline'], ['experience', 'Experience (e.g. 8 years)']];

function renderCoaches() {
  const cards = coaches.map((c) => '<div class="card"><div class="row" style="justify-content:space-between"><div><h3>' + esc(c.name) + '</h3>' +
    '<span class="small muted">' + esc((c.services || []).map((s) => SERVICES[s] || s).join(' · ')) + '</span></div>' +
    '<span class="pill ' + (c.published ? 'done' : 'cancelled') + '">' + (c.published ? 'On website' : 'Hidden') + '</span></div>' +
    '<div class="row"><button class="btn btn-line btn-sm" data-edit="' + esc(c.id) + '">Edit</button></div></div>').join('');
  $('panel').innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:16px">' +
    '<p class="muted" style="margin:0;max-width:640px">Edit coaches here, then press <strong>Publish to website</strong>. Nothing changes on ownfit.ae until you publish.</p>' +
    '<div class="row"><button class="btn btn-line" id="c-new">Add coach</button><button class="btn btn-red" id="c-pub">Publish to website</button></div></div>' +
    (coaches.length ? '' : '<div class="note" style="margin-bottom:16px">No coaches in the admin yet. <button class="link" id="c-import">Import the 3 current website coaches</button> to start.</div>') +
    '<div class="grid2">' + cards + '</div><div id="c-edit" style="margin-top:26px"></div>';
  $('c-new').onclick = () => editCoach(null);
  $('c-pub').onclick = publish;
  if ($('c-import')) $('c-import').onclick = importCurrent;
  $('panel').querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => editCoach(b.dataset.edit); });
}

async function importCurrent() {
  const src = (window.OWNFIT && window.OWNFIT.coaches) || [];
  try {
    const b = writeBatch(db);
    src.forEach((c, i) => b.set(doc(db, 'coaches', c.id), { ...JSON.parse(JSON.stringify(c)), published: true, order: i, updatedAt: serverTimestamp() }));
    await b.commit(); await loadAll(); renderCoaches(); toast('Imported ' + src.length + ' coaches');
  } catch (x) { toast(friendlyError(x)); }
}

const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 40);
const lines = (v) => String(v || '').split('\n').map((x) => x.trim()).filter(Boolean);
const commas = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

function editCoach(id) {
  const c = id ? JSON.parse(JSON.stringify(coaches.find((x) => x.id === id))) : { services: [], gallery: [], videos: [], published: false, order: coaches.length };
  c.gallery = c.gallery || []; c.videos = c.videos || [];
  const pair = (f, label, area) => '<div class="grid2">' +
    ['', '_ar'].map((sfx) => '<div class="field"><label for="ce-' + f + sfx + '">' + label + (sfx ? ' (Arabic)' : '') + '</label>' +
      (area ? '<textarea id="ce-' + f + sfx + '"' + (sfx ? ' dir="rtl"' : '') + '>' : '<input id="ce-' + f + sfx + '"' + (sfx ? ' dir="rtl"' : '') + ' value="') +
      esc(area ? (c[f + sfx] || []).join(area === 'lines' ? '\n' : ', ') : (c[f + sfx] || '')) + (area ? '</textarea>' : '">') + '</div>').join('') + '</div>';
  $('c-edit').innerHTML = '<form id="ce" class="card hot stack"><h2>' + (id ? 'Edit ' + esc(c.name) : 'New coach') + '</h2>' +
    '<fieldset><legend>Photo</legend><div class="row"><img class="photo-prev" id="ce-photo-prev" alt="" src="' + esc(c.photo && !/^media:/.test(c.photo) ? c.photo : '') + '">' +
    '<div class="field"><label for="ce-photo">Upload main photo (portrait)</label><input type="file" id="ce-photo" accept="image/*"></div></div></fieldset>' +
    '<fieldset><legend>Basics</legend>' + TEXTS.map(([f, l]) => pair(f, l)).join('') +
    '<div class="field"><label>Services</label><div class="checks">' + Object.entries(SERVICES).map(([k, l]) =>
      '<label><input type="checkbox" name="svc" value="' + k + '"' + ((c.services || []).includes(k) ? ' checked' : '') + '> ' + l + '</label>').join('') + '</div></div>' +
    '<div class="checks"><label><input type="checkbox" id="ce-featured"' + (c.featured ? ' checked' : '') + '> Featured on home page</label>' +
    '<label><input type="checkbox" id="ce-published"' + (c.published ? ' checked' : '') + '> Show on website</label></div></fieldset>' +
    '<fieldset><legend>Details</legend><p class="small muted">Lists: separate with commas. Paragraphs and bullet points: one per line.</p>' +
    LISTS.map((f) => pair(f, f[0].toUpperCase() + f.slice(1), 'commas')).join('') +
    pair('bio', 'About (one paragraph per line)', 'lines') + pair('highlights', 'Coaching experience (one point per line)', 'lines') +
    '<div class="field"><label for="ce-ach">Achievements – one per line: Title | Arabic title | Year | Place (1, 2, 3 or 0) | Emoji (optional, picked automatically if empty)</label><textarea id="ce-ach">' +
      esc((c.achievements || []).map((a) => [a.text, a.text_ar || '', a.year || '', a.place ?? 0].concat(a.emoji ? [a.emoji] : []).join(' | ')).join('\n')) + '</textarea></div></fieldset>' +
    '<fieldset><legend>Photo gallery</legend><div class="thumbs" id="ce-gal"></div><div class="field"><label for="ce-gal-add">Add photos</label><input type="file" id="ce-gal-add" accept="image/*" multiple></div></fieldset>' +
    '<fieldset><legend>Videos</legend><ul class="list" id="ce-vids"></ul>' +
    '<div class="grid2"><div class="field"><label for="ce-v-title">Video title</label><input id="ce-v-title"></div><div class="field"><label for="ce-v-title-ar">Video title (Arabic)</label><input id="ce-v-title-ar" dir="rtl"></div></div>' +
    '<div class="grid2"><div class="field"><label for="ce-v-file">Upload video (MP4, up to 40 MB)</label><input type="file" id="ce-v-file" accept="video/*"></div>' +
    '<div class="field"><label for="ce-v-yt">…or YouTube link</label><input id="ce-v-yt" placeholder="https://youtu.be/…"></div></div>' +
    '<label class="checks"><label><input type="checkbox" id="ce-v-portrait" checked> Vertical (phone) video</label></label>' +
    '<button type="button" class="btn btn-line" id="ce-v-add">Add video</button> <span id="ce-v-busy" class="muted small"></span></fieldset>' +
    '<div class="row"><button class="btn btn-red" type="submit">Save coach</button><button type="button" class="btn btn-line" id="ce-cancel">Close</button>' +
    (id && SUPER ? '<button type="button" class="link" id="ce-del" style="margin-inline-start:auto">Delete coach</button>' : '') + '</div>' +
    '<p class="small muted">Saving keeps a draft. Press “Publish to website” to update ownfit.ae.</p></form>';

  const media = {}; // new uploads: key -> dataURL
  // show existing media photos
  if (/^media:/.test(c.photo || '')) getDoc(doc(db, 'media', c.photo.slice(6))).then((s) => { if (s.exists()) $('ce-photo-prev').src = s.data().data; });
  function drawGallery() {
    $('ce-gal').innerHTML = c.gallery.map((g, i) => '<figure><img data-gi="' + i + '" alt=""><button type="button" data-rm="' + i + '" aria-label="Remove">×</button></figure>').join('');
    c.gallery.forEach((g, i) => {
      const img = $('ce-gal').querySelector('[data-gi="' + i + '"]');
      if (media[g.src]) img.src = media[g.src];
      else if (/^media:/.test(g.src)) getDoc(doc(db, 'media', g.src.slice(6))).then((s) => { if (s.exists()) img.src = s.data().data; });
      else img.src = g.src;
    });
    $('ce-gal').querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { c.gallery.splice(+b.dataset.rm, 1); drawGallery(); }; });
  }
  function drawVideos() {
    $('ce-vids').innerHTML = c.videos.map((v, i) => '<li><span>' + esc(v.title || '(no title)') + ' <span class="small muted">' + esc(v.type) + (v.portrait ? ' · vertical' : '') + '</span></span><button type="button" class="link small" data-vrm="' + i + '">Remove</button></li>').join('') || '<li class="muted">No videos yet.</li>';
    $('ce-vids').querySelectorAll('[data-vrm]').forEach((b) => { b.onclick = () => { c.videos.splice(+b.dataset.vrm, 1); drawVideos(); }; });
  }
  drawGallery(); drawVideos();

  $('ce-photo').onchange = async () => {
    const f = $('ce-photo').files[0]; if (!f) return;
    const url = await resize(f, 900, 1200); const key = 'new:' + Math.random().toString(36).slice(2);
    media[key] = url; c.photo = key; $('ce-photo-prev').src = url;
  };
  $('ce-gal-add').onchange = async () => {
    for (const f of $('ce-gal-add').files) {
      const url = await resize(f, 1200, 1200); const key = 'new:' + Math.random().toString(36).slice(2);
      media[key] = url; c.gallery.push({ src: key, alt: c.name || '', alt_ar: c.name_ar || '' });
    }
    $('ce-gal-add').value = ''; drawGallery();
  };
  $('ce-v-add').onclick = async () => {
    const title = $('ce-v-title').value.trim(), title_ar = $('ce-v-title-ar').value.trim(), portrait = $('ce-v-portrait').checked;
    const yt = $('ce-v-yt').value.trim(), file = $('ce-v-file').files[0];
    if (yt) {
      const m = yt.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,20})/);
      if (!m) return toast('That doesn’t look like a YouTube link.');
      c.videos.push({ type: 'youtube', id: m[1], title, title_ar, portrait: /shorts\//.test(yt) || portrait });
    } else if (file) {
      if (file.size > 40 * 1024 * 1024) return toast('Video is over 40 MB. Compress it or use a YouTube link.');
      $('ce-v-busy').innerHTML = '<span class="spinner"></span> Uploading video…'; $('ce-v-add').disabled = true;
      try {
        const data = await fileBase64(file);
        const res = await backend('uploadVideo', { name: file.name, mime: file.type || 'video/mp4', data });
        if (!res.ok) throw new Error(res.error || 'Upload failed');
        c.videos.push({ type: 'drive', id: res.id, title, title_ar, portrait });
      } catch (x) { toast(friendlyError(x)); return; }
      finally { $('ce-v-busy').textContent = ''; $('ce-v-add').disabled = false; }
    } else return toast('Choose a video file or paste a YouTube link.');
    $('ce-v-title').value = ''; $('ce-v-title-ar').value = ''; $('ce-v-yt').value = ''; $('ce-v-file').value = '';
    drawVideos(); toast('Video added – remember to save the coach');
  };
  $('ce-cancel').onclick = () => { $('c-edit').innerHTML = ''; };
  if ($('ce-del')) $('ce-del').onclick = async () => {
    if (!confirm('Delete ' + c.name + '? They disappear from the website at the next publish.')) return;
    try { await deleteDoc(doc(db, 'coaches', id)); await loadAll(); renderCoaches(); toast('Deleted. Publish to update the website.'); } catch (x) { toast(friendlyError(x)); }
  };

  $('ce').onsubmit = async (e) => {
    e.preventDefault();
    const v = (x) => $('ce-' + x).value.trim();
    c.name = v('name'); if (c.name.length < 2) return toast('Add the coach’s name.');
    TEXTS.forEach(([f]) => { c[f] = v(f); c[f + '_ar'] = v(f + '_ar'); });
    LISTS.forEach((f) => { c[f] = commas(v(f)); c[f + '_ar'] = commas(v(f + '_ar')); });
    PARAS.forEach((f) => { c[f] = lines(v(f)); c[f + '_ar'] = lines(v(f + '_ar')); });
    c.achievements = lines(v('ach')).map((l) => { const [text, text_ar, year, place, emoji] = l.split('|').map((x) => (x || '').trim()); const o = { text, text_ar, year: year ? Number(year) || year : '', place: Number(place) || 0 }; if (emoji) o.emoji = emoji.slice(0, 8); return o; }).filter((a) => a.text);
    c.services = [...document.querySelectorAll('input[name=svc]:checked')].map((x) => x.value);
    c.featured = $('ce-featured').checked; c.published = $('ce-published').checked;
    if (!c.services.length) return toast('Pick at least one service.');
    const newId = id || (slug(c.name) || 'coach') + (coaches.some((x) => x.id === slug(c.name)) ? '-' + Date.now().toString(36).slice(-4) : '');
    c.id = newId;
    try {
      // upload new photos to the media collection
      const swap = async (key) => {
        if (!/^new:/.test(key)) return key;
        const ref = await addDoc(collection(db, 'media'), { data: media[key], coachId: newId, createdAt: serverTimestamp() });
        return 'media:' + ref.id;
      };
      if (c.photo) c.photo = await swap(c.photo);
      if (!c.photo) c.photo = 'assets/coaches/placeholder.svg';
      for (const g of c.gallery) { g.src = await swap(g.src); g.alt = g.alt || c.name; g.alt_ar = g.alt_ar || c.name_ar || ''; }
      await setDoc(doc(db, 'coaches', newId), { ...c, updatedAt: serverTimestamp() });
      await loadAll(); renderCoaches(); toast('Saved. Press “Publish to website” when ready.');
    } catch (x) { toast(friendlyError(x)); }
  };
  $('c-edit').scrollIntoView({ behavior: 'smooth' });
}

async function publish() {
  const live = coaches.filter((c) => c.published).map((c) => {
    const o = JSON.parse(JSON.stringify(c)); delete o.published; delete o.updatedAt; delete o.order; return o;
  });
  if (!confirm('Publish ' + live.length + ' coach' + (live.length === 1 ? '' : 'es') + ' to ownfit.ae?')) return;
  try {
    await setDoc(doc(db, 'site', 'published'), { json: JSON.stringify(live), updatedAt: serverTimestamp(), by: me.email });
    toast('Published! The website now shows ' + live.length + ' coaches.');
  } catch (x) { toast(friendlyError(x)); }
}

/* ======================= Bookings ======================= */
function renderBookings() {
  $('panel').innerHTML = '<div class="card"><h2>Website booking requests</h2><p>Every request sent from the booking form is saved in your Google Sheet, with a Status column you can update.</p>' +
    '<div><a class="btn btn-red" href="' + SHEET_URL + '" target="_blank" rel="noopener">Open bookings sheet</a></div>' +
    '<p class="small muted">When a client pays: make sure they have an account (they sign up at ownfit.ae/login.html), then assign their package in “Sessions & packages”.</p>' +
    (SUPER ? '<p class="small muted">Other admins can open the sheet only if you share it with their Google account in Google Drive.</p>' : '') + '</div>';
}

/* ======================= Helpers ======================= */
function resize(file, maxW, maxH) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, maxW / img.width, maxH / img.height);
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      let q = 0.82, out = cv.toDataURL('image/jpeg', q);
      while (out.length > 700000 && q > 0.4) { q -= 0.1; out = cv.toDataURL('image/jpeg', q); }
      resolve(out);
    };
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = url;
  });
}
function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('Could not read the video'));
    r.readAsDataURL(file);
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.replace('login.html');
  me = user; $('logout').hidden = false;
  try {
    const { profile } = await ensureProfile(user);
    if (roleOf(user, profile) !== 'admin') { location.replace('account.html'); return; }
    const isSuper = isOwner(user);
    perms = isSuper ? ALL_PERMS : (profile.perms || {});
    SUPER = isSuper;
    const as = new URLSearchParams(location.search).get('as');
    if (isSuper) {
      // Clean up: an old profile document for the super admin would make the account visible to other admins
      try { const own = await getDoc(doc(db, 'users', user.uid)); if (own.exists()) await deleteDoc(own.ref); } catch (x) { /* ignore */ }
      if (as) {
        const snap = await getDoc(doc(db, 'users', as));
        if (!snap.exists()) { app.innerHTML = '<p class="err">That account no longer exists.</p><p><a href="admin.html">Back to admin</a></p>'; return; }
        const t = { id: snap.id, ...snap.data() };
        if (t.role !== 'admin') { location.replace('account.html?as=' + encodeURIComponent(as)); return; }
        viewAs = t; perms = t.status === 'active' ? (t.perms || {}) : {}; SUPER = false; // see exactly what this admin sees
      }
    }
    await loadAll(); shell();
  } catch (x) { app.innerHTML = '<p class="err">' + esc(friendlyError(x)) + '</p>'; }
});
