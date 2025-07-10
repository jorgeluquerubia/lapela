import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  const { product_id, bid_amount } = await request.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user_id = session.user.id;

  // Fetch product to validate bid and check if user is owner
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, price, type, user_id')
    .eq('id', product_id)
    .single();

  if (productError || !product) {
    console.error('Error fetching product for bid validation:', productError);
    return new NextResponse('Product not found', { status: 404 });
  }

  if (product.type !== 'auction') {
    return new NextResponse('This is not an auction product', { status: 400 });
  }

  if (product.user_id === user_id) {
    return new NextResponse('You cannot bid on your own product', { status: 403 });
  }

  if (bid_amount <= product.price) {
    return new NextResponse('Your bid must be higher than the current price', { status: 400 });
  }

  // Insert new bid
  const { error: bidInsertError } = await supabase
    .from('bids')
    .insert({ product_id, user_id, bid_amount });

  if (bidInsertError) {
    console.error('Error inserting bid:', bidInsertError);
    return new NextResponse(JSON.stringify({ error: bidInsertError.message }), { status: 500 });
  }

  // Update product's current price and bid count
  const { error: productUpdateError } = await supabase
    .from('products')
    .update({ price: bid_amount, bid_count: (product.bid_count || 0) + 1 })
    .eq('id', product_id);

  if (productUpdateError) {
    console.error('Error updating product price after bid:', productUpdateError);
    // Consider rolling back the bid insert if this fails, or handle eventual consistency
    return new NextResponse(JSON.stringify({ error: productUpdateError.message }), { status: 500 });
  }

  return new NextResponse(JSON.stringify({ message: 'Bid placed successfully' }), { status: 200 });
}
