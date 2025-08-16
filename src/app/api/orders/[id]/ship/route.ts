import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  const supabase = createClient();

  // 1. Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Fetch the order and verify the seller is the current user
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, products(user_id, id)')
    .eq('id', orderId)
    .single();

  if (orderError) {
    return new NextResponse(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  const sellerId = (Array.isArray(order.products) ? order.products[0] : order.products)?.user_id;
  if (!sellerId || sellerId !== user.id) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // 3. Check if the order status is 'paid'
  if (order.status !== 'paid') {
    return new NextResponse(JSON.stringify({ error: 'Order is not in a shippable state' }), { status: 400 });
  }

  const productId = (Array.isArray(order.products) ? order.products[0] : order.products)?.id;
  if (!productId) {
    return new NextResponse(JSON.stringify({ error: 'Product not found for this order' }), { status: 500 });
  }

  // 4. Update the status of the order and the product in a transaction
  // We'll use an RPC function for atomicity, let's call it `mark_order_as_shipped`.
  // Since we don't have the RPC function yet, we'll do it in two steps for now,
  // but this should be refactored into a single RPC call in a real-world scenario.

  const { error: productUpdateError } = await supabase
    .from('products')
    .update({ status: 'shipped' })
    .eq('id', productId);

  if (productUpdateError) {
    console.error('Error updating product status:', productUpdateError);
    return new NextResponse(JSON.stringify({ error: 'Failed to update product status' }), { status: 500 });
  }

  const { data: updatedOrder, error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: 'shipped' })
    .eq('id', orderId)
    .select()
    .single();

  if (orderUpdateError) {
    console.error('Error updating order status:', orderUpdateError);
    // Here you might want to try to revert the product status change
    return new NextResponse(JSON.stringify({ error: 'Failed to update order status' }), { status: 500 });
  }

  // 5. Return the updated order
  return NextResponse.json(updatedOrder);
}
