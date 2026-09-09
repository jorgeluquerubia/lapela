import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de compras · La Pela',
  description:
    'Condiciones de compra en La Pela: reserva exclusiva de 48 horas, pago acordado y advertencias sobre penalizaciones por impago.',
  alternates: {
    canonical: '/politica-de-compras',
  },
};

export default function PoliticaDeComprasPage() {
  return (
    <div className="page-shell">
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>Política de compras</span>
      </nav>

      <article className="prose-page">
        <span className="eyebrow">CONDICIONES DE LA PLATAFORMA</span>
        <h1>Política de compras y reservas</h1>
        <p className="muted text-lg">
          La Pela es un marketplace diseñado para eliminar el estrés y la incertidumbre en la compraventa de segunda mano.
          Aquí te explicamos las reglas que rigen cualquier adquisición en nuestra plataforma.
        </p>

        <section>
          <h2>1. Precio fijo y sin regateos</h2>
          <p>
            En La Pela el precio es el marcado por el vendedor (en compra directa) o el resultante de las pujas legítimas (en subastas).
            No existen ofertas privadas ni negociaciones paralelas.
          </p>
        </section>

        <section>
          <h2>2. Reserva exclusiva de 48 horas</h2>
          <p>
            Al pulsar en <strong>Comprar ahora</strong> y confirmar la operación, el artículo queda automáticamente <strong>reservado a tu nombre durante un plazo improrrogable de 48 horas</strong>.
          </p>
          <p>
            Durante estas 48 horas ningún otro comprador podrá adquirirlo ni pujar por él. Este tiempo está destinado a que comprador y vendedor coordinen la entrega y realicen el pago, ya sea a través de la plataforma o en persona.
          </p>
        </section>

        <section>
          <h2>3. Compromiso de pago y advertencia de penalizaciones</h2>
          <div className="notice my-4">
            <strong>Importante:</strong> Reservar un artículo implica un compromiso firme de compra. Si reservas un artículo y no completas el pago ni respondes al vendedor dentro de las 48 horas, te enfrentas a penalizaciones en tu cuenta.
          </div>
          <p>
            El bloqueo injustificado de artículos perjudica a los vendedores y perjudica la experiencia de otros usuarios. Por ello:
          </p>
          <ul>
            <li>
              <strong>Cancelación automática:</strong> si transcurren 48 horas sin confirmación de pago, la reserva caduca y el artículo vuelve a estar disponible públicamente.
            </li>
            <li>
              <strong>Riesgo de sanción:</strong> los usuarios que acumulen reservas caducadas o desatendidas podrán ser sancionados con la limitación temporal para realizar nuevas compras, la pérdida de prioridad o la suspensión permanente de su cuenta en La Pela.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Métodos de pago y entrega</h2>
          <p>
            Comprador y vendedor disponen del chat del pedido para concretar si el pago se realiza en persona en el momento de la recogida o si se efectúa de forma online con envío. En caso de pago en persona, el vendedor marcará el pago como recibido para completar la transacción.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-stone-200">
          <Link href="/" className="button primary">
            Explorar artículos
          </Link>
        </div>
      </article>
    </div>
  );
}
