import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  const { product_id, receiver_id, content } = await request.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const sender_id = session.user.id;

  if (sender_id === receiver_id) {
    return new NextResponse('You cannot send a message to yourself', { status: 400 });
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      product_id,
      sender_id,
      receiver_id,
      content,
    });

  if (error) {
    console.error('Error sending message:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new NextResponse(JSON.stringify({ message: 'Message sent successfully' }), { status: 200 });
}
