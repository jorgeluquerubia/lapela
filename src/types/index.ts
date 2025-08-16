export interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
  seller: string;
  location: string;
  time: string;
  image: string;
  detailImage?: string; // Optional as it's not used everywhere
  description?: string; // Optional as it's not used everywhere
  status: 'available' | 'sold' | 'paid' | 'pending_payment';
  buyer_id?: string | null;
  buyer: {
    id: string;
    username: string;
  } | null;
  updated_at: string;
  user_id: string; // Added for ownership checks
  current_bid?: number;
  bid_count?: number;
  category?: string;
  auction_ends_at?: string; // ISO 8601 string
  slug?: string;
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
