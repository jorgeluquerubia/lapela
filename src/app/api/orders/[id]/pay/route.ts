import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  const supabase = createClient();

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Fetch the order to verify ownership and status
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('buyer_id, status')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    return new NextResponse(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  if (order.buyer_id !== user.id) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  if (order.status !== 'pending_shipping') {
    return new NextResponse(JSON.stringify({ error: 'This order cannot be paid for' }), { status: 400 });
  }

  // 3. Update the order status to 'pending_shipping' (payment processed)
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'pending_shipping' })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating order status:', updateError);
    return new NextResponse(JSON.stringify({ error: 'Could not process payment' }), { status: 500 });
  }

  return NextResponse.json(updatedOrder);
}
