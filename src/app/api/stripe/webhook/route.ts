import {NextResponse} from 'next/server';
import type Stripe from 'stripe';
import {marketplaceEnvironment, stripeSandboxPayments} from '@/lib/payment-mode';
import {stripe} from '@/lib/payments';
import {admin, rpc} from '@/models/marketplace';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || process.env.LAPELA_PAYMENTS_MODE === 'simulated') {
    return NextResponse.json({error: 'Webhook sin configurar'}, {status: 503});
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), request.headers.get('stripe-signature') || '', secret);
  } catch {
    return NextResponse.json({error: 'Firma no válida'}, {status: 400});
  }
  if (event.livemode !== !stripeSandboxPayments()) {
    return NextResponse.json({error: 'Evento de otro modo de Stripe'}, {status: 400});
  }
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return NextResponse.json({received: true});
  }

  const session = event.data.object;
  const orderId = session.metadata?.order_id;
  if (session.payment_status !== 'paid' || session.currency !== 'eur' || !orderId) {
    return NextResponse.json({received: true});
  }

  try {
    const {data: order, error} = await admin().from('lp_orders').select('id,listing:lp_listings!inner(environment)')
      .eq('id', orderId).eq('listing.environment', marketplaceEnvironment()).maybeSingle();
    if (error) throw error;
    if (!order) return NextResponse.json({received: true});

    const paymentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    const shipping = session.collected_information?.shipping_details
      ?? (session as Stripe.Checkout.Session & {shipping_details?: unknown}).shipping_details
      ?? null;
    await rpc('lp_confirm_payment', {
      p_event: event.id,
      p_order: orderId,
      p_session: session.id,
      p_payment: paymentId,
      p_amount: session.amount_total,
      p_address: shipping,
    });
    return NextResponse.json({received: true});
  } catch {
    return NextResponse.json({error: 'No se ha podido registrar el evento'}, {status: 500});
  }
}
