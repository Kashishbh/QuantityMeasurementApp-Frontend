function $(id) {
  return document.getElementById(id);
}

const el = {
  form: $('loginForm'),
  status: $('loginStatus'),
  email: $('email'),
};

function setStatus(msg) {
  el.status.textContent = msg || '';
}

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = el.email.value?.trim() || '';
  const fallbackName = email.includes('@') ? email.split('@')[0] : 'User';
  window.QMAuth?.setUser?.({ name: fallbackName, email });
  window.QMAuth?.signIn?.();
  setStatus('Logged in. Redirecting…');
  window.location.replace(window.QMAuth?.afterLoginPath?.() ?? './index.html');
});
