import { logout } from '/js/session.js';

// Fixture exclusiva de tests/u06. La firma debe confirmarse con Emilio (U04).
export function renderShell({ activePage }) {
  if (activePage !== 'specialties') throw new Error('Se esperaba la sección especialidades.');
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/_qa/shell-fixture.css';
  document.head.append(stylesheet);
  document.body.classList.add('qa-shell-layout');
  document.getElementById('app-shell').innerHTML = `
    <header class="qa-topbar">
      <strong>Gestor de turnos</strong>
      <span class="qa-label">U06 · vista aislada</span>
      <button id="qa-menu-button" class="button button--secondary" type="button" aria-controls="qa-nav" aria-expanded="false">Menú</button>
    </header>
    <nav id="qa-nav" class="qa-sidebar" aria-label="Navegación de prueba">
      <p class="qa-brand">Administración</p>
      <a class="nav-link" href="/dashboard.html">Panel</a>
      <a class="nav-link" href="/specialties.html" aria-current="page">Especialidades</a>
      <p class="qa-disabled">Médicos · Próximamente</p>
      <p class="qa-disabled">Pacientes · Próximamente</p>
      <p class="qa-fixture-note">Menú de prueba. Pendiente U04.</p>
      <button id="qa-logout" class="button button--secondary" type="button">Cerrar sesión</button>
    </nav>`;
  document.getElementById('qa-logout').addEventListener('click', logout);
  document.getElementById('qa-menu-button').addEventListener('click', (event) => {
    const open = document.getElementById('qa-nav').classList.toggle('qa-open');
    event.currentTarget.setAttribute('aria-expanded', String(open));
  });
}
