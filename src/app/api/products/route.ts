import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = createClient()
  const searchTerm = searchParams.get('q');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const location = searchParams.get('location');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 12; // Number of products per page
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Base query for products, excluding 'paid' ones.
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' }) // Request total count
    .neq('status', 'paid');

  if (searchTerm) {
    // Use full-text search for better results
    query = query.textSearch('name, description', `'${searchTerm}'`, {
      type: 'websearch',
      config: 'spanish'
    });
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

  // Apply ordering and pagination
  const { data: products, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching products with filters:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Step 2: If there are sold products, fetch the buyer profiles.
  const soldProducts = products.filter(p => p.status === 'sold' && p.buyer_id);
  if (soldProducts.length > 0) {
    const buyerIds = soldProducts.map(p => p.buyer_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', buyerIds);

    if (profilesError) {
      console.error('Error fetching buyer profiles:', profilesError);
      // Non-critical error, we can proceed without buyer names.
    } else {
      // Step 3: Merge the buyer information into the products list.
      const profilesMap = new Map(profiles.map(p => [p.id, p]));
      products.forEach(product => {
        if (product.buyer_id && profilesMap.has(product.buyer_id)) {
          const buyerProfile = profilesMap.get(product.buyer_id);
          // To match the structure expected by the frontend, we'll add a 'buyer' object.
          product.buyer = { 
            id: buyerProfile?.id,
            username: buyerProfile?.username || 'Desconocido' 
          };
        }
      });
    }
  }

  return NextResponse.json({ products, totalCount: count });
}
