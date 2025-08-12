import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const { product_id, receiver_id, content } = await request.json();
  const supabase = createClient();

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const sender_id = user.id;

  if (sender_id === receiver_id) {
    return new NextResponse(JSON.stringify({ error: 'You cannot send a message to yourself' }), { status: 400 });
  }

  // 2. Check if there is a valid order to allow messaging
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status')
    .or(`buyer_id.eq.${sender_id},seller_id.eq.${sender_id}`)
    .eq('product_id', product_id)
    .single();

  if (orderError || !order) {
    return new NextResponse(JSON.stringify({ error: 'You cannot message about this product.' }), { status: 403 });
  }

  const allowedStatus = ['pending_shipping', 'shipped', 'completed'];
  if (!allowedStatus.includes(order.status)) {
    return new NextResponse(JSON.stringify({ error: 'You can only message the seller after payment.' }), { status: 403 });
  }

  // 3. Insert the message
  const { data: newMessage, error } = await supabase
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
