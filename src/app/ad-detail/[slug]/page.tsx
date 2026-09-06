import {redirect} from 'next/navigation';
import {productSlug} from '@/lib/slugs';
import {getListingByIdOrSlug} from '@/models/marketplace';
import {findDemoProduct} from '@/lib/demo-products';

interface AdDetailRedirectProps {
  params: Promise<{slug: string}>;
}

export default async function LegacyAdDetailRedirect({params}: AdDetailRedirectProps) {
  const {slug} = await params;
  const demo = findDemoProduct(slug);
  if (demo) {
    redirect(`/articulos/${demo.slug}`);
  }

  const item = await getListingByIdOrSlug(slug);
  if (item) {
    redirect(`/articulos/${productSlug(item.id, item.title)}`);
  }

  redirect(`/articulos/${slug}`);
}
