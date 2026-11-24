---
id: LP-FEAT-024
type: FEATURE
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-24
requested_by: usuario
source: conversación
owner: ingeniería
github_issue: https://github.com/jorgeluquerubia/lapela/issues/99
related_specs: [LP-FEAT-023]
dependencies: [LP-FEAT-023]
cross_cutting_concerns: [accesibilidad, privacidad, datos]
---

# LP-FEAT-024 · Refinamientos y catálogo para la beta guiada

- [x] `AC-01` La confirmación explica la reserva y el total. Actividad enlaza con cada tarea.
- [x] `AC-02` Los textos y la jerarquía tipográfica guían los recorridos en móvil.
- [x] `AC-03` El formulario recupera el borrador y conserva la separación por cuenta.
- [x] `AC-04` Las partes de un pedido pueden registrar una incidencia con referencia.
- [x] `AC-05` Las búsquedas guardadas notifican coincidencias nuevas dentro del mismo entorno.
- [x] `AC-06` El catálogo de ejemplo incorpora artículos y subastas identificados y sin transacciones. El ensayo automatizado cubre publicación, reserva, puja y pedido.
- [ ] `AC-07` Sesión con personas invitadas en iPhone y Android físicos.

Se mantienen los pagos de la beta en modo simulado. Los anuncios de muestra no se insertan como transacciones reales.


## Verificación

La compilación se ejecutó contra el piloto loopback con pagos simulados. La migración se aplicó a Supabase de pruebas. Pasaron 19 recorridos Playwright, incluidos borrador, avisos sin duplicados, privacidad de incidencias, resolución por soporte y confirmación y recuperación por correo en Mailpit. La edición del piloto tiene cinco artículos con dos cierres. El catálogo de muestra contiene doce anuncios, cinco en modalidad de subasta.

Chromium, Firefox y WebKit comprobaron portada de ejemplos, subastas y ayuda a 320, 390 y 1440 px. De las 122 pruebas unitarias seleccionadas, pasan 111. Las mismas 11 fallan en `main` con expectativas anteriores a la interfaz actual.

Para producción falta ejecutar la migración versionada antes de activar esta versión y verificar el proveedor de correo con las cuentas invitadas.
