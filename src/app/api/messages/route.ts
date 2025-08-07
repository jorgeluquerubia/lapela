import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { product_id, receiver_id, content } = await request.json();

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

  const sender_id = user.id;

  if (sender_id === receiver_id) {
    return new NextResponse(JSON.stringify({ error: 'You cannot send a message to yourself' }), { status: 400 });
  }

  // Use the admin client to bypass RLS policies after user is authorized
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: newMessage, error } = await supabaseAdmin
    .from('messages')
    .insert({
      product_id,
      sender_id,
      receiver_id,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(newMessage);
}
