import { redirect } from 'next/navigation';

export default function FavoritosPage() {
  redirect('/my-products?tab=favorites');
}
