import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const supabase = createClient();

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 2. Fetch the product to check its status and seller
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('status, user_id')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    return new NextResponse(JSON.stringify({ error: 'Product not found' }), { status: 404 });
  }

  // 3. Business logic validation
  if (product.user_id === user.id) {
    return new NextResponse(JSON.stringify({ error: 'You cannot buy your own product' }), { status: 403 });
  }

  if (product.status !== 'available') {
    return new NextResponse(JSON.stringify({ error: 'This product is no longer available' }), { status: 400 });
  }

  // 4. Create a new order with 'pending_payment' status
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      product_id: productId,
      buyer_id: user.id,
      seller_id: product.user_id,
      status: 'pending_payment',
    });

  if (orderError) {
    console.error('Error creating order:', orderError);
    return new NextResponse(JSON.stringify({ error: 'Could not initiate the purchase' }), { status: 500 });
  }

  // 5. Update the product status to 'pending_payment'
  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update({
      status: 'pending_payment',
      buyer_id: user.id,
    })
    .eq('id', productId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error updating product status:', updateError);
    // In a real-world scenario, you might want to roll back the order creation
    return new NextResponse(JSON.stringify({ error: 'Could not complete the purchase' }), { status: 500 });
  }

  // 6. Return the updated product
  return NextResponse.json(updatedProduct);
}
