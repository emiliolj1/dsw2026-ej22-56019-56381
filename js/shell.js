import { requireSession, logout } from './session.js';

export function renderShell({ activePage = 'dashboard' } = {}) {
  if (!requireSession()) return;

  const container = document.getElementById('app-shell');

  if (!container) {
    throw new Error('Falta el contenedor #app-shell en esta página.');
  }

  document.body.classList.add('app-layout');

  // El contenido es fijo: no se insertan datos ingresados por el usuario.
  container.innerHTML = `
    <header class="app-shell__header">
      <a class="app-shell__brand" href="./dashboard.html">
        Gestor de turnos
      </a>

      <div class="app-shell__actions">
        <button
          id="app-menu-toggle"
          class="button button--secondary app-shell__menu-toggle"
          type="button"
          aria-controls="app-sidebar"
          aria-expanded="false"
        >
          Menú
        </button>

        <button
          id="app-logout"
          class="button button--secondary"
          type="button"
        >
          Cerrar sesión
        </button>
      </div>
    </header>

    <aside id="app-sidebar" class="app-shell__sidebar">
      <nav aria-label="Navegación principal">
        <ul class="app-shell__nav-list">
          <li>
            <a
              class="nav-link"
              href="./dashboard.html"
              data-page="dashboard"
            >
              Panel
            </a>
          </li>

          <li>
            <a
              class="nav-link"
              href="./specialties.html"
              data-page="specialties"
            >
              Especialidades
            </a>
          </li>

          <li>
            <span class="app-shell__disabled" aria-disabled="true">
              Médicos <small>Próximamente</small>
            </span>
          </li>

          <li>
            <span class="app-shell__disabled" aria-disabled="true">
              Pacientes <small>Próximamente</small>
            </span>
          </li>

          <li>
            <span class="app-shell__disabled" aria-disabled="true">
              Turnos <small>Próximamente</small>
            </span>
          </li>
        </ul>
      </nav>
    </aside>
  `;

  const menuButton = document.getElementById('app-menu-toggle');
  const sidebar = document.getElementById('app-sidebar');
  const desktop = window.matchMedia('(min-width: 768px)');

  for (const link of container.querySelectorAll('[data-page]')) {
    if (link.dataset.page === activePage) {
      link.setAttribute('aria-current', 'page');
    }
  }

  function setMenuOpen(open) {
    sidebar.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
  }

  function syncViewport() {
    menuButton.hidden = desktop.matches;
    setMenuOpen(desktop.matches);
  }

  menuButton.addEventListener('click', () => {
    setMenuOpen(sidebar.hidden);
  });

  sidebar.addEventListener('click', (event) => {
    if (!desktop.matches && event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      !desktop.matches &&
      !sidebar.hidden
    ) {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  document.getElementById('app-logout').addEventListener('click', logout);

  desktop.addEventListener('change', syncViewport);
  syncViewport();

  // Verificar nuevamente la sesión al volver con el botón Atrás.
  window.addEventListener('pageshow', () => {
    if (!requireSession()) {
      container.hidden = true;

      const main = document.getElementById('main-content');
      if (main) main.hidden = true;
    }
  });
}
