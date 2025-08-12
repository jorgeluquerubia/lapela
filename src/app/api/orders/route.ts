import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { product_id, seller_id, shipping_address_id } = body;

  if (!product_id || !seller_id || !shipping_address_id) {
    return new NextResponse('Missing required fields', { status: 400 });
  }

  // Create the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      product_id,
      buyer_id: user.id,
      seller_id,
      shipping_address_id,
      status: 'pending_shipping', // The user has paid and is now pending shipping
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return new NextResponse(JSON.stringify({ error: orderError.message }), { status: 500 });
  }

  // Update the product status to 'sold'
  const { error: productError } = await supabase
    .from('products')
    .update({ status: 'sold' })
    .eq('id', product_id);

  if (productError) {
    console.error('Error updating product status:', productError);
    // In a real-world scenario, you might want to roll back the order creation
    return new NextResponse(JSON.stringify({ error: productError.message }), { status: 500 });
  }

  return NextResponse.json(orderData);
}
