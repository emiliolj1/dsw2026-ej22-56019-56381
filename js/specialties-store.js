const STORAGE_KEY = 'dsw_u4_specialties_v1';
const BACKUP_KEY = 'dsw_u4_specialties_v1_corrupt_backup';

const NAME_MIN = 3;
const NAME_MAX = 100;
const DESC_MIN = 10;
const DESC_MAX = 100;

export class StoreCorruptError extends Error {
  constructor(message = 'Los datos de especialidades están dañados.') {
    super(message);
    this.name = 'StoreCorruptError';
  }
}

function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StoreCorruptError();
  }
  if (!Array.isArray(parsed)) throw new StoreCorruptError();
  return parsed;
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function copy(item) {
  return { ...item };
}

function validate(data, all, excludeId) {
  const errors = {};
  const name = String(data?.name ?? '').trim();
  const description = String(data?.description ?? '').trim();

  if (!name) {
    errors.name = 'El nombre es obligatorio.';
  } else if (name.length < NAME_MIN || name.length > NAME_MAX) {
    errors.name = `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.`;
  } else {
    const wanted = normalize(name);
    const duplicated = all.some(
      (s) => !s.deleted && s.id !== excludeId && normalize(s.name) === wanted
    );
    if (duplicated) errors.name = 'Ya existe una especialidad con ese nombre.';
  }

  if (!description) {
    errors.description = 'La descripción es obligatoria.';
  } else if (description.length < DESC_MIN || description.length > DESC_MAX) {
    errors.description = `La descripción debe tener entre ${DESC_MIN} y ${DESC_MAX} caracteres.`;
  }

  return errors;
}

export function getAll() {
  return readAll().filter((s) => !s.deleted).map(copy);
}

export function getById(id) {
  const found = readAll().find((s) => s.id === id && !s.deleted);
  return found ? copy(found) : null;
}

export function create(data) {
  const all = readAll();
  const errors = validate(data, all, null);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const item = {
    id: crypto.randomUUID(),
    name: String(data.name).trim(),
    description: String(data.description).trim(),
    isActive: data.isActive === undefined ? true : Boolean(data.isActive),
    deleted: false,
    createdAt: new Date().toISOString(),
  };
  all.push(item);
  writeAll(all);
  return { ok: true, data: copy(item) };
}

export function update(id, data) {
  const all = readAll();
  const item = all.find((s) => s.id === id && !s.deleted);
  if (!item) return { ok: false, errors: { general: 'La especialidad no existe.' } };

  const errors = validate(data, all, id);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  item.name = String(data.name).trim();
  item.description = String(data.description).trim();
  if (data.isActive !== undefined) item.isActive = Boolean(data.isActive);
  writeAll(all);
  return { ok: true, data: copy(item) };
}

export function remove(id) {
  const all = readAll();
  const item = all.find((s) => s.id === id && !s.deleted);
  if (!item) return { ok: false, errors: { general: 'La especialidad no existe.' } };
  item.deleted = true;
  writeAll(all);
  return { ok: true };
}

export function getActiveCount() {
  return readAll().filter((s) => !s.deleted && s.isActive).length;
}

export function search({ name = '', pageSize = 5, pageIndex = 1 } = {}) {
  const wanted = normalize(name);
  const matches = getAll().filter((s) => !wanted || normalize(s.name).includes(wanted));
  const total = matches.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, pageIndex), lastPage);
  const start = (page - 1) * pageSize;
  return { pageSize, pageIndex: page, data: matches.slice(start, start + pageSize), total };
}

export function resetStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== null) localStorage.setItem(BACKUP_KEY, raw);
  writeAll([]);
}