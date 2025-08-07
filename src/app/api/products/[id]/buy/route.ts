import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;

  // 1. Get authorization header and validate user
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized - No token provided' }), { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseForAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await supabaseForAuth.auth.getUser(token);

  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized - Invalid token' }), { status: 401 });
  }

  // Create a Supabase client with the service role for admin-level operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Fetch the product to check its status
  const { data: product, error: fetchError } = await supabaseAdmin
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

  // 4. Update the product to mark as sold
  const { data: updatedProduct, error: updateError } = await supabaseAdmin
    .from('products')
    .update({
      status: 'sold',
      buyer_id: user.id,
    })
    .eq('id', productId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error marking product as sold:', updateError);
    return new NextResponse(JSON.stringify({ error: 'Could not complete the purchase' }), { status: 500 });
  }

  // 5. Return the updated product
  return NextResponse.json(updatedProduct);
}
