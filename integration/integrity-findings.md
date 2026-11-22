# Auditoría de integridad y notificaciones de La Pela

La comprobación se hizo el 22 de noviembre de 2026 en el piloto de Ubuntu, con Supabase local, cuentas y registros ficticios, y Stripe en sandbox. La auditoría SQL es de solo lectura. Las comprobaciones que cambian estados usaron datos de prueba.

## Incidencias reproducidas

| Prioridad | Escenario | Resultado observado |
| --- | --- | --- |
| Alta | El comprador abre Checkout. El vendedor confirma el cobro en persona antes de que el comprador pague con tarjeta. | Stripe aceptó 25 € de prueba. La Pela conservó el pedido como `completed / in_person`, respondió HTTP 500 al webhook y dejó el pago de Stripe fuera de su registro y de sus avisos. Antes de cerrar en persona, hay que resolver el estado de cualquier Checkout asociado. |
| Alta | La misma cuenta tiene un pedido y un aviso asociados a un anuncio marcado `live` en la base local. Después consulta la app en `sandbox`. | El detalle del pedido respondió 404, pero Mi actividad devolvió el pedido y la campana devolvió el aviso. La prueba se limitó a registros ficticios de la propia cuenta. La separación de entornos debe aplicarse también a actividad y notificaciones. |
| Media | Dos usuarios guardan simultáneamente el mismo anuncio. Las dos operaciones alcanzan la comprobación de antispam antes de insertar el aviso. | Se guardaron dos favoritos correctamente y se enviaron dos avisos `favorite_received` al mismo vendedor. La ventana antispam de una hora se incumple bajo concurrencia. |
| Media | Caduca el pedido adjudicado en una subasta cuyo plazo de puja ya terminó. | El pedido quedó cancelado y el anuncio expirado. Ambos avisos dijeron que el artículo volvía a estar disponible. El texto debe reflejar el estado resultante. |

## Controles verificados

- Reservas concurrentes, correspondencia entre pujas y adjudicación, importes, estados y pertenencia de mensajes y valoraciones.
- Una sola notificación de pago aunque el comprador reintente en paralelo. El envío, la recepción y los mensajes llegaron a la parte esperada. Abrir el pedido solo marcó los avisos de la propia cuenta. La campana mostró el aviso y el enlace al pedido. Marcar todos como vistos vació el panel y persistió la lectura.
- Una alerta de cierre próximo y una de cierre definitivo por seguidor, pese a disparar el mantenimiento desde cinco sesiones simultáneas y repetirlo.
- Un importe de Stripe con un céntimo de diferencia se rechazó. El pedido, el anuncio, el registro de eventos y los avisos conservaron su estado.
- Tres reenvíos simultáneos de un evento válido de Stripe respondieron HTTP 200. PostgreSQL conservó un evento registrado y un aviso de pago. Una petición sin firma válida respondió HTTP 400.

De las 16 comprobaciones SQL, 14 quedaron a cero. Las otras dos detectaron las inconsistencias persistidas por los ensayos de doble vía de cobro y favoritos duplicados. El caso de aislamiento se limpió al concluir y la prueba de texto de caducidad se revirtió en su transacción.
