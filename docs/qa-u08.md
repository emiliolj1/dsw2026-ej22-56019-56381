# U08 - QA integrada y guía de entrega

Responsable: Nacho (Matías Ignacio Ferreyra). Base: `development`, commit `d4c5f2d31264be46f964887c65dff768500252e3`, más las correcciones propuestas en esta rama U08. Fecha de la verificación: 30/09/2026, 21:34, America/Buenos_Aires (`2026-10-01T00:34:07.153Z`).

Navegador: Chromium 153.0.8010.0, Linux. Vistas: escritorio 1366 x 900 y móvil 375 x 812. El servidor sirvió los archivos reales de login, panel, shell, store, listado y formulario. **Sin fixtures ni sustitutos de páginas.** Cada caso utiliza un contexto nuevo y pasa por el login real cuando requiere acceso.

## Resultado

**37/37 casos integrados aprobados.** En esos casos no se detectaron excepciones JavaScript, errores de consola, recursos HTTP faltantes ni solicitudes externas/al backend. La primera ejecución sobre development sin cambios obtuvo 33/37 y permitió reproducir dos defectos. Después de corregirlos se repitió toda la suite.

| Caso requerido | Resultado observado | Evidencia / pruebas |
| --- | --- | --- |
| Login inválido / válido | Error y foco en contraseña; ingreso al panel con credenciales correctas | QA01, `u08-login-error.png` |
| Listado vacío | Mensaje, enlace a crear y paginación oculta | QA03, `u08-listado-vacio.png` |
| Alta y persistencia | Fila, aviso de guardado y mismo JSON después de refrescar | QA04, `u08-alta-listado.png` |
| Duplicados y límites | Rechazo sin escritura; aceptación exacta de 3/100 y 10/100 | QA05-QA10, `u08-formulario-errores.png` |
| Búsqueda con/sin coincidencias | Filtrado, estado vacío, limpieza, foco y colección intacta | QA11, `u08-busqueda-vacia.png` |
| Edición y cambio de estado | Mismo id/createdAt; fila y contador visual actualizados | QA12-QA16, `u08-edicion-escritorio.png`, `u08-panel-escritorio.png` |
| Cancelación del formulario | Alta/edición no escriben ni muestran aviso de guardado | QA17-QA18 |
| Eliminación cancelada / confirmada | Cancelación conserva; confirmación oculta y persiste borrado lógico | QA19-QA20 |
| Paginación | 5/5/2 registros; filtrar reinicia página sin modificar datos | QA21 |
| URLs privadas y salida | Panel/listado/formulario vuelven al login; Atrás no permite reingresar | QA22-QA25 |
| Recuperación de vista sin sesión | pageshow oculta el contenido del listado y redirige | QA26 |
| Id inválido / eliminado / vacío | Aviso, campos y guardado bloqueados | QA27-QA29 |
| HTML como texto y errores de almacenamiento | Sin elementos HTML creados desde datos; recuperación explícita y reintento | QA30-QA32 |
| Teclado | Recorrido de campos y envío con Enter | QA33 |
| Móvil 375 px | Menú, Escape, foco, formulario y scroll propio de tabla utilizables | QA34-QA36, capturas móviles |
| Escritorio y controles visibles | Sidebar, sección activa, botones y módulos futuros coherentes | QA37 |

QA25 ejecuta navegación real con el botón Atrás. QA26 despacha un evento pageshow para comprobar el mecanismo de ocultación; no afirma que el navegador haya restaurado una entrada real de bfcache. La suite mide el ancho del documento y los controles del formulario; la tabla móvil se desplaza dentro de su contenedor.

## Defectos reproducidos y correcciones

| ID | Antes | Corrección | Resultado |
| --- | --- | --- | --- |
| D01 | `display: flex` de paginación/avisos prevalecía sobre hidden. Se veían controles sin registros y un aviso residual tras restaurar datos | Regla `.sp-page[hidden], .sp-page [hidden] { display: none; }` en CSS del listado | QA03, QA11 y QA31 pasan |
| D02 | El listado usaba `id="main"`, mientras el shell busca `main-content` al perder la sesión. El contenido permanecía visible durante pageshow | Main con id compartido, clase container y hidden inicial; inicialización del listado solo después de `requireSession()` | QA26 pasa; QA22-QA25 y QA34-QA36 también pasan |

Los cambios del listado son puntuales y deben revisarse con Lucas; Emilio verifica la integración con U04 y revisa U08. No se modificaron las reglas de negocio del store ni el shell. En U06 se actualizó un comentario del contrato ya integrado. La regresión U06 se adaptó al parámetro de guardado que el listado limpia, al nuevo botón de salida del shell y a comprobar el login final cuando shell y formulario solicitan la misma redirección. Aprobó 33/33 casos adicionales del formulario; conserva su alcance original y no sustituye la QA integrada.

## Evidencias

| Archivo en `docs/evidencias-u08/` | Contenido |
| --- | --- |
| `resultados-u08.json` | Versión, fecha, base, hashes y 37 resultados |
| `resultados-u08.md` | Matriz automatizada completa |
| `diagnostico-inicial.json` | Primera ejecución 33/37, sobre la base sin correcciones |
| `regresion-u06.json`, `regresion-u06.md` | 33/33 casos del formulario, ejecutados después de los ajustes |
| `pr-integrados.json` | Siete PR fusionados, cuentas, ramas y commits |
| `u08-login-error.png` | Error de acceso real |
| `u08-panel-escritorio.png` | Panel con contador real de activas |
| `u08-listado-vacio.png` | Estado vacío sin paginación visible |
| `u08-alta-listado.png` | Fila y confirmación de guardado |
| `u08-busqueda-vacia.png` | Sin coincidencias y limpieza |
| `u08-edicion-escritorio.png` | Edición con datos precargados |
| `u08-formulario-errores.png` | Mensajes del store y foco |
| `u08-menu-movil-375.png` | Shell real con menú abierto |
| `u08-formulario-movil-375.png` | Formulario y errores a 375 px |
| `u08-listado-movil-375.png` | Listado con scroll horizontal propio |

Las capturas son imágenes tomadas de la aplicación ejecutada. La evidencia U06 anterior queda identificada como histórica y aislada; no se usa para justificar la integración actual.

## Participación comprobada

| Integrante / cuenta | Commit propio | PR integrado y tarea |
| --- | --- | --- |
| Emilio / emiliolj1 | `5ab8c46`, `ae2b20c` | #2 U01, #5 U04 |
| Carlos / cfacundo7 | `09bcce2`, `ba6304d` | #3 U02, #7 U05 |
| Lucas / lucas33-dev | `7976994`, `94dfe54` | #1 U03, #6 U07 |
| Nacho / NachoF1390 | `ac8a8cb` | #4 U06 |

Los siete merges se comprobaron contra la API de GitHub y el historial de development. La cuenta de un PR puede diferir del nombre configurado como autor en Git; se conserva la cuenta verificada. No se emitieron aprobaciones de PR ni se fusionó nada desde esta tarea.

## Entrega a Emilio para U09

- [x] Dependencias U02/U04/U05/U06/U07 integradas.
- [x] Contrato real del shell compatible con formulario y listado.
- [x] Recorrido integral ejecutado; 37/37 casos finales pasan.
- [x] Consola y recursos revisados por la suite.
- [x] Capturas de escritorio/móvil inspeccionadas.
- [x] README con ejecución, demo, rutas, almacenamiento y ausencia de backend.
- [x] Cuatro aportes identificables en development.
- [ ] Completar el nombre completo de Lucas con el dato del equipo.
- [ ] Lucas revisa los dos ajustes del listado y Emilio revisa U08.
- [ ] Publicar el commit/PR U08 con la cuenta de Nacho.
- [ ] Emilio realiza/aprueba U09; la decisión sobre main corresponde al equipo.

Para repetir el recorrido manual, seguir los pasos del README. Para repetir todos los casos, ejecutar `node tests/u08/run-browser-tests.mjs` con Playwright/Chromium instalados. Los contextos de prueba son independientes del navegador habitual.

## Límites de esta verificación

Se comprobó Chromium en Linux a dos anchos; no se ejecutó una matriz de navegadores distintos ni sobre dispositivos físicos. El acceso y estado son simulaciones locales. La QA verifica el frontend de Unidad 4 y no la API del TPI completo. Los reportes conservan la base y los hashes para distinguir cambios posteriores.
