import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { full_name, address_line_1, address_line_2, city, state, postal_code, country, additional_details } = body;

  if (!full_name || !address_line_1 || !city || !state || !postal_code || !country) {
    return new NextResponse('Missing required fields', { status: 400 });
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .insert({
      user_id: user.id,
      full_name,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      additional_details,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating shipping address:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(data);
}
