import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// This endpoint should be protected, e.g., by a secret key or only accessible by admins.
// For now, we'll rely on Supabase RLS and user authentication if needed, but a cron job trigger is ideal.

export async function POST() {
  const supabase = createClient();

  // The logic below should ideally be in a single PostgreSQL function (RPC)
  // to ensure atomicity. We are writing it here to demonstrate the required steps.
  
  // 1. Find finished auctions that haven't been processed yet.
  const { data: finishedAuctions, error: auctionError } = await supabase
    .from('products')
    .select('id')
    .eq('type', 'auction')
    .eq('status', 'available')
    .lt('auction_ends_at', new Date().toISOString());

  if (auctionError) {
    console.error('Error fetching finished auctions:', auctionError);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch auctions' }), { status: 500 });
  }

  if (!finishedAuctions || finishedAuctions.length === 0) {
    return NextResponse.json({ message: 'No finished auctions to process.' });
  }

  const processedAuctions = [];
  const failedAuctions = [];

  // 2. Process each finished auction.
  for (const auction of finishedAuctions) {
    // 2a. Find the winning bid (highest bid).
    const { data: winningBid, error: bidError } = await supabase
      .from('bids')
      .select('user_id, bid_amount')
      .eq('product_id', auction.id)
      .order('bid_amount', { ascending: false })
      .limit(1)
      .single();

    if (bidError || !winningBid) {
      // No bids on this auction, we could mark it as 'expired' or just leave it.
      // For now, we'll just log it.
      console.log(`Auction ${auction.id} finished with no bids.`);
      // Optionally, update product status to 'expired'
      await supabase.from('products').update({ status: 'cancelled' }).eq('id', auction.id);
      continue; // Move to the next auction
    }

    const winnerId = winningBid.user_id;
    const finalPrice = winningBid.bid_amount;

    // 2b. Create a new order for the winner.
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: auction.id,
        buyer_id: winnerId,
        total_amount: finalPrice,
        status: 'pending_payment', // The winner now needs to pay.
      })
      .select('id')
      .single();

    if (orderError) {
      console.error(`Failed to create order for auction ${auction.id}:`, orderError);
      failedAuctions.push({ id: auction.id, reason: 'Order creation failed' });
      continue;
    }

    // 2c. Update the product to mark it as sold.
    const { error: productUpdateError } = await supabase
      .from('products')
      .update({
        status: 'pending_payment',
        buyer_id: winnerId,
        price: finalPrice, // Update the price to the winning bid amount
      })
      .eq('id', auction.id);

    if (productUpdateError) {
      console.error(`Failed to update product for auction ${auction.id}:`, productUpdateError);
      // This is a critical error. Ideally, we'd roll back the order creation in a transaction.
      failedAuctions.push({ id: auction.id, reason: 'Product update failed' });
      continue;
    }

    processedAuctions.push({
      productId: auction.id,
      winnerId: winnerId,
      orderId: newOrder.id,
    });
  }

  return NextResponse.json({
    message: 'Auction processing complete.',
    processedCount: processedAuctions.length,
    failedCount: failedAuctions.length,
    processedAuctions,
    failedAuctions,
  });
}
