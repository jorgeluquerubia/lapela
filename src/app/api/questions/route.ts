import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// GET - Obtener preguntas de un producto
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get('product_id');

  if (!product_id) {
    return new NextResponse(JSON.stringify({ error: 'Product ID is required' }), { status: 400 });
  }

  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        question,
        answer,
        created_at,
        answered_at,
        user_id
      `)
      .eq('product_id', product_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      // If table doesn't exist, return empty array instead of error
      if (error.message.includes('relation "questions" does not exist')) {
        return NextResponse.json([]);
      }
      return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Get usernames for each question
    const questionsWithUsernames = await Promise.all(
      (questions || []).map(async (question) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', question.user_id)
          .single();
        
        return {
          ...question,
          user: {
            username: profile?.username || null
          }
        };
      })
    );

    return NextResponse.json(questionsWithUsernames);
  } catch (err) {
    console.error('Unexpected error fetching questions:', err);
    return NextResponse.json([]);
  }
}

// POST - Crear nueva pregunta
export async function POST(request: Request) {
  const { product_id, question } = await request.json();
  
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
  
  const user_id = user.id;

  // Validate input
  if (!product_id || !question?.trim()) {
    return new NextResponse(JSON.stringify({ error: 'Product ID and question are required' }), { status: 400 });
  }

  // Create a new Supabase client with the user's auth token
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

  // Insert question using the admin client
  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert({
      product_id,
      user_id,
      question: question.trim(),
    })
    .select(`
      id,
      question,
      answer,
      created_at,
      answered_at,
      user_id
    `)
    .single();

  if (error) {
    console.error('Error creating question:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Get username for the question
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user_id)
    .single();
  
  // Return question with user info
  const questionWithUser = {
    ...data,
    user: {
      username: profile?.username || null
    }
  };

  return NextResponse.json(questionWithUser);
}
