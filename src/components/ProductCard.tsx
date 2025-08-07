import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';

function timeRemaining(endDateStr?: string): string | null {
  if (!endDateStr) return null;
  const endDate = new Date(endDateStr);
  const seconds = Math.floor((endDate.getTime() - new Date().getTime()) / 1000);
  if (seconds < 0) return "Finalizada";

  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days}d restantes`;
  
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours}h restantes`;

  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) return `${minutes}m restantes`;

  return `<1m restante`;
}

export default function ProductCard({ product }: { product: Product }) {
  const isAuction = product.type === 'auction';
  const displayPrice = isAuction ? product.current_bid || product.price : product.price;
  const timeLeft = timeRemaining(product.auction_ends_at);

  return (
    <div className="product-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col bg-white">
      <Link href={`/ad-detail/${product.slug}`} className="flex flex-col h-full">
        <div className="relative w-full h-48 bg-gray-100">
          <Image 
            src={product.image} 
            alt={product.name} 
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.status !== 'available' && (
            <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full text-white ${
              product.status === 'sold' ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {product.status === 'sold' ? 'Vendido' : 'Pagado'}
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-lg truncate flex-grow mb-2">{product.name}</h3>
          
          <div className="mb-2">
            <p className="text-xl font-bold text-gray-800">{displayPrice} €</p>
            {isAuction ? (
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Puja actual • {product.bid_count || 0} pujas</span>
                {timeLeft && <span className="font-semibold text-red-600">{timeLeft}</span>}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Compra directa</p>
            )}
          </div>

          <div className="text-sm text-gray-600 mt-auto pt-2 border-t">
            <p className="truncate">
              Vendido por:{' '}
              <Link href={`/user-profile/${product.seller}`} onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:underline font-semibold">
                {product.seller}
              </Link>
            </p>
            {/* Placeholder for seller rating */}
            {/* <p>Valoración: ⭐⭐⭐⭐ (123)</p> */}
            <p className="truncate">{product.location}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
