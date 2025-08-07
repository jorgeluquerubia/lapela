import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { product_id, bid_amount } = await request.json();
  
  // 1. Get authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized - No token provided' }), { status: 401 });
  }

  // 2. Verify the token and get user
  const token = authHeader.replace('Bearer ', '');
  // Create a temporary client to validate the token
  const supabaseForAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await supabaseForAuth.auth.getUser(token);
  
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized - Invalid token' }), { status: 401 });
  }
  
  const user_id = user.id;

  // 2. Validate input
  if (!product_id || !bid_amount) {
    return new NextResponse(JSON.stringify({ error: 'Product ID and bid amount are required' }), { status: 400 });
  }

  const bid = parseFloat(bid_amount);
  if (isNaN(bid) || bid <= 0) {
    return new NextResponse(JSON.stringify({ error: 'Invalid bid amount' }), { status: 400 });
  }

  // Create a Supabase client with the service role for admin-level operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // 3. Fetch product to validate bid
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, price, type, user_id, bid_count')
    .eq('id', product_id)
    .single();

  if (productError || !product) {
    return new NextResponse(JSON.stringify({ error: 'Product not found' }), { status: 404 });
  }

  // 4. Perform business logic validation
  if (product.type !== 'auction') {
    return new NextResponse(JSON.stringify({ error: 'This is not an auction product' }), { status: 400 });
  }

  if (product.user_id === user_id) {
    return new NextResponse(JSON.stringify({ error: 'You cannot bid on your own product' }), { status: 403 });
  }

  if (bid <= product.price) {
    return new NextResponse(JSON.stringify({ error: `Your bid must be higher than the current price of ${product.price} €` }), { status: 400 });
  }

  // 5. Insert the new bid first and select it back
  const { data: newBid, error: bidInsertError } = await supabaseAdmin
    .from('bids')
    .insert({ product_id, user_id, bid_amount: bid })
    .select()
    .single();

  if (bidInsertError || !newBid) {
    console.error('Error inserting bid record:', bidInsertError);
    return new NextResponse(JSON.stringify({ error: 'Could not place your bid.' }), { status: 500 });
  }

  // 6. Update product's current price and bid count
  const { data: updatedProduct, error: productUpdateError } = await supabaseAdmin
    .from('products')
    .update({ 
      price: bid,
      bid_count: (product.bid_count || 0) + 1 
    })
    .eq('id', product_id)
    .select('*') // Select all columns to return the full product object
    .single();

  if (productUpdateError) {
    console.error('Error updating product price after bid:', productUpdateError);
    // If this fails, we should ideally roll back the bid insert.
    // For now, we'll return an error indicating a partial failure.
    return new NextResponse(JSON.stringify({ error: 'Your bid was placed, but there was an error updating the product price.' }), { status: 500 });
  }

  // 7. Fetch the bidder's profile to return with the new bid
  const { data: bidderProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('id', user_id)
    .single();

  const newBidWithUser = {
    ...newBid,
    user: {
      username: bidderProfile?.username || 'Usuario desconocido'
    }
  };

  // 8. Return both the updated product and the new bid data
  return NextResponse.json({ updatedProduct, newBid: newBidWithUser });
}
