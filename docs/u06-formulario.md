# U06 - Formulario de especialidades de Nacho

## Estado

Implementación local preparada sobre `origin/development` en `3736bbe53aafc2561bcb29c6a278765e3ee8aa24` (29/09/2026). No está publicada ni fusionada. El store, los estilos comunes y la sesión están integrados; el shell, el listado y el nuevo panel todavía no estaban en esa revisión.

La pantalla sigue la composición de la página 26 del PDF v1.7 y la paleta de U01. Los archivos propios son `specialty-form.html`, `specialty-form.js`, `specialty-form_style.css`, `tests/u06/` y esta documentación. Las capturas y los resultados están en `docs/evidencias-u06/`.

## Contratos reales utilizados

| Módulo | Función | Resultado |
| --- | --- | --- |
| `js/session.js` | `requireSession()` | `true` con sesión; `false` y redirección sin sesión |
| `js/specialties-store.js` | `getById(id)` | Copia del registro no eliminado o `null` |
| `js/specialties-store.js` | `create(data)` | `{ ok: true, data }` o `{ ok: false, errors }` |
| `js/specialties-store.js` | `update(id, data)` | Mismo contrato; conserva `id` y `createdAt` |

El payload es `{ name, description, isActive }`, con estado booleano. Los errores llegan en `errors.name`, `errors.description` o `errors.general`. El store también puede lanzar `StoreCorruptError` o errores de almacenamiento. El formulario informa estos problemas sin restaurar ni sobrescribir datos dañados.

Las reglas de obligatorio, longitud y duplicados se ejecutan en el store. El formulario recorta espacios, envía datos y muestra los mensajes con `textContent`. Usa `novalidate` para presentar los errores de esa misma validación.

## Shell: contrato propuesto, pendiente de Emilio

```js
import { renderShell } from './js/shell.js';
renderShell({ activePage: 'specialties' });
```

La firma aún no está confirmada. Se espera que U04 pinte navegación en `#app-shell`, marque especialidades y conserve `main#main-content`, que está fuera del contenedor. La disposición de menú y cabecera corresponde a U04. Adaptar la llamada si Emilio define otra firma y verificar con el shell real antes de integrar. Las fixtures no confirman un acuerdo del equipo.

Con un servidor estático normal se necesita el archivo real `js/shell.js`: sin él, el import ES impide iniciar la pantalla. Mientras falta U04, usar la vista aislada.

## Rutas

| Ruta / acción | Comportamiento |
| --- | --- |
| `specialty-form.html` | Alta, campos vacíos y activa por defecto |
| `specialty-form.html?id=ID` | Carga el registro para editar |
| Id vacío, inexistente o eliminado | Aviso y guardado bloqueado; enlace al listado |
| Guardado correcto | `specialties.html?saved=1` |
| Cancelar | `specialties.html`, sin escribir |

Lucas debe enlazar edición con `encodeURIComponent(id)` y mostrar confirmación al recibir `saved=1` en U07. `isActive` es del prototipo local; el POST/PUT del PDF solo muestra `name` y `description`.

## Vista aislada

Requiere Node.js 18 o posterior. Desde la raíz:

```bash
node tests/u06/preview-server.mjs
```

Abrir `http://127.0.0.1:5501/`, iniciar sesión con `admin` / `admin123` y abrir el formulario en la misma pestaña siguiendo las instrucciones. Se usan login, sesión y store reales. Cuando falta shell o listado, el servidor sirve fixtures rotuladas, sin crear esos archivos de producción.

Para editar manualmente, obtener el id desde el array `dsw_u4_specialties_v1` en las herramientas del navegador y abrir `specialty-form.html?id=ID`. Los datos de este puerto son independientes de otros puertos.

## Pruebas opcionales

Las pruebas no agregan dependencias al producto. Con Node.js y npm:

```bash
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/u06/run-browser-tests.mjs
```

Resultados en `tmp/u06-qa/`. No subir `node_modules` ni datos del navegador. Cada caso usa un contexto nuevo y registros ficticios. `NACHO_CHROMIUM_PATH` permite indicar otro ejecutable compatible y `U06_QA_OUTPUT` elegir la carpeta del reporte.

Las capturas muestran alta, edición, errores y 375 px. El badge **U06 · vista aislada** identifica su alcance. Se comprueban persistencia y contador del store; no la tabla ni la tarjeta del panel. El menú de prueba tampoco valida U04.

## Entrega

Rama `feature/u4-formulario-especialidades`, PR a `development`, revisor Integrante 3. Commit sugerido: `feat: crear y editar especialidades`.

Antes de la revisión final, integrar U04, acordar su contrato, repetir el recorrido con shell/listado reales y ejecutar `git diff --check`. Agregar las capturas integradas cuando existan. No aprobar el propio PR ni fusionar a main.
