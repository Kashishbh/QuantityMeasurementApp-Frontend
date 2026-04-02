function $(id) {
  return document.getElementById(id);
}

const el = {
  form: $('signupForm'),
  status: $('signupStatus'),
  fullName: $('fullName'),
  email: $('email'),
  password: $('password'),
  pwToggle: $('pwToggle'),
  goHistoryWrap: $('goHistoryWrap'),
  goHistoryBtn: $('goHistoryBtn'),
};

function setStatus(msg) {
  el.status.textContent = msg || '';
}

function togglePassword() {
  const isPw = el.password.type === 'password';
  el.password.type = isPw ? 'text' : 'password';
  el.pwToggle.textContent = isPw ? '🙈' : '👁';
}

el.pwToggle.addEventListener('click', togglePassword);

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  window.QMAuth?.setUser?.({
    name: el.fullName.value?.trim() || '',
    email: el.email.value?.trim() || '',
  });
  window.QMAuth?.signIn?.();
  window.location.replace(window.QMAuth?.afterLoginPath?.() ?? './index.html');
});

const next = new URLSearchParams(window.location.search).get('next');
const wantsHistory = next === 'history';
if (el.goHistoryWrap && el.goHistoryBtn && wantsHistory && window.QMAuth?.isSignedIn?.()) {
  el.goHistoryWrap.hidden = false;
  el.goHistoryBtn.addEventListener('click', () => {
    window.location.replace('./index.html?openHistory=1');
  });
}
