import {
  auth, $, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail,
  ensureProfile, roleOf, backend, friendlyError
} from './fb.js';

const err = $('err'), ok = $('ok');
let signupExtra = null, working = false;

function show(el, msg) { err.hidden = true; ok.hidden = true; if (msg) { el.textContent = msg; el.hidden = false; } }
function busy(on) { working = on; $('busy').hidden = !on; $('auth-box').style.opacity = on ? .5 : 1; }

function tab(up) {
  $('tab-in').setAttribute('aria-selected', String(!up));
  $('tab-up').setAttribute('aria-selected', String(up));
  $('form-in').hidden = up; $('form-up').hidden = !up; show(err);
}
$('tab-in').onclick = () => tab(false);
$('tab-up').onclick = () => tab(true);

$('google').onclick = async () => {
  show(err); busy(true);
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { busy(false); show(err, friendlyError(e)); }
};

$('form-in').onsubmit = async (e) => {
  e.preventDefault(); show(err);
  const email = $('in-email').value.trim(), pass = $('in-pass').value;
  if (!email || !pass) return show(err, 'Enter your email and password.');
  busy(true);
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch (x) { busy(false); show(err, friendlyError(x)); }
};

$('form-up').onsubmit = async (e) => {
  e.preventDefault(); show(err);
  const name = $('up-name').value.trim(), phone = $('up-phone').value.trim();
  const email = $('up-email').value.trim(), pass = $('up-pass').value;
  if (name.length < 2) return show(err, 'Enter your full name.');
  if (!email) return show(err, 'Enter your email.');
  if (pass.length < 8) return show(err, 'Use a password with at least 8 characters.');
  busy(true);
  signupExtra = { name, phone };
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    try { await sendEmailVerification(cred.user); } catch (x) { /* not critical */ }
    await afterLogin(cred.user);
  } catch (x) { busy(false); signupExtra = null; show(err, friendlyError(x)); }
};

$('forgot').onclick = async () => {
  const email = $('in-email').value.trim();
  if (!email) return show(err, 'Type your email above first, then press “Forgot your password?”.');
  try { await sendPasswordResetEmail(auth, email); show(ok, 'If an account exists for ' + email + ', a reset link is on its way.'); }
  catch (x) { show(err, friendlyError(x)); }
};

let handled = false;
async function afterLogin(user) {
  if (handled) return; handled = true;
  busy(true);
  try {
    const { profile, isNew } = await ensureProfile(user, signupExtra || {});
    if (isNew) { try { await backend('welcome', { name: profile.name || '' }); } catch (x) { /* email is best effort */ } }
    const role = roleOf(user, profile);
    location.replace(role === 'admin' ? 'admin.html' : 'account.html');
  } catch (x) {
    handled = false; busy(false); show(err, friendlyError(x));
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) { busy(false); return; }
  // Sign-up runs afterLogin itself once the name is saved
  if (signupExtra && !auth.currentUser.displayName) return;
  afterLogin(user);
});
