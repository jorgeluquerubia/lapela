import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: question_id } = params;
  const { answer } = await request.json();

  // Get authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized - No token provided' }), { status: 401 });
  }

  // Verify the token and get user
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized - Invalid token' }), { status: 401 });
  }

  if (!answer?.trim()) {
    return new NextResponse(JSON.stringify({ error: 'Answer is required' }), { status: 400 });
  }

  // Create a new Supabase client with the user's auth token to enforce RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // Update the question with the answer
  const { data: updatedQuestion, error } = await supabaseAdmin
    .from('questions')
    .update({
      answer: answer.trim(),
      answered_at: new Date().toISOString(),
    })
    .eq('id', question_id)
    .select(`id, question, answer, created_at, answered_at, user_id`)
    .single();

  if (error) {
    console.error('Error updating question:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Fetch the profile of the user who asked the question
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', updatedQuestion.user_id)
    .single();

  // Combine the data to match the frontend's expected structure
  const responseData = {
    ...updatedQuestion,
    user: {
      username: profile?.username || null,
    },
  };

  return NextResponse.json(responseData);
}
