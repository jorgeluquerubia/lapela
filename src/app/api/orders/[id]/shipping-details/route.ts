import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  const supabase = createClient();

  // 1. Get the current user from the session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Fetch the order and the associated product's seller_id
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      shipping_address_id,
      products (
        user_id
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError) {
    console.error('Error fetching order:', orderError);
    return new NextResponse(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  // 3. Verify that the current user is the seller of the product
  // The nested structure from Supabase can be an array or an object depending on the relationship.
  // We'll handle both cases to be safe.
  const productInfo = Array.isArray(order.products) ? order.products[0] : order.products;
  const sellerId = (productInfo as { user_id: string } | null)?.user_id;
  
  if (!sellerId || sellerId !== user.id) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // 4. Fetch the shipping address using the ID from the order
  const { data: shippingAddress, error: addressError } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('id', order.shipping_address_id)
    .single();

  if (addressError) {
    console.error('Error fetching shipping address:', addressError);
    return new NextResponse(JSON.stringify({ error: 'Shipping address not found' }), { status: 404 });
  }

  // 5. Return the shipping address
  return NextResponse.json(shippingAddress);
}
