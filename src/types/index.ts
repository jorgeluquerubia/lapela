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
  status: 'available' | 'sold' | 'paid';
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
