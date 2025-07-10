// src/components/Anuncio.tsx
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: string;
  type: string;
  seller: string;
  location: string;
  time: string;
  image: string;
}

export default function Anuncio({ product }: { product: Product }) {
  return (
    <div className="product-card" key={product.id}>
      <Link href={`/ad-detail/${product.id}`}>
        <div className="product-image" style={{ backgroundImage: `url('${product.image}')` }}></div>
        <div className="product-info">
          <h3>{product.name}</h3>
          <p className={product.type === 'auction' ? 'price auction-price' : 'price'}>
            {product.type === 'auction' ? `Puja actual: ${product.price}` : product.price}
          </p>
          <p className="meta">Vendido por <b>{product.seller}</b></p>
          <p className="meta">{product.location} &bull; {product.time}</p>
        </div>
      </Link>
    </div>
  );
}
