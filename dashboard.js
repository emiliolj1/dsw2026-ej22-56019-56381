import { requireSession, logout } from './js/session.js';

if (requireSession()) {
  document.querySelector('.dashboard-container').hidden = false;
  document.getElementById('logout').addEventListener('click', logout);
}
