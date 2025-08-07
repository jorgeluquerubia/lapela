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

  // 2. Fetch the product to check its status and owner
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('status, user_id')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    return new NextResponse(JSON.stringify({ error: 'Product not found' }), { status: 404 });
  }

  // 3. Business logic validation: ONLY the seller can mark as paid
  if (product.user_id !== user.id) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden - You are not the seller of this product' }), { status: 403 });
  }

  if (product.status !== 'sold') {
    return new NextResponse(JSON.stringify({ error: `Product cannot be marked as paid. Current status: ${product.status}` }), { status: 400 });
  }

  // 4. Update the product to mark as paid
  const { data: updatedProduct, error: updateError } = await supabaseAdmin
    .from('products')
    .update({
      status: 'paid',
    })
    .eq('id', productId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error marking product as paid:', updateError);
    return new NextResponse(JSON.stringify({ error: 'Could not update the product status' }), { status: 500 });
  }

  // 5. Return the updated product
  return NextResponse.json(updatedProduct);
}
