# Resultado automatizado U06

Fecha: 2026-09-29T21:24:37.354Z

Navegador: Chromium 153.0.8010.0

Base development: 3736bbe53aafc2561bcb29c6a278765e3ee8aa24

Alcance: U06 con session.js, specialties-store.js y style.css reales; shell y destino del listado de prueba si faltan.

**Este reporte no cierra la QA integral de U08.**

| Caso | Prueba | Resultado |
| --- | --- | --- |
| F01 | Acceso directo sin sesión | PASS |
| F02 | Login real: credenciales inválidas y válidas | PASS |
| F03 | Alta: título, campos vacíos y activa por defecto | PASS |
| F04 | Campos obligatorios: errores, foco y ninguna escritura | PASS |
| F05 | Límites inferiores: nombre 2 y descripción 9 | PASS |
| F06 | Mínimos válidos: nombre 3 y descripción 10 | PASS |
| F07 | Máximos válidos: nombre y descripción 100 | PASS |
| F08 | Límites superiores: ambos campos 101 | PASS |
| F09 | Nombre duplicado: mayúsculas, tildes y espacios | PASS |
| F10 | Alta válida: recorte, datos reales y persistencia tras refrescar | PASS |
| F11 | Alta inactiva: contador del store excluye el registro | PASS |
| F12 | Edición: carga de campos y título | PASS |
| F13 | Edición de inactiva: selección correcta | PASS |
| F14 | Edición sin cambiar nombre: conserva id y createdAt | PASS |
| F15 | Edición a inactiva: contador del store pasa de 1 a 0 | PASS |
| F16 | Edición duplicada: no reemplaza ningún registro | PASS |
| F17 | Cancelar alta: navegación sin escritura | PASS |
| F18 | Cancelar edición: conserva todos los datos | PASS |
| F19 | Identificador inexistente: aviso y guardado bloqueado | PASS |
| F20 | Registro eliminado: no puede editarse | PASS |
| F21 | Parámetro id vacío: no se interpreta como alta | PASS |
| F22 | Datos corruptos al editar: aviso sin sobrescribir | PASS |
| F23 | Datos corruptos al crear: aviso sin sobrescribir | PASS |
| F24 | Fallo de almacenamiento: no escribe y permite reintentar | PASS |
| F25 | Eliminación concurrente: el store rechaza la actualización | PASS |
| F26 | Contenido HTML: se trata como texto | PASS |
| F27 | Sesión retirada antes de guardar: redirige y no escribe | PASS |
| F28 | pageshow vuelve a comprobar la sesión | PASS |
| F29 | Teclado: recorre los campos y guarda con Enter | PASS |
| F30 | Doble envío de edición: una sola escritura | PASS |
| F31 | Móvil 375 px: campos, botones y errores sin desborde | PASS |
| F32 | Store U03: borrado lógico, contador y persistencia | PASS |
| F33 | Logout real del panel: elimina sesión y protege su URL | PASS |

Total: 33/33.
