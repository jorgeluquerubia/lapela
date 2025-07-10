import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const location = searchParams.get('location');

  let query = supabase.from('products').select('*');

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  if (category && category !== 'Todas') {
    query = query.eq('category', category);
  }

  if (minPrice) {
    query = query.gte('price', parseFloat(minPrice));
  }

  if (maxPrice) {
    query = query.lte('price', parseFloat(maxPrice));
  }

  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products with filters:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(data);
}