export interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
  seller: string;
  sellerProfile?: { alias: string };
  location: string;
  time: string;
  image: string;
  detailImage?: string; // Optional as it's not used everywhere
  description?: string; // Optional as it's not used everywhere
  status: 'available' | 'reserved' | 'sold' | 'paid' | 'pending_payment' | 'expired' | 'withdrawn' | string;
  buyer_id?: string | null;
  buyer: {
    id: string;
    username: string;
  } | null;
  updated_at: string;
  user_id?: string; // Private legacy field; never returned by the public catalogue.
  current_bid?: number;
  bid_count?: number;
  category?: string;
  auction_ends_at?: string; // ISO 8601 string
  slug?: string;
  auctionOutcome?: {
    status: 'active' | 'awarded' | 'unsold' | 'withdrawn';
    label: string;
    detail: string;
    isEnded: boolean;
  };
  featuredEdition?: {
    id: string;
    slug: string;
    title: string;
    status?: string;
    temporal_status?: 'upcoming' | 'active' | 'ended';
  };
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email?: string | null; // Optional as it's not always needed
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_number?: string | null;
  created_at: string;
}

export interface SellerProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface Question {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
  user: {
    username: string | null;
  };
}

export interface Bid {
  id: string;
  bid_amount: number;
  created_at: string;
  user_id: string;
  user: {
    username: string;
  };
}

export interface AuctionEdition {
  id: string;
  slug: string;
  title: string;
  description: string;
  environment?: 'sandbox' | 'live';
  starts_at: string;
  reference_ends_at: string;
  status: 'draft' | 'published' | 'cancelled';
  temporal_status: 'upcoming' | 'active' | 'ended';
  image_url?: string | null;
  items_count?: number;
  items?: Product[];
}

export interface AuctionEditionItem {
  id: string;
  edition_id: string;
  listing_id: string;
  sort_order: number;
  created_at: string;
  product?: Product;
}

