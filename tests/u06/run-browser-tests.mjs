import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startPreview } from './preview-server.mjs';

const require = createRequire(import.meta.url);
let playwrightPath;
try {
  playwrightPath = require.resolve('playwright');
} catch {
  playwrightPath = require.resolve('playwright', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean) });
}
const { chromium } = require(playwrightPath);
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.resolve(process.env.U06_QA_OUTPUT || path.join(root, 'tmp/u06-qa'));
await mkdir(output, { recursive: true });
const { server, url } = await startPreview({ port: 0, quiet: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.NACHO_CHROMIUM_PATH ? { executablePath: process.env.NACHO_CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const KEY = 'dsw_u4_specialties_v1';
const record = (extra = {}) => ({
  id: 'esp-1', name: 'Cardiología', description: 'Atención del corazón.',
  isActive: true, deleted: false, createdAt: '2026-09-29T12:00:00.000Z', ...extra,
});
const results = [];
let context;
let page;
let errors;

async function open({ records = [], raw, loggedIn = true, query = '', viewport = { width: 1366, height: 900 }, route = 'specialty-form.html' } = {}) {
  context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(({ initialRaw, authenticated }) => {
    if (sessionStorage.getItem('_qa_u06_seeded') === 'true') return;
    localStorage.setItem('dsw_u4_specialties_v1', initialRaw);
    if (authenticated) sessionStorage.setItem('dsw_u4_admin_session_v1', 'true');
    sessionStorage.setItem('_qa_u06_seeded', 'true');
  }, { initialRaw: raw ?? JSON.stringify(records), authenticated: loggedIn });
  page = await context.newPage();
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${url}/${route}${query}`);
}

async function data() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
}

async function fill(name, description, state = 'true') {
  await page.locator('#name').fill(name);
  await page.locator('#description').fill(description);
  await page.locator('#isActive').selectOption(state);
}

async function save() {
  await page.locator('#save-button').click();
}

async function saved() {
  await page.waitForURL('**/specialties.html?saved=1');
}

async function activeCount() {
  return page.evaluate(async () => (await import('/js/specialties-store.js')).getActiveCount());
}

async function screenshot(filename) {
  // El foco en un error puede desplazar la página antes de la captura.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, filename), fullPage: true });
}

const cases = [
  ['Acceso directo sin sesión', async () => {
    await open({ loggedIn: false });
    await page.waitForURL('**/login.html');
    assert.equal(await page.locator('#login-form').isVisible(), true);
    assert.deepEqual(await data(), []);
  }],
  ['Login real: credenciales inválidas y válidas', async () => {
    await open({ loggedIn: false, route: 'login.html' });
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('incorrecta');
    await page.locator('button[type="submit"]').click();
    assert.equal(await page.locator('#login-error').isVisible(), true);
    assert.equal(new URL(page.url()).pathname, '/login.html');
    await page.locator('#password').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html');
    await page.goto(`${url}/specialty-form.html`);
    assert.equal(await page.locator('#specialty-form').isVisible(), true);
  }],
  ['Alta: título, campos vacíos y activa por defecto', async () => {
    await open();
    assert.equal(await page.locator('#form-title').textContent(), 'Nueva especialidad');
    assert.equal(await page.locator('#name').inputValue(), '');
    assert.equal(await page.locator('#description').inputValue(), '');
    assert.equal(await page.locator('#isActive').inputValue(), 'true');
    await screenshot('u06-alta-escritorio.png');
  }],
  ['Campos obligatorios: errores, foco y ninguna escritura', async () => {
    await open();
    await save();
    assert.equal(await page.locator('#name-error').textContent(), 'El nombre es obligatorio.');
    assert.equal(await page.locator('#description-error').textContent(), 'La descripción es obligatoria.');
    assert.equal(await page.locator('#name').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'name');
    assert.deepEqual(await data(), []);
  }],
  ['Límites inferiores: nombre 2 y descripción 9', async () => {
    await open();
    await fill('AB', '123456789');
    await save();
    assert.match(await page.locator('#name-error').textContent(), /3 y 100/);
    assert.match(await page.locator('#description-error').textContent(), /10 y 100/);
    assert.deepEqual(await data(), []);
    await screenshot('u06-errores-escritorio.png');
  }],
  ['Mínimos válidos: nombre 3 y descripción 10', async () => {
    await open();
    await fill('ABC', '1234567890');
    await save(); await saved();
    const [created] = await data();
    assert.equal(created.name, 'ABC');
    assert.equal(created.description.length, 10);
    assert.match(created.id, /^[0-9a-f-]{36}$/);
    assert.ok(!Number.isNaN(Date.parse(created.createdAt)));
  }],
  ['Máximos válidos: nombre y descripción 100', async () => {
    await open(); await fill('N'.repeat(100), 'D'.repeat(100));
    await save(); await saved();
    const [created] = await data();
    assert.equal(created.name.length, 100); assert.equal(created.description.length, 100);
  }],
  ['Límites superiores: ambos campos 101', async () => {
    await open(); await fill('N'.repeat(101), 'D'.repeat(101)); await save();
    assert.equal(await page.locator('#name-error').isVisible(), true);
    assert.equal(await page.locator('#description-error').isVisible(), true);
    assert.deepEqual(await data(), []);
  }],
  ['Nombre duplicado: mayúsculas, tildes y espacios', async () => {
    await open({ records: [record()] });
    await fill('  CARDIOLOGIA  ', 'Descripción de prueba.'); await save();
    assert.equal(await page.locator('#name-error').textContent(), 'Ya existe una especialidad con ese nombre.');
    assert.deepEqual(await data(), [record()]);
  }],
  ['Alta válida: recorte, datos reales y persistencia tras refrescar', async () => {
    await open(); await fill('  Neurología  ', '  Atención del sistema nervioso.  ');
    await save(); await saved();
    const before = await data();
    assert.equal(before.length, 1); assert.equal(before[0].name, 'Neurología');
    assert.equal(before[0].description, 'Atención del sistema nervioso.');
    assert.equal(before[0].deleted, false); assert.equal(before[0].isActive, true);
    await page.reload(); assert.deepEqual(await data(), before);
  }],
  ['Alta inactiva: contador del store excluye el registro', async () => {
    await open(); await fill('Neurología', 'Atención del sistema nervioso.', 'false');
    await save(); await saved();
    assert.equal((await data())[0].isActive, false); assert.equal(await activeCount(), 0);
  }],
  ['Edición: carga de campos y título', async () => {
    await open({ records: [record()], query: '?id=esp-1' });
    assert.equal(await page.locator('#form-title').textContent(), 'Editar especialidad');
    assert.equal(await page.locator('#name').inputValue(), 'Cardiología');
    assert.equal(await page.locator('#description').inputValue(), 'Atención del corazón.');
    assert.equal(await page.locator('#save-button').textContent(), 'Guardar cambios');
    await screenshot('u06-edicion-escritorio.png');
  }],
  ['Edición de inactiva: selección correcta', async () => {
    await open({ records: [record({ isActive: false })], query: '?id=esp-1' });
    assert.equal(await page.locator('#isActive').inputValue(), 'false');
  }],
  ['Edición sin cambiar nombre: conserva id y createdAt', async () => {
    await open({ records: [record()], query: '?id=esp-1' });
    await fill('Cardiología', 'Atención cardiovascular integral.'); await save(); await saved();
    const records = await data(); assert.equal(records.length, 1);
    assert.equal(records[0].id, 'esp-1'); assert.equal(records[0].createdAt, record().createdAt);
    await page.reload(); assert.deepEqual(await data(), records);
  }],
  ['Edición a inactiva: contador del store pasa de 1 a 0', async () => {
    await open({ records: [record()], query: '?id=esp-1' });
    assert.equal(await activeCount(), 1);
    await fill('Cardiología', 'Atención del corazón.', 'false'); await save(); await saved();
    assert.equal(await activeCount(), 0); assert.equal((await data())[0].id, 'esp-1');
  }],
  ['Edición duplicada: no reemplaza ningún registro', async () => {
    const initial = [record(), record({ id: 'esp-2', name: 'Neurología' })];
    await open({ records: initial, query: '?id=esp-1' });
    await fill('neurologia', 'Descripción de prueba.'); await save();
    assert.equal(await page.locator('#name-error').isVisible(), true);
    assert.deepEqual(await data(), initial);
  }],
  ['Cancelar alta: navegación sin escritura', async () => {
    await open(); await fill('Neurología', 'Descripción de prueba.');
    await page.locator('#cancel-button').click(); await page.waitForURL('**/specialties.html');
    assert.deepEqual(await data(), []);
  }],
  ['Cancelar edición: conserva todos los datos', async () => {
    await open({ records: [record()], query: '?id=esp-1' });
    await fill('Neurología', 'Descripción de prueba.', 'false');
    await page.locator('#cancel-button').click(); await page.waitForURL('**/specialties.html');
    assert.deepEqual(await data(), [record()]);
  }],
  ['Identificador inexistente: aviso y guardado bloqueado', async () => {
    await open({ query: '?id=inexistente' });
    assert.equal(await page.locator('#record-notice').isVisible(), true);
    assert.equal(await page.locator('#save-button').isDisabled(), true);
    assert.equal(await page.locator('#name').isDisabled(), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'record-notice');
    assert.deepEqual(await data(), []);
  }],
  ['Registro eliminado: no puede editarse', async () => {
    await open({ records: [record({ deleted: true })], query: '?id=esp-1' });
    assert.equal(await page.locator('#save-button').isDisabled(), true);
    assert.deepEqual(await data(), [record({ deleted: true })]);
  }],
  ['Parámetro id vacío: no se interpreta como alta', async () => {
    await open({ query: '?id=' });
    assert.equal(await page.locator('#form-title').textContent(), 'Editar especialidad');
    assert.equal(await page.locator('#save-button').isDisabled(), true);
  }],
  ['Datos corruptos al editar: aviso sin sobrescribir', async () => {
    await open({ raw: '{invalido', query: '?id=esp-1' });
    assert.match(await page.locator('#record-notice-message').textContent(), /dañados/);
    assert.equal(await page.locator('#save-button').isDisabled(), true);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), KEY), '{invalido');
  }],
  ['Datos corruptos al crear: aviso sin sobrescribir', async () => {
    await open({ raw: '{invalido' }); await fill('Neurología', 'Descripción de prueba.'); await save();
    assert.match(await page.locator('#form-error').textContent(), /dañados/);
    assert.equal(await page.locator('#save-button').isEnabled(), true);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), KEY), '{invalido');
  }],
  ['Fallo de almacenamiento: no escribe y permite reintentar', async () => {
    await open(); await fill('Neurología', 'Descripción de prueba.');
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === localStorage && key === 'dsw_u4_specialties_v1') throw new DOMException('Sin espacio', 'QuotaExceededError');
        return original.call(this, key, value);
      };
      window._qaRestoreStorage = () => { Storage.prototype.setItem = original; };
    });
    await save(); assert.equal(await page.locator('#form-error').isVisible(), true);
    assert.deepEqual(await data(), []); assert.equal(await page.locator('#save-button').isEnabled(), true);
    await page.evaluate(() => window._qaRestoreStorage()); await save(); await saved();
    assert.equal((await data()).length, 1);
  }],
  ['Eliminación concurrente: el store rechaza la actualización', async () => {
    await open({ records: [record()], query: '?id=esp-1' });
    await page.evaluate(async () => (await import('/js/specialties-store.js')).remove('esp-1'));
    await fill('Neurología', 'Descripción de prueba.'); await save();
    assert.equal(await page.locator('#form-error').textContent(), 'La especialidad no existe.');
    assert.deepEqual(await data(), [record({ deleted: true })]);
  }],
  ['Contenido HTML: se trata como texto', async () => {
    await open(); await fill('<img src=x>', 'Descripción con <b>texto</b>.'); await save(); await saved();
    assert.equal((await data())[0].name, '<img src=x>');
    await page.goto(`${url}/specialty-form.html?id=${encodeURIComponent((await data())[0].id)}`);
    assert.equal(await page.locator('#name').inputValue(), '<img src=x>');
    assert.equal(await page.locator('img').count(), 0);
  }],
  ['Sesión retirada antes de guardar: redirige y no escribe', async () => {
    await open(); await fill('Neurología', 'Descripción de prueba.');
    await page.evaluate(() => sessionStorage.removeItem('dsw_u4_admin_session_v1'));
    await save(); await page.waitForURL('**/login.html'); assert.deepEqual(await data(), []);
  }],
  ['pageshow vuelve a comprobar la sesión', async () => {
    await open();
    await page.evaluate(() => {
      sessionStorage.removeItem('dsw_u4_admin_session_v1');
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await page.waitForURL('**/login.html');
  }],
  ['Teclado: recorre los campos y guarda con Enter', async () => {
    await open(); await page.locator('#name').focus();
    await page.keyboard.type('Neurologia'); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'description');
    await page.keyboard.type('Atencion del sistema nervioso.'); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'isActive');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'cancel-button');
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'save-button');
    await page.keyboard.press('Enter'); await saved();
  }],
  ['Doble envío de edición: una sola escritura', async () => {
    await open({ records: [record()], query: '?id=esp-1' });
    await fill('Cardiología', 'Descripción de prueba.');
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === localStorage && key === 'dsw_u4_specialties_v1') {
          original.call(sessionStorage, '_qa_write_count', String(Number(sessionStorage.getItem('_qa_write_count') || 0) + 1));
        }
        return original.call(this, key, value);
      };
      document.getElementById('specialty-form').requestSubmit();
      document.getElementById('specialty-form').requestSubmit();
    });
    await saved(); assert.equal(await page.evaluate(() => sessionStorage.getItem('_qa_write_count')), '1');
  }],
  ['Móvil 375 px: campos, botones y errores sin desborde', async () => {
    await open({ viewport: { width: 375, height: 812 } });
    for (const id of ['name', 'description', 'isActive', 'cancel-button', 'save-button']) {
      const box = await page.locator(`#${id}`).boundingBox();
      assert.ok(box.width > 0 && box.x >= 0 && box.x + box.width <= 375);
      assert.ok(box.height >= 44);
    }
    await fill('AB', 'Corta'); await save();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('#name-error').isVisible(), true);
    await screenshot('u06-movil-375.png');
  }],
  ['Store U03: borrado lógico, contador y persistencia', async () => {
    await open({ records: [record(), record({ id: 'esp-2', name: 'Neurología', isActive: false })] });
    const snapshot = await page.evaluate(async () => {
      const store = await import('/js/specialties-store.js');
      store.remove('esp-1');
      return { listed: store.getAll(), removed: store.getById('esp-1'), count: store.getActiveCount() };
    });
    assert.equal(snapshot.listed.length, 1); assert.equal(snapshot.removed, null); assert.equal(snapshot.count, 0);
    const before = await data(); assert.equal(before[0].deleted, true);
    await page.reload(); assert.deepEqual(await data(), before);
  }],
  ['Logout real del panel: elimina sesión y protege su URL', async () => {
    await open({ route: 'dashboard.html' });
    await page.locator('#logout').click(); await page.waitForURL('**/login.html');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('dsw_u4_admin_session_v1')), null);
    await page.goto(`${url}/dashboard.html`); await page.waitForURL('**/login.html');
    await page.goto(`${url}/specialty-form.html`); await page.waitForURL('**/login.html');
  }],
];

try {
  for (let index = 0; index < cases.length; index++) {
    const [name, action] = cases[index];
    let result;
    try {
      await action();
      assert.deepEqual(errors, [], 'Errores de consola o JavaScript');
      result = { id: `F${String(index + 1).padStart(2, '0')}`, name, result: 'PASS' };
    } catch (error) {
      result = { id: `F${String(index + 1).padStart(2, '0')}`, name, result: 'FAIL', detail: error.message };
    } finally {
      if (context) await context.close();
      context = null;
    }
    results.push(result);
    console.log(`${result.id} ${result.result} ${result.name}${result.detail ? `: ${result.detail}` : ''}`);
  }
  const hashes = {};
  for (const filename of ['specialty-form.html', 'specialty-form.js', 'specialty-form_style.css', 'js/session.js', 'js/specialties-store.js', 'style.css']) {
    hashes[filename] = createHash('sha256').update(await readFile(path.join(root, filename))).digest('hex');
  }
  let baseCommit = 'No disponible';
  try { baseCommit = execFileSync('git', ['rev-parse', 'origin/development'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
  const report = {
    timestamp: new Date().toISOString(), browser: `Chromium ${browser.version()}`,
    baseCommit, scope: 'U06 con session.js, specialties-store.js y style.css reales; shell y destino del listado de prueba si faltan.',
    evidenceDoesNotVerify: ['U04 shell real', 'U05 contador visual del panel', 'U07 listado, búsqueda y eliminación desde la interfaz', 'U08 recorrido integral', 'U09 cierre visual'],
    sourceHashes: hashes, passed: results.filter((item) => item.result === 'PASS').length,
    total: results.length, results,
  };
  await writeFile(path.join(output, 'resultados-u06.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(output, 'resultados-u06.md'), `# Resultado automatizado U06\n\nFecha: ${report.timestamp}\n\nNavegador: ${report.browser}\n\nBase development: ${baseCommit}\n\nAlcance: ${report.scope}\n\n**Este reporte no cierra la QA integral de U08.**\n\n| Caso | Prueba | Resultado |\n| --- | --- | --- |\n${results.map((item) => `| ${item.id} | ${item.name} | ${item.result}${item.detail ? `: ${item.detail.replaceAll('|', '/')}` : ''} |`).join('\n')}\n\nTotal: ${report.passed}/${report.total}.\n`);
  if (report.passed !== report.total) process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
