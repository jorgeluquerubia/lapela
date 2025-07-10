import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!product) {
    return new NextResponse('Product not found', { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { name, price, type, location, image, description } = body;

  // First, verify the product exists and belongs to the user
  const { data: existingProduct, error: fetchError } = await supabase
    .from('products')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingProduct) {
    console.error('Error fetching existing product:', fetchError);
    return new NextResponse('Product not found or unauthorized', { status: 404 });
  }

  if (existingProduct.user_id !== session.user.id) {
    return new NextResponse('Forbidden: You do not own this product', { status: 403 });
  }

  const { data, error } = await supabase
    .from('products')
    .update({ name, price, type, location, image, description })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // First, verify the product exists and belongs to the user
  const { data: existingProduct, error: fetchError } = await supabase
    .from('products')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingProduct) {
    console.error('Error fetching existing product for deletion:', fetchError);
    return new NextResponse('Product not found or unauthorized', { status: 404 });
  }

  if (existingProduct.user_id !== session.user.id) {
    return new NextResponse('Forbidden: You do not own this product', { status: 403 });
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}