import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id: product_id } = params;

  if (!product_id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  // Step 1: Fetch all bids for the product
  const { data: bids, error: bidsError } = await supabase
    .from('bids')
    .select('*')
    .eq('product_id', product_id)
    .order('created_at', { ascending: false });

  if (bidsError) {
    console.error('Error fetching bids:', bidsError);
    return NextResponse.json({ error: bidsError.message }, { status: 500 });
  }

  if (!bids || bids.length === 0) {
    return NextResponse.json([]);
  }

  // Step 2: Get unique user IDs from the bids
  const userIds = Array.from(new Set(bids.map(bid => bid.user_id)));

  // Step 3: Fetch the profiles for those user IDs
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching bidder profiles:', profilesError);
    // Proceed without profiles if there's an error, but the frontend might break.
    // It's better to return the bids with null usernames.
  }

  // Step 4: Create a map for easy profile lookup and merge the data
  const profilesMap = new Map(profiles?.map(p => [p.id, p.username]));

  const bidsWithUsernames = bids.map(bid => ({
    ...bid,
    user: {
      username: profilesMap.get(bid.user_id) || 'Usuario desconocido'
    }
  }));

  return NextResponse.json(bidsWithUsernames);
}
