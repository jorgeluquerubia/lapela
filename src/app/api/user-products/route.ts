import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();

  // 1. Authenticate the user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("Error de autenticación en /api/user-products:", authError);
    return new NextResponse(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), { status: 401 });
  }

  // 2. Fetch products where the user is either the seller OR the buyer
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .or(`user_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user products:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(products);
}
