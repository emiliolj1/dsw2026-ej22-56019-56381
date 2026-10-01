import { requireSession } from './js/session.js';
import { renderShell } from './js/shell.js';
import { search, getAll, remove, resetStore, StoreCorruptError } from './js/specialties-store.js';

const PAGE_SIZE = 5;
let currentQuery = '';
let currentPage = 1;

const $ = (id) => document.getElementById(id);
const tbody = $('specialties-body');
const tableWrap = $('table-wrap');
const emptyState = $('empty-state');
const notice = $('notice');
const pager = $('pager');
const pageInfo = $('page-info');
const prevBtn = $('prev-btn');
const nextBtn = $('next-btn');
const searchInput = $('search-input');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showNotice(text, type = 'success', actionLabel, onAction) {
  notice.replaceChildren(el('span', '', text));
  if (actionLabel) {
    const btn = el('button', 'sp-btn', actionLabel);
    btn.type = 'button';
    btn.addEventListener('click', onAction);
    notice.append(btn);
  }
  notice.className = `sp-notice sp-notice--${type}`;
  notice.hidden = false;
}

function hideNotice() {
  notice.hidden = true;
  notice.replaceChildren();
}

function buildRow(item) {
  const tr = el('tr');
  tr.append(el('td', 'sp-name', item.name), el('td', 'sp-desc', item.description));

  const status = el('td');
  status.append(
    el('span', `sp-badge ${item.isActive ? 'sp-badge--on' : 'sp-badge--off'}`, item.isActive ? 'Activa' : 'Inactiva')
  );

  const actions = el('td', 'sp-row-actions');
  const edit = el('a', 'sp-link', 'Editar');
  edit.href = `specialty-form.html?id=${encodeURIComponent(item.id)}`;
  edit.setAttribute('aria-label', `Editar ${item.name}`);

  const del = el('button', 'sp-link sp-link--danger', 'Eliminar');
  del.type = 'button';
  del.setAttribute('aria-label', `Eliminar ${item.name}`);
  del.addEventListener('click', () => handleDelete(item));

  actions.append(edit, del);
  tr.append(status, actions);
  return tr;
}

function renderEmpty(total, hasAny) {
  if (total > 0) {
    emptyState.hidden = true;
    tableWrap.hidden = false;
    return;
  }
  tableWrap.hidden = true;
  emptyState.replaceChildren();

  if (!hasAny) {
    const link = el('a', 'sp-btn sp-btn--primary', 'Crear la primera especialidad');
    link.href = 'specialty-form.html';
    emptyState.append(el('p', '', 'Todavía no hay especialidades cargadas.'), link);
  } else {
    const clear = el('button', 'sp-btn', 'Limpiar búsqueda');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      searchInput.value = '';
      renderList('');
      searchInput.focus();
    });
    emptyState.append(el('p', '', `Ninguna especialidad coincide con «${currentQuery}».`), clear);
  }
  emptyState.hidden = false;
}

function renderPager({ total, pageIndex, pageSize }) {
  if (total === 0) {
    pager.hidden = true;
    return;
  }
  const from = (pageIndex - 1) * pageSize + 1;
  const to = Math.min(pageIndex * pageSize, total);
  pageInfo.textContent = `Mostrando ${from}–${to} de ${total} especialidades`;
  prevBtn.disabled = pageIndex <= 1;
  nextBtn.disabled = pageIndex * pageSize >= total;
  pager.hidden = false;
}

function showCorrupt() {
  tbody.replaceChildren();
  tableWrap.hidden = true;
  emptyState.hidden = true;
  pager.hidden = true;
  showNotice(
    'Los datos guardados de especialidades están dañados. Podés restaurarlos: se guarda una copia del dato dañado y la lista queda vacía.',
    'error',
    'Restaurar datos',
    () => {
      if (!confirm('¿Restaurar los datos? La lista quedará vacía (se conserva una copia del dato dañado).')) return;
      resetStore();
      hideNotice();
      renderList('');
    }
  );
}

function renderList(query = currentQuery) {
  if (query !== currentQuery) {
    currentQuery = query;
    currentPage = 1;
  }

  let result;
  let hasAny;
  try {
    result = search({ name: currentQuery, pageSize: PAGE_SIZE, pageIndex: currentPage });
    hasAny = result.total > 0 || getAll().length > 0;
  } catch (error) {
    if (error instanceof StoreCorruptError) {
      showCorrupt();
      return;
    }
    throw error;
  }

  currentPage = result.pageIndex;
  tbody.replaceChildren(...result.data.map(buildRow));
  renderEmpty(result.total, hasAny);
  renderPager(result);
}

function handleDelete(item) {
  if (!confirm(`¿Eliminar la especialidad «${item.name}»?`)) return;
  const result = remove(item.id);
  if (result.ok) {
    showNotice(`Se eliminó la especialidad «${item.name}».`);
  } else {
    showNotice(result.errors.general || 'No se pudo eliminar la especialidad.', 'error');
  }
  renderList();
}

if (requireSession()) {
  renderShell({ activePage: 'specialties' });
  $('main-content').hidden = false;

  searchInput.addEventListener('input', () => renderList(searchInput.value));
  $('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    renderList(searchInput.value);
  });
  prevBtn.addEventListener('click', () => {
    currentPage -= 1;
    renderList();
  });
  nextBtn.addEventListener('click', () => {
    currentPage += 1;
    renderList();
  });

  const params = new URLSearchParams(location.search);
  if (params.get('saved') === '1') {
    showNotice('Especialidad guardada correctamente.');
    history.replaceState(null, '', location.pathname);
  }

  renderList('');
}
