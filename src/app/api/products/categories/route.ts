import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  // Using a direct query to get distinct categories.
  // Note: For very large tables, creating a separate 'categories' table would be more performant.
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .neq('category', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  // Get unique categories from the result
  const uniqueCategories = Array.from(new Set(data.map(item => item.category)))
    .map(category => ({ category }));

  return NextResponse.json(uniqueCategories);
}
