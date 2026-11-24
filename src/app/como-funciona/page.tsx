import Link from 'next/link';

export default function How(){
  return (
    <article className="prose-page">
      <h1>Cómo funciona La Pela</h1>
      <ol className="how-steps">
        <li><strong>Elige un artículo.</strong> Compra a precio fijo o puja en una subasta.</li>
        <li><strong>Reserva y paga.</strong> Tienes 48 horas en compra directa o 24 horas si ganas una subasta.</li>
        <li><strong>Acuerda la entrega.</strong> El chat del pedido se abre al reservar.</li>
      </ol>

      <h2>Comprar a precio fijo</h2>
      <p>Verás el precio y, si hay envío, sus gastos antes de confirmar. Al reservar, la ficha deja de estar disponible para otros compradores.</p>

      <h2>Pujar en una subasta</h2>
      <p>Puedes empezar con el precio de salida. Cada puja siguiente debe superar la anterior en al menos 1 €. Si alguien puja en los últimos dos minutos, la subasta sigue abierta hasta dos minutos después de esa puja.</p>
      <p>Consulta el resultado en Mi actividad. Si ganas, encontrarás allí el pedido y el plazo para pagar.</p>

      <h2>Recibir o recoger tu artículo</h2>
      <p>El vendedor organiza el envío y añade el seguimiento. Para una recogida, acordad el lugar y la hora en el chat del pedido. Cuando tengas el artículo, revisa su estado y confirma la recepción.</p>
      <p>Si surge un problema con la entrega o con el artículo, abre «Tengo un problema» desde el pedido para obtener una referencia.</p>

      <h2 id="reglas">Reglas de la comunidad</h2>
      <ul>
        <li>Usa tus propias fotos y describe el estado, los defectos y los accesorios.</li>
        <li>Cuida tus datos personales. Deja los detalles de la entrega para el chat del pedido.</li>
        <li>Publica solo artículos que puedas vender legalmente.</li>
        <li>Usa «Informar de este anuncio» si encuentras una publicación problemática.</li>
      </ul>

      <h2>Estado de la beta</h2>
      <p>Cuando se muestra el aviso de pagos simulados, las operaciones de prueba no generan cargos. Las fichas de ejemplo están identificadas y se pueden explorar sin hacer compras ni pujas.</p>
      <Link className="button primary" href="/">Explorar La Pela</Link>
    </article>
  );
}
