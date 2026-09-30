import { requireSession } from './js/session.js';
import { renderShell } from './js/shell.js';
import { getActiveCount } from './js/specialties-store.js';

if (requireSession()) {
  renderShell({ activePage: 'dashboard' });

  const main = document.getElementById('main-content');
  const count = document.getElementById('active-specialties-count');
  const error = document.getElementById('dashboard-error');

  function refreshPanel() {
    if (!requireSession()) {
      main.hidden = true;
      return;
    }

    count.textContent = '—';
    error.textContent = '';
    error.hidden = true;

    try {
      count.textContent = String(getActiveCount());
    } catch (cause) {
      error.textContent =
        'No se pudo consultar el total de especialidades. Revisá los datos almacenados.';
      error.hidden = false;
      console.error('Error al cargar el contador de especialidades:', cause);
    }

    main.hidden = false;
  }

  refreshPanel();

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      refreshPanel();
    }
  });
}
