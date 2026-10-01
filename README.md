# Gestor de turnos médicos - Unidad 4 DSW 2026

Prototipo de administración de especialidades médicas desarrollado con **HTML, CSS y JavaScript**, sin frameworks. Incluye acceso de demostración, panel, navegación adaptable, listado, búsqueda, alta, edición y eliminación lógica. Los datos se guardan en el navegador mediante `localStorage`.

Repositorio: [emiliolj1/dsw2026-ej22-56019-56381](https://github.com/emiliolj1/dsw2026-ej22-56019-56381). Rama de integración: **development**.

## Integrantes y aportes

| Integrante | Cuenta de GitHub | Aportes |
| --- | --- | --- |
| Emilio Luna Jandar | [emiliolj1](https://github.com/emiliolj1) | U01 base visual, U04 navegación y U09 cierre visual |
| Carlos Facundo López | [cfacundo7](https://github.com/cfacundo7) | U02 login/sesión y U05 panel |
| Lucas Tomas Ferreyra | [lucas33-dev](https://github.com/lucas33-dev) | U03 store/persistencia y U07 listado/búsqueda/eliminación |
| Matías Ignacio Ferreyra | [NachoF1390](https://github.com/NachoF1390) | U06 formulario y U08 pruebas/documentación |

Los cuatro aportes están identificados en los PR integrados #1 a #7. El [registro de integración](docs/evidencias-u08/pr-integrados.json) conserva sus autores, ramas y commits de merge. Completar el nombre completo de Lucas con el dato del equipo antes de la presentación académica; su cuenta identifica el aporte real. La revisión manual U09 fue realizada por Emilio sobre el commit 8bac764, con resultados correctos en escritorio, móvil emulado a 375 px y recorrido desde una sesión nueva. El registro está en [U09](docs/u09-cierre.md); quedan pendientes la revisión del Integrante 4 y la integración del PR de cierre.

## Ejecutar el proyecto

Se necesita Git para clonar, un navegador moderno y un servidor HTTP estático. El producto no requiere npm, React ni una API.

```bash
git clone https://github.com/emiliolj1/dsw2026-ej22-56019-56381.git
cd dsw2026-ej22-56019-56381
git switch development
python -m http.server 5500
```

En Linux/macOS puede usarse `python3 -m http.server 5500`; en Windows también sirve `py -m http.server 5500`. Alternativa: abrir la carpeta con VS Code y ejecutar **Live Server** sobre `login.html`.

Abrir [http://localhost:5500/login.html](http://localhost:5500/login.html). Los scripts se cargan como módulos ES: usar HTTP, en lugar de abrir los HTML mediante `file://`.

| Usuario demo | Contraseña demo |
| --- | --- |
| `admin` | `admin123` |

Para comenzar con una colección nueva, usar un perfil de prueba o una ventana privada del navegador.

## Recorrido de uso

1. Ingresar con las credenciales demo. Un acceso inválido muestra un error en la página.
2. En el panel, consultar el número de especialidades activas y abrir **Ver especialidades**.
3. Si la colección está vacía, usar **Crear la primera especialidad**. También está disponible **Nueva especialidad**.
4. Completar nombre, descripción y estado; guardar. El listado muestra la fila y confirma el guardado.
5. Buscar por nombre. Si no hay coincidencias, usar **Limpiar búsqueda** para volver a la colección completa.
6. Usar **Editar** para cambiar datos o estado. **Cancelar** vuelve al listado sin guardar.
7. Usar **Eliminar** y confirmar el diálogo para ocultar el registro. Cancelar el diálogo conserva los datos.
8. **Cerrar sesión** vuelve al login. A 375 px, el botón **Menú** abre/cierra la navegación; Escape la cierra y devuelve el foco al botón.

El panel cuenta únicamente registros activos y no eliminados. El listado muestra activas e inactivas; pagina de a cinco registros. Los módulos Médicos, Pacientes y Turnos aparecen como **Próximamente**, sin acciones ficticias.

## Rutas y estructura

| Ruta / archivos | Responsabilidad |
| --- | --- |
| `login.html`, `login.js`, `login_style.css` | Acceso y mensajes de credenciales |
| `dashboard.html`, `dashboard.js`, `dashboard_style.css` | Panel, contador y acciones |
| `specialties.html`, `specialties.js`, `specialties_style.css` | Listado, búsqueda, paginación, estado y eliminación |
| `specialty-form.html`, `specialty-form.js`, `specialty-form_style.css` | Alta y edición con un mismo formulario |
| `style.css` | Paleta y componentes compartidos |
| `js/session.js` | Sesión demo, control de acceso y salida |
| `js/shell.js` | Cabecera, menú lateral, sección activa y menú móvil |
| `js/specialties-store.js` | Validación y persistencia de especialidades |
| `tests/u08/` | Servidor estático y QA integrada de navegador |
| `tests/u06/` | Regresión del formulario y vista de trabajo de U06 |
| `docs/qa-u08.md` | Matriz, correcciones y entrega de evidencias para U09 |
| `docs/evidencias-u08/` | Reportes y capturas de la aplicación integrada |

`specialty-form.html` crea un registro; `specialty-form.html?id=ID` edita uno existente. Un id vacío, inexistente o eliminado muestra un aviso y bloquea el guardado. El formulario navega a `specialties.html?saved=1` después de guardar; el listado muestra la confirmación y limpia ese parámetro de la URL.

## Datos y validaciones

La clave `localStorage['dsw_u4_specialties_v1']` contiene un array JSON de objetos `{ id, name, description, isActive, deleted, createdAt }`. Si la clave no existe, se interpreta una colección vacía. Los cambios se persisten al crear, actualizar o eliminar. El id se genera con `crypto.randomUUID()` y la edición conserva id y fecha de creación.

El store es la única fuente de validación:

- Nombre obligatorio, de 3 a 100 caracteres.
- Descripción obligatoria, de 10 a 100 caracteres.
- Recorte de espacios iniciales y finales.
- Nombres únicos entre registros no eliminados, sin distinguir mayúsculas, tildes ni espacios normalizados por el store.
- Borrado lógico mediante `deleted: true`, conservando el objeto y ocultándolo del listado/contador.

Las operaciones compartidas son `getAll`, `getById`, `create`, `update`, `remove` y `getActiveCount`. `search` filtra y pagina sin modificar el array persistido. El formulario muestra los errores junto a los campos y enfoca el primero inválido.

Los datos pertenecen al navegador y origen: otro puerto, navegador o hostname puede mostrar una colección distinta. Si el JSON está dañado, el listado ofrece **Restaurar datos** con confirmación. Esta acción guarda el valor anterior en `dsw_u4_specialties_v1_corrupt_backup` y deja la colección vacía. El formulario no restablece datos automáticamente.

La clave `sessionStorage['dsw_u4_admin_session_v1']` guarda el indicador de acceso de la pestaña. Salir lo elimina; la contraseña no se guarda en `localStorage`. Es una sesión de demostración que puede alterarse desde las herramientas del navegador y no sustituye la autenticación ni autorización de un backend.

## API y alcance de Unidad 4

**Esta entrega no implementa endpoints ni hace llamadas al backend.** No requiere configurar una URL de API o token. Médicos, pacientes, turnos, React y la conexión con la API pertenecen a otra etapa del TPI.

`isActive` es un estado del prototipo local. El ejemplo POST/PUT del PDF muestra solo `name` y `description`; su contrato deberá revisarse antes de conectar una API real.

## Pruebas reproducibles

Se ejecutaron **37/37 casos integrados aprobados** en Chromium 153.0.8010.0, Linux, vistas 1366 x 900 y 375 x 812, con las pantallas y módulos reales. La base fue `development` en `d4c5f2d`, más las correcciones incluidas en U08. No se usaron fixtures para esta QA.

Consultar [la matriz y los defectos corregidos](docs/qa-u08.md), [el reporte detallado](docs/evidencias-u08/resultados-u08.md) y [el reporte JSON con hashes de los archivos](docs/evidencias-u08/resultados-u08.json). Las capturas anteriores de U06 se conservan como evidencia histórica de una vista aislada; las capturas de `evidencias-u08` corresponden a la aplicación integrada.

Para repetir la QA automatizada, instalar Node.js 18 o posterior y, desde la raíz:

```bash
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/u08/run-browser-tests.mjs
```

La suite inicia su propio servidor y usa contextos nuevos, acceso con el login real y datos ficticios. Deja reportes/capturas en `tmp/u08-qa/`. Estas dependencias son solo para pruebas; no son necesarias para usar el producto. `node_modules/` y `tmp/` están excluidos de Git. La suite de regresión U06 se ejecuta con `node tests/u06/run-browser-tests.mjs`: aprobó 33/33 casos adicionales del formulario; su [reporte](docs/evidencias-u08/regresion-u06.md) conserva ese alcance y no sustituye las 37 pruebas integradas.

## Integración de U08

U08 fue integrado en development mediante el [PR #8](https://github.com/emiliolj1/dsw2026-ej22-56019-56381/pull/8).
Incluye documentación, evidencias y correcciones del listado.

La revisión final se registra en [U09](docs/u09-cierre.md).
El PR de cierre requiere revisión del Integrante 4 e integración en development. La decisión sobre main corresponde al equipo.
