const SESSION_KEY = 'dsw_u4_admin_session_v1';

export function hasSession() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function login(username, password) {
  const valid = username.trim() === 'admin' && password === 'admin123';

  if (valid) {
    sessionStorage.setItem(SESSION_KEY, 'true');
  }

  return valid;
}

export function requireSession() {
  if (hasSession()) {
    return true;
  }

  window.location.replace('login.html');
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.replace('login.html');
}
