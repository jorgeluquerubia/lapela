import Link from 'next/link';
export default function LegacyChat(){return <div className="empty-state"><h1>Las conversaciones están en tus pedidos.</h1><p>Abre un pedido pagado desde Mi actividad para concretar la entrega.</p><Link className="button primary" href="/my-products">Ir a mis pedidos</Link></div>}
