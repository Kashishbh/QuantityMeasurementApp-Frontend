const AUTH_KEY = 'qm_signed_in';
const USER_KEY = 'qm_user';

function isSignedIn() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function requireSignedIn() {
  if (isSignedIn()) return;
  window.location.replace('./login.html');
}

function signIn() {
  localStorage.setItem(AUTH_KEY, 'true');
}

function setUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || typeof u !== 'object') return null;
    return u;
  } catch {
    return null;
  }
}

function getDisplayName() {
  const u = getUser();
  if (u?.name && String(u.name).trim()) return String(u.name).trim();
  if (u?.email && String(u.email).includes('@')) return String(u.email).split('@')[0];
  return 'User';
}

function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.reload();
}

function redirectIfSignedIn() {
  if (!isSignedIn()) return;
  const next = new URLSearchParams(window.location.search).get('next');
  if (next === 'history') return;
  window.location.replace(afterLoginPath());
}

function afterLoginPath() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next === 'history' ? './index.html?openHistory=1' : './index.html';
}

window.QMAuth = {
  isSignedIn,
  requireSignedIn,
  signIn,
  signOut,
  redirectIfSignedIn,
  setUser,
  getUser,
  getDisplayName,
  afterLoginPath,
};
