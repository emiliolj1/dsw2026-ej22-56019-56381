# Pruebas integradas U08

Fecha UTC: 2026-10-01T00:34:07.153Z

Navegador: Chromium 153.0.8010.0 (linux)

Base: d4c5f2d31264be46f964887c65dff768500252e3

Login, shell, panel, store, listado y formulario reales del repositorio, servidos por HTTP sin sustitutos.

**No se usan fixtures.** Cada caso inicia un contexto nuevo y accede mediante el login real cuando requiere sesión.

| Caso | Prueba | Resultado esperado | Resultado |
| --- | --- | --- | --- |
| QA01 | Login inválido y válido | Error visible, foco y acceso al panel con credenciales correctas. | PASS |
| QA02 | Panel: contador real y enlaces | Cuenta solo activas no eliminadas; enlaces y sección activa correctos. | PASS |
| QA03 | Listado vacío | Mensaje, acción de crear y paginación oculta. | PASS |
| QA04 | Alta válida y persistencia | Recorta textos, guarda, muestra fila y aviso; persiste al refrescar. | PASS |
| QA05 | Obligatorios | Mensajes del store, foco en nombre y ninguna escritura. | PASS |
| QA06 | Límites inferiores | Mensajes del store, foco en nombre y ninguna escritura. | PASS |
| QA07 | Límites superiores | Mensajes del store, foco en nombre y ninguna escritura. | PASS |
| QA08 | Mínimos válidos | Acepta ambos límites exactos y muestra el registro en la tabla. | PASS |
| QA09 | Máximos válidos | Acepta ambos límites exactos y muestra el registro en la tabla. | PASS |
| QA10 | Nombre duplicado normalizado | Rechaza tildes, mayúsculas y espacios equivalentes sin guardar. | PASS |
| QA11 | Búsqueda y limpieza | Filtra por nombre, muestra vacío sin coincidencias y restaura la tabla. | PASS |
| QA12 | Edición conserva identidad y fecha | Carga desde Editar; modifica el mismo registro y persiste. | PASS |
| QA13 | Edición con el mismo nombre | El registro no se considera duplicado de sí mismo. | PASS |
| QA14 | Edición a nombre duplicado | No altera ninguno de los dos registros. | PASS |
| QA15 | Estado inactivo y contador del panel | La fila indica Inactiva y el contador visual pasa de 1 a 0. | PASS |
| QA16 | Alta inactiva y reactivación | No cuenta al crear; al reactivar cuenta 1, sin duplicar. | PASS |
| QA17 | Cancelar alta | Vuelve al listado sin escribir datos ni mostrar guardado. | PASS |
| QA18 | Cancelar edición | Vuelve al listado sin escribir datos ni mostrar guardado. | PASS |
| QA19 | Eliminación cancelada | El diálogo cancelado conserva la fila y todos los datos. | PASS |
| QA20 | Eliminación confirmada y persistente | Oculta la fila, conserva el borrado lógico y actualiza el contador. | PASS |
| QA21 | Paginación y búsqueda desde otra página | Recorre 5/5/2 registros y reinicia página al filtrar. | PASS |
| QA22 | URL privada: dashboard.html | Una sesión nueva sin acceso vuelve al login. | PASS |
| QA23 | URL privada: specialties.html | Una sesión nueva sin acceso vuelve al login. | PASS |
| QA24 | URL privada: specialty-form.html | Una sesión nueva sin acceso vuelve al login. | PASS |
| QA25 | Cerrar sesión y botón Atrás | La salida impide volver al panel, al listado y al formulario. | PASS |
| QA26 | Shell y listado al restaurar sin sesión | El evento pageshow oculta el contenido y redirige al login. | PASS |
| QA27 | Id inexistente | Aviso accesible, campos/guardar bloqueados y retorno al listado. | PASS |
| QA28 | Id eliminado | Aviso accesible, campos/guardar bloqueados y retorno al listado. | PASS |
| QA29 | Id vacío | Aviso accesible, campos/guardar bloqueados y retorno al listado. | PASS |
| QA30 | HTML literal en listado y formulario | Los datos se muestran como texto sin crear elementos HTML. | PASS |
| QA31 | Recuperación explícita de datos corruptos | Cancelar conserva el valor; confirmar respalda y vacía sin aviso residual. | PASS |
| QA32 | Fallo al guardar y reintento | Muestra un error, conserva los datos y permite guardar después. | PASS |
| QA33 | Recorrido de teclado del formulario | Recorre nombre, descripción, estado, cancelar y guardar con Enter. | PASS |
| QA34 | Menú móvil, Escape y navegación | A 375 px abre/cierra, devuelve foco y navega a especialidades. | PASS |
| QA35 | Formulario móvil 375 px | Campos/botones accesibles y sin desborde, también con errores. | PASS |
| QA36 | Listado móvil y tabla desplazable | La tabla usa desplazamiento propio, sin desbordar la página. | PASS |
| QA37 | Escritorio y módulos futuros | Sidebar visible, botón móvil oculto y módulos futuros deshabilitados. | PASS |

Total: 37/37.
