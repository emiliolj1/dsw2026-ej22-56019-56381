const record = (extra = {}) => ({ id: 'esp-1', name: 'Cardiología', description: 'Atención del corazón.', isActive: true, deleted: false, createdAt: '2026-09-29T12:00:00.000Z', ...extra });
const test = (name, expected, run) => ({ name, expected, run });

export const scenarios = [
  test('Login inválido y válido', 'Error visible, foco y acceso al panel con credenciales correctas.', async (h) => {
    await h.open({ authenticated: false, route: 'login.html' });
    await h.page.locator('#username').fill('admin');
    await h.page.locator('#password').fill('incorrecta');
    await h.page.locator('button[type="submit"]').click();
    h.assert.equal(await h.page.locator('#login-error').isVisible(), true);
    h.assert.equal(new URL(h.page.url()).pathname, '/login.html');
    h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'password');
    await h.screenshot('u08-login-error.png');
    await h.page.locator('#password').fill('admin123');
    await h.page.locator('button[type="submit"]').click();
    await h.page.waitForURL('**/dashboard.html');
    h.assert.equal(await h.page.locator('#active-specialties-count').textContent(), '0');
  }),
  test('Panel: contador real y enlaces', 'Cuenta solo activas no eliminadas; enlaces y sección activa correctos.', async (h) => {
    await h.open({ records: [record(), record({ id: 'esp-2', name: 'Neurología', isActive: false }), record({ id: 'esp-3', name: 'Clínica médica', deleted: true })] });
    h.assert.equal(await h.page.locator('#active-specialties-count').textContent(), '1');
    h.assert.equal(await h.page.locator('[data-page="dashboard"]').getAttribute('aria-current'), 'page');
    h.assert.equal(await h.page.getByRole('link', { name: 'Nueva especialidad', exact: true }).getAttribute('href'), './specialty-form.html');
    h.assert.equal(await h.page.getByRole('link', { name: 'Ver especialidades', exact: true }).getAttribute('href'), './specialties.html');
    await h.screenshot('u08-panel-escritorio.png');
  }),
  test('Listado vacío', 'Mensaje, acción de crear y paginación oculta.', async (h) => {
    await h.open({ route: 'specialties.html' });
    h.assert.equal(await h.page.locator('#empty-state').isVisible(), true);
    h.assert.match(await h.page.locator('#empty-state').textContent(), /Todavía no hay/);
    h.assert.equal(await h.page.locator('#table-wrap').isHidden(), true);
    h.assert.equal(await h.page.locator('#pager').isHidden(), true);
    await h.screenshot('u08-listado-vacio.png');
    await h.page.getByRole('link', { name: 'Crear la primera especialidad' }).click();
    await h.page.waitForURL('**/specialty-form.html');
  }),
  test('Alta válida y persistencia', 'Recorta textos, guarda, muestra fila y aviso; persiste al refrescar.', async (h) => {
    await h.open();
    await h.page.getByRole('link', { name: 'Nueva especialidad', exact: true }).click();
    h.assert.equal(await h.page.locator('#name').inputValue(), '');
    h.assert.equal(await h.page.locator('#isActive').inputValue(), 'true');
    await h.fill('  Cardiología  ', '  Atención del corazón.  ');
    await h.save(); await h.saved();
    const initial = await h.all();
    h.assert.equal(initial.length, 1); h.assert.equal(initial[0].name, 'Cardiología');
    h.assert.equal(initial[0].description, 'Atención del corazón.');
    h.assert.match(initial[0].id, /^[0-9a-f-]{36}$/);
    h.assert.ok(!Number.isNaN(Date.parse(initial[0].createdAt)));
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 1);
    await h.screenshot('u08-alta-listado.png');
    await h.page.reload();
    h.assert.deepEqual(await h.all(), initial);
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 1);
    await h.panelCount(1);
  }),
  ...[
    ['Obligatorios', '', '', 'obligatorio', 'obligatoria'],
    ['Límites inferiores', 'AB', '123456789', '3 y 100', '10 y 100'],
    ['Límites superiores', 'N'.repeat(101), 'D'.repeat(101), '3 y 100', '10 y 100'],
  ].map(([name, inputName, description, nameMessage, descriptionMessage]) => test(name, 'Mensajes del store, foco en nombre y ninguna escritura.', async (h) => {
    await h.open({ route: 'specialty-form.html' });
    await h.fill(inputName, description); await h.save();
    h.assert.ok((await h.page.locator('#name-error').textContent()).includes(nameMessage));
    h.assert.ok((await h.page.locator('#description-error').textContent()).includes(descriptionMessage));
    h.assert.equal(await h.page.locator('#name').getAttribute('aria-invalid'), 'true');
    h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'name');
    h.assert.deepEqual(await h.all(), []);
    if (name === 'Límites inferiores') await h.screenshot('u08-formulario-errores.png');
  })),
  ...[
    ['Mínimos válidos', 'ABC', '1234567890'],
    ['Máximos válidos', 'N'.repeat(100), 'D'.repeat(100)],
  ].map(([name, inputName, description]) => test(name, 'Acepta ambos límites exactos y muestra el registro en la tabla.', async (h) => {
    await h.open({ route: 'specialty-form.html' });
    await h.fill(inputName, description); await h.save(); await h.saved();
    h.assert.equal((await h.all())[0].name, inputName);
    h.assert.equal((await h.all())[0].description, description);
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 1);
  })),
  test('Nombre duplicado normalizado', 'Rechaza tildes, mayúsculas y espacios equivalentes sin guardar.', async (h) => {
    const initial = [record({ name: 'Cardiología Pediátrica' })];
    await h.open({ route: 'specialty-form.html', records: initial });
    await h.fill('  CARDIOLOGIA    PEDIATRICA  ', 'Descripción de prueba.'); await h.save();
    h.assert.equal(await h.page.locator('#name-error').textContent(), 'Ya existe una especialidad con ese nombre.');
    h.assert.deepEqual(await h.all(), initial);
  }),
  test('Búsqueda y limpieza', 'Filtra por nombre, muestra vacío sin coincidencias y restaura la tabla.', async (h) => {
    const initial = [record(), record({ id: 'esp-2', name: 'Neurología' })];
    await h.open({ route: 'specialties.html', records: initial });
    await h.page.locator('#search-input').fill('CARDIO');
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 1);
    h.assert.match(await h.page.locator('#specialties-body').textContent(), /Cardiología/);
    await h.page.locator('#search-input').fill('sin coincidencias');
    h.assert.equal(await h.page.locator('#empty-state').isVisible(), true);
    h.assert.equal(await h.page.locator('#pager').isHidden(), true);
    await h.screenshot('u08-busqueda-vacia.png');
    await h.page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
    h.assert.equal(await h.page.locator('#search-input').inputValue(), '');
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 2);
    h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'search-input');
    h.assert.deepEqual(await h.all(), initial);
  }),
  test('Edición conserva identidad y fecha', 'Carga desde Editar; modifica el mismo registro y persiste.', async (h) => {
    await h.open({ route: 'specialties.html', records: [record()] });
    await h.page.getByRole('link', { name: 'Editar Cardiología', exact: true }).click();
    h.assert.equal(await h.page.locator('#form-title').textContent(), 'Editar especialidad');
    h.assert.equal(await h.page.locator('#name').inputValue(), 'Cardiología');
    h.assert.equal(await h.page.locator('#description').inputValue(), 'Atención del corazón.');
    await h.screenshot('u08-edicion-escritorio.png');
    await h.fill('Cardiología infantil', 'Atención cardiovascular infantil.');
    await h.save(); await h.saved();
    const [changed] = await h.all();
    h.assert.equal(changed.id, 'esp-1'); h.assert.equal(changed.createdAt, record().createdAt);
    h.assert.equal(changed.name, 'Cardiología infantil');
    await h.page.reload(); h.assert.deepEqual(await h.all(), [changed]);
  }),
  test('Edición con el mismo nombre', 'El registro no se considera duplicado de sí mismo.', async (h) => {
    await h.open({ route: 'specialty-form.html?id=esp-1', records: [record()] });
    await h.fill('Cardiología', 'Atención cardiovascular integral.'); await h.save(); await h.saved();
    h.assert.equal((await h.all()).length, 1); h.assert.equal((await h.all())[0].id, 'esp-1');
  }),
  test('Edición a nombre duplicado', 'No altera ninguno de los dos registros.', async (h) => {
    const initial = [record(), record({ id: 'esp-2', name: 'Neurología' })];
    await h.open({ route: 'specialty-form.html?id=esp-1', records: initial });
    await h.fill('NEUROLOGIA', 'Descripción de prueba.'); await h.save();
    h.assert.equal(await h.page.locator('#name-error').isVisible(), true);
    h.assert.deepEqual(await h.all(), initial);
  }),
  test('Estado inactivo y contador del panel', 'La fila indica Inactiva y el contador visual pasa de 1 a 0.', async (h) => {
    await h.open({ records: [record()] });
    h.assert.equal(await h.page.locator('#active-specialties-count').textContent(), '1');
    await h.page.goto(`${h.url}/specialty-form.html?id=esp-1`);
    await h.fill('Cardiología', 'Atención del corazón.', 'false'); await h.save(); await h.saved();
    h.assert.match(await h.page.locator('#specialties-body').textContent(), /Inactiva/);
    h.assert.equal((await h.all())[0].id, 'esp-1'); await h.panelCount(0);
  }),
  test('Alta inactiva y reactivación', 'No cuenta al crear; al reactivar cuenta 1, sin duplicar.', async (h) => {
    await h.open({ route: 'specialty-form.html' });
    await h.fill('Neurología', 'Atención del sistema nervioso.', 'false'); await h.save(); await h.saved();
    const id = (await h.all())[0].id;
    await h.panelCount(0);
    await h.page.goto(`${h.url}/specialty-form.html?id=${encodeURIComponent(id)}`);
    h.assert.equal(await h.page.locator('#isActive').inputValue(), 'false');
    await h.fill('Neurología', 'Atención del sistema nervioso.', 'true'); await h.save(); await h.saved();
    h.assert.equal((await h.all()).length, 1); h.assert.equal((await h.all())[0].id, id);
    await h.panelCount(1);
  }),
  ...[
    ['Cancelar alta', 'specialty-form.html', []],
    ['Cancelar edición', 'specialty-form.html?id=esp-1', [record()]],
  ].map(([name, route, records]) => test(name, 'Vuelve al listado sin escribir datos ni mostrar guardado.', async (h) => {
    await h.open({ route, records });
    await h.fill('Neurología', 'Descripción de prueba.', 'false');
    await h.page.locator('#cancel-button').click(); await h.page.waitForURL('**/specialties.html');
    h.assert.deepEqual(await h.all(), records);
    h.assert.equal(await h.page.locator('#notice').isHidden(), true);
  })),
  test('Eliminación cancelada', 'El diálogo cancelado conserva la fila y todos los datos.', async (h) => {
    await h.open({ route: 'specialties.html', records: [record()] });
    h.page.once('dialog', (dialog) => dialog.dismiss());
    await h.page.getByRole('button', { name: 'Eliminar Cardiología', exact: true }).click();
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 1);
    h.assert.deepEqual(await h.all(), [record()]);
    await h.page.reload(); h.assert.equal(await h.page.locator('#specialties-body tr').count(), 1);
  }),
  test('Eliminación confirmada y persistente', 'Oculta la fila, conserva el borrado lógico y actualiza el contador.', async (h) => {
    await h.open({ route: 'specialties.html', records: [record()] });
    h.page.once('dialog', (dialog) => dialog.accept());
    await h.page.getByRole('button', { name: 'Eliminar Cardiología', exact: true }).click();
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 0);
    h.assert.equal((await h.all())[0].deleted, true);
    h.assert.match(await h.page.locator('#notice').textContent(), /Se eliminó/);
    await h.page.reload(); h.assert.equal(await h.page.locator('#specialties-body tr').count(), 0);
    await h.panelCount(0);
  }),
  test('Paginación y búsqueda desde otra página', 'Recorre 5/5/2 registros y reinicia página al filtrar.', async (h) => {
    const initial = Array.from({ length: 12 }, (_, i) => record({ id: `esp-${i + 1}`, name: `Especialidad ${String(i + 1).padStart(2, '0')}` }));
    await h.open({ route: 'specialties.html', records: initial });
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 5);
    h.assert.equal(await h.page.locator('#prev-btn').isDisabled(), true);
    await h.page.locator('#next-btn').click(); h.assert.equal(await h.page.locator('#specialties-body tr').count(), 5);
    await h.page.locator('#next-btn').click(); h.assert.equal(await h.page.locator('#specialties-body tr').count(), 2);
    h.assert.equal(await h.page.locator('#next-btn').isDisabled(), true);
    await h.page.locator('#search-input').fill('01');
    h.assert.equal(await h.page.locator('#specialties-body tr').count(), 1);
    h.assert.match(await h.page.locator('#page-info').textContent(), /1–1 de 1/);
    h.assert.deepEqual(await h.all(), initial);
  }),
  ...['dashboard.html', 'specialties.html', 'specialty-form.html'].map((route) => test(`URL privada: ${route}`, 'Una sesión nueva sin acceso vuelve al login.', async (h) => {
    await h.open({ route, authenticated: false });
    await h.page.waitForURL('**/login.html');
    h.assert.equal(await h.page.locator('#login-form').isVisible(), true);
  })),
  test('Cerrar sesión y botón Atrás', 'La salida impide volver al panel, al listado y al formulario.', async (h) => {
    await h.open();
    await h.page.goto(`${h.url}/specialties.html`);
    await h.page.locator('#app-logout').click(); await h.page.waitForURL('**/login.html');
    h.assert.equal(await h.page.evaluate(() => sessionStorage.getItem('dsw_u4_admin_session_v1')), null);
    await h.page.goBack(); await h.page.waitForURL('**/login.html');
    for (const route of ['dashboard.html', 'specialties.html', 'specialty-form.html']) {
      await h.page.goto(`${h.url}/${route}`); await h.page.waitForURL('**/login.html');
    }
  }),
  test('Shell y listado al restaurar sin sesión', 'El evento pageshow oculta el contenido y redirige al login.', async (h) => {
    await h.open({ route: 'specialties.html' });
    const hidden = await h.page.evaluate(() => {
      sessionStorage.removeItem('dsw_u4_admin_session_v1');
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      return document.querySelector('main').hidden;
    });
    h.assert.equal(hidden, true); await h.page.waitForURL('**/login.html');
  }),
  ...[
    ['Id inexistente', 'inexistente', []],
    ['Id eliminado', 'esp-1', [record({ deleted: true })]],
    ['Id vacío', '', []],
  ].map(([name, id, records]) => test(name, 'Aviso accesible, campos/guardar bloqueados y retorno al listado.', async (h) => {
    await h.open({ route: `specialty-form.html?id=${id}`, records });
    h.assert.equal(await h.page.locator('#record-notice').isVisible(), true);
    h.assert.equal(await h.page.locator('#save-button').isDisabled(), true);
    h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'record-notice');
    h.assert.deepEqual(await h.all(), records);
    await h.page.getByRole('link', { name: 'Volver al listado', exact: true }).click();
    await h.page.waitForURL('**/specialties.html');
  })),
  test('HTML literal en listado y formulario', 'Los datos se muestran como texto sin crear elementos HTML.', async (h) => {
    const initial = [record({ name: '<img src=x>', description: 'Descripción con <b>texto</b>.' })];
    await h.open({ route: 'specialties.html', records: initial });
    h.assert.match(await h.page.locator('#specialties-body').textContent(), /<img src=x>/);
    h.assert.equal(await h.page.locator('#specialties-body img, #specialties-body b').count(), 0);
    await h.page.getByRole('link', { name: 'Editar <img src=x>', exact: true }).click();
    h.assert.equal(await h.page.locator('#name').inputValue(), '<img src=x>');
  }),
  test('Recuperación explícita de datos corruptos', 'Cancelar conserva el valor; confirmar respalda y vacía sin aviso residual.', async (h) => {
    await h.open({ route: 'specialties.html', raw: '{invalido' });
    h.assert.match(await h.page.locator('#notice').textContent(), /dañados/);
    h.page.once('dialog', (dialog) => dialog.dismiss());
    await h.page.getByRole('button', { name: 'Restaurar datos' }).click();
    h.assert.equal(await h.raw(), '{invalido');
    h.page.once('dialog', (dialog) => dialog.accept());
    await h.page.getByRole('button', { name: 'Restaurar datos' }).click();
    h.assert.deepEqual(await h.all(), []);
    h.assert.equal(await h.page.evaluate(() => localStorage.getItem('dsw_u4_specialties_v1_corrupt_backup')), '{invalido');
    h.assert.equal(await h.page.locator('#notice').isHidden(), true);
    h.assert.equal(await h.page.locator('#pager').isHidden(), true);
  }),
  test('Fallo al guardar y reintento', 'Muestra un error, conserva los datos y permite guardar después.', async (h) => {
    await h.open({ route: 'specialty-form.html' }); await h.fill('Neurología', 'Descripción de prueba.');
    await h.page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === localStorage && key === 'dsw_u4_specialties_v1') throw new DOMException('Sin espacio', 'QuotaExceededError');
        return original.call(this, key, value);
      };
      window._qaRestore = () => { Storage.prototype.setItem = original; };
    });
    await h.save(); h.assert.equal(await h.page.locator('#form-error').isVisible(), true);
    h.assert.equal(await h.page.locator('#save-button').isEnabled(), true); h.assert.deepEqual(await h.all(), []);
    await h.page.evaluate(() => window._qaRestore()); await h.save(); await h.saved();
  }),
  test('Recorrido de teclado del formulario', 'Recorre nombre, descripción, estado, cancelar y guardar con Enter.', async (h) => {
    await h.open({ route: 'specialty-form.html' }); await h.page.locator('#name').focus();
    await h.page.keyboard.type('Neurologia'); await h.page.keyboard.press('Tab');
    h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'description');
    await h.page.keyboard.type('Atencion del sistema nervioso.'); await h.page.keyboard.press('Tab');
    h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'isActive');
    await h.page.keyboard.press('Tab'); h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'cancel-button');
    await h.page.keyboard.press('Tab'); h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'save-button');
    await h.page.keyboard.press('Enter'); await h.saved();
  }),
  test('Menú móvil, Escape y navegación', 'A 375 px abre/cierra, devuelve foco y navega a especialidades.', async (h) => {
    await h.open({ viewport: { width: 375, height: 812 } });
    h.assert.equal(await h.page.locator('#app-sidebar').isHidden(), true);
    await h.page.locator('#app-menu-toggle').click();
    h.assert.equal(await h.page.locator('#app-sidebar').isVisible(), true);
    h.assert.equal(await h.page.locator('#app-menu-toggle').getAttribute('aria-expanded'), 'true');
    await h.screenshot('u08-menu-movil-375.png');
    await h.page.keyboard.press('Escape');
    h.assert.equal(await h.page.locator('#app-sidebar').isHidden(), true);
    h.assert.equal(await h.page.evaluate(() => document.activeElement.id), 'app-menu-toggle');
    await h.page.locator('#app-menu-toggle').click();
    await h.page.locator('[data-page="specialties"]').click(); await h.page.waitForURL('**/specialties.html');
    h.assert.equal(await h.page.locator('#app-sidebar').isHidden(), true);
  }),
  test('Formulario móvil 375 px', 'Campos/botones accesibles y sin desborde, también con errores.', async (h) => {
    await h.open({ route: 'specialty-form.html', viewport: { width: 375, height: 812 } });
    for (const id of ['name', 'description', 'isActive', 'cancel-button', 'save-button']) {
      const box = await h.page.locator(`#${id}`).boundingBox();
      h.assert.ok(box.x >= 0 && box.x + box.width <= 375 && box.height >= 44);
    }
    await h.fill('AB', 'Corta'); await h.save();
    h.assert.ok(await h.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await h.screenshot('u08-formulario-movil-375.png');
  }),
  test('Listado móvil y tabla desplazable', 'La tabla usa desplazamiento propio, sin desbordar la página.', async (h) => {
    await h.open({ route: 'specialties.html', records: [record(), record({ id: 'esp-2', name: 'Neurología', isActive: false })], viewport: { width: 375, height: 812 } });
    h.assert.ok(await h.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    h.assert.ok(await h.page.locator('#table-wrap').evaluate((node) => node.scrollWidth > node.clientWidth));
    await h.page.locator('#table-wrap').evaluate((node) => { node.scrollLeft = node.scrollWidth; });
    h.assert.equal(await h.page.getByRole('button', { name: 'Eliminar Cardiología', exact: true }).isVisible(), true);
    await h.page.locator('#table-wrap').evaluate((node) => { node.scrollLeft = 0; });
    await h.screenshot('u08-listado-movil-375.png');
  }),
  test('Escritorio y módulos futuros', 'Sidebar visible, botón móvil oculto y módulos futuros deshabilitados.', async (h) => {
    await h.open({ route: 'specialties.html', records: [record()] });
    h.assert.equal(await h.page.locator('#app-sidebar').isVisible(), true);
    h.assert.equal(await h.page.locator('#app-menu-toggle').isHidden(), true);
    h.assert.equal(await h.page.locator('[data-page="specialties"]').getAttribute('aria-current'), 'page');
    const future = h.page.locator('.app-shell__disabled');
    h.assert.equal(await future.count(), 3);
    for (const item of await future.all()) {
      h.assert.equal(await item.getAttribute('aria-disabled'), 'true');
      h.assert.match(await item.textContent(), /Próximamente/);
    }
    h.assert.equal(await h.page.locator('a[href="#"]').count(), 0);
  }),
];
