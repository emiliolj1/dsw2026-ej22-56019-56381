# U06 - Formulario de especialidades de Nacho

U06 fue integrada mediante [PR #4](https://github.com/emiliolj1/dsw2026-ej22-56019-56381/pull/4), commit propio `ac8a8cb`. U04/U05/U07 también están integradas. La [QA de U08](qa-u08.md) prueba el formulario con el shell, panel y listado reales.

## Archivos y contratos

`specialty-form.html`, `specialty-form.js` y `specialty-form_style.css` implementan una pantalla de alta/edición con la composición del PDF v1.7, página 26, y los componentes de `style.css`.

| Módulo | Interfaz |
| --- | --- |
| `js/session.js` | `requireSession()` devuelve true o redirige al login y devuelve false |
| `js/shell.js` | `renderShell({ activePage: 'specialties' })`, sobre `#app-shell`, conservando `main#main-content` |
| `js/specialties-store.js` | `getById(id)` devuelve copia del registro no eliminado o null |
| `js/specialties-store.js` | `create(data)` / `update(id, data)` devuelven `{ ok: true, data }` o `{ ok: false, errors }` |

El payload es `{ name, description, isActive }`, con estado booleano. El store valida; el formulario recorta espacios y presenta `errors.name`, `errors.description` y `errors.general` con textContent. La edición conserva id/createdAt. Los errores de almacenamiento se informan sin borrar ni restaurar automáticamente.

## Rutas

| Ruta / acción | Resultado |
| --- | --- |
| `specialty-form.html` | Alta, textos vacíos y activa por defecto |
| `specialty-form.html?id=ID` | Edición con datos precargados |
| Id vacío, inexistente o eliminado | Aviso y guardado bloqueado |
| Guardar | `specialties.html?saved=1`; el listado confirma y limpia el parámetro |
| Cancelar | Listado, sin escritura |

El estado es del prototipo local; el ejemplo POST/PUT del PDF muestra name y description. La sesión de demostración no reemplaza seguridad de backend.

## Ejecutar y probar

Desde la raíz, iniciar `python -m http.server 5500` o Live Server, abrir login.html e ingresar con `admin` / `admin123`. Navegar al formulario desde el panel/listado. Los módulos ES se ejecutan por HTTP.

La suite integrada actual es `node tests/u08/run-browser-tests.mjs`; sus dependencias y resultados se explican en el README. La suite de regresión del formulario es `node tests/u06/run-browser-tests.mjs`: aprobó 33/33 casos y se actualizaron la espera de navegación (el listado elimina saved de la URL), el selector de salida del shell y la comprobación del destino final ante redirecciones simultáneas. El [reporte de regresión](evidencias-u08/regresion-u06.md) mantiene el alcance del formulario.

Las capturas de `evidencias-u06/` documentan la vista aislada original y se conservan como historia de U06. Las capturas de `evidencias-u08/` muestran la integración real. El servidor de `tests/u06/preview-server.mjs` conserva sus fixtures para la etapa de preparación, pero la QA U08 usa únicamente un servidor estático sin sustitutos.

U08 requiere revisión de Emilio y, para sus ajustes del listado, de Lucas. No se emitieron aprobaciones ni se fusionó a main desde esta entrega.
