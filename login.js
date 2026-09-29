import { hasSession, login } from './js/session.js';

if (hasSession()) {
  window.location.replace('dashboard.html');
} else {
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('login-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    errorMessage.textContent = '';
    errorMessage.hidden = true;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (login(username, password)) {
      window.location.assign('dashboard.html');
      return;
    }

    errorMessage.textContent = 'Usuario o contraseña incorrectos.';
    errorMessage.hidden = false;
    passwordInput.value = '';
    passwordInput.focus();
  });
}
