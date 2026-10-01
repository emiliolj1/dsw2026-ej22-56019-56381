import { requireSession } from './js/session.js';
import { renderShell } from './js/shell.js';
import { getById, create, update } from './js/specialties-store.js';

const page = document.getElementById('main-content');
const form = document.getElementById('specialty-form');
const fields = document.getElementById('specialty-fields');
const saveButton = document.getElementById('save-button');
const formError = document.getElementById('form-error');
const recordNotice = document.getElementById('record-notice');
const inputs = {
  name: document.getElementById('name'),
  description: document.getElementById('description'),
  isActive: document.getElementById('isActive'),
};

const params = new URLSearchParams(window.location.search);
const isEditing = params.has('id');
const specialtyId = params.get('id');
let saving = false;
let unavailable = false;

function clearErrors() {
  formError.textContent = '';
  formError.hidden = true;
  for (const [name, input] of Object.entries(inputs)) {
    input.setAttribute('aria-invalid', 'false');
    const message = document.getElementById(`${name}-error`);
    message.textContent = '';
    message.hidden = true;
  }
}

function showErrors(errors) {
  let firstInvalid = null;
  for (const [name, input] of Object.entries(inputs)) {
    if (!errors[name]) continue;
    const message = document.getElementById(`${name}-error`);
    message.textContent = errors[name];
    message.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    firstInvalid ??= input;
  }

  formError.textContent = errors.general || 'Revisá los campos indicados antes de guardar.';
  formError.hidden = false;
  (firstInvalid || formError).focus();
}

function storageErrorMessage(error) {
  if (error.name === 'StoreCorruptError') {
    return 'Los datos de especialidades están dañados. Volvé al listado para revisar su recuperación. No se guardaron cambios.';
  }
  return 'No se pudieron leer o guardar las especialidades en este navegador. Revisá el almacenamiento disponible e intentá nuevamente.';
}

function blockForm(message) {
  unavailable = true;
  fields.disabled = true;
  saveButton.disabled = true;
  document.getElementById('record-notice-message').textContent = message;
  recordNotice.hidden = false;
  recordNotice.focus();
}

function loadForm() {
  if (!isEditing) return;

  document.title = 'Editar especialidad | Gestor de turnos';
  document.getElementById('form-title').textContent = 'Editar especialidad';
  document.getElementById('form-breadcrumb').textContent = 'Editar especialidad';
  document.getElementById('form-intro').textContent = 'Actualizá el nombre, la descripción o el estado de la especialidad.';
  document.getElementById('state-label').textContent = 'Estado';
  saveButton.textContent = 'Guardar cambios';

  try {
    const specialty = getById(specialtyId);
    if (!specialty) {
      blockForm('La especialidad solicitada no existe o fue eliminada. Podés volver al listado para elegir otra.');
      return;
    }
    inputs.name.value = specialty.name;
    inputs.description.value = specialty.description;
    inputs.isActive.value = specialty.isActive ? 'true' : 'false';
  } catch (error) {
    blockForm(storageErrorMessage(error));
  }
}

function handleSubmit(event) {
  event.preventDefault();
  if (saving || unavailable || !requireSession()) return;

  clearErrors();
  inputs.name.value = inputs.name.value.trim();
  inputs.description.value = inputs.description.value.trim();
  const data = {
    name: inputs.name.value,
    description: inputs.description.value,
    isActive: inputs.isActive.value === 'true',
  };

  saving = true;
  saveButton.disabled = true;
  form.setAttribute('aria-busy', 'true');
  let saved = false;

  try {
    // El store del equipo es la única fuente de validación y persistencia.
    const result = isEditing ? update(specialtyId, data) : create(data);
    if (!result.ok) {
      showErrors(result.errors);
      return;
    }
    saved = true;
    window.location.assign('specialties.html?saved=1');
  } catch (error) {
    showErrors({ general: storageErrorMessage(error) });
  } finally {
    if (!saved) {
      saving = false;
      saveButton.disabled = unavailable;
      form.removeAttribute('aria-busy');
    }
  }
}

if (requireSession()) {
  // Contrato del shell compartido de U04, integrado en development.
  renderShell({ activePage: 'specialties' });
  page.hidden = false;
  loadForm();
  form.addEventListener('submit', handleSubmit);
}

// También comprobar la sesión al volver desde la caché de navegación.
window.addEventListener('pageshow', () => {
  if (!requireSession()) page.hidden = true;
});
