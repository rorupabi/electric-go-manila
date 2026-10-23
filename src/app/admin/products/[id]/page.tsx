import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ExternalLink } from 'lucide-react';
import { db } from '@/lib/db/client';
import { productPhotos, products } from '@/lib/db/schema';
import { PageHeader } from '@/components/ui';
import { ProductForm } from '../product-form';
import { ProductPhotos } from './product-photos';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const product = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
  if (!product) notFound();
  const photos = await db.select({ id: productPhotos.id, url: productPhotos.url }).from(productPhotos)
    .where(eq(productPhotos.productId, id)).orderBy(asc(productPhotos.sortOrder), asc(productPhotos.createdAt));

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.status === 'active' ? 'Live in the shop' : 'Draft (hidden from customers)'}
        action={product.status === 'active' ? <Link href={`/products/${product.slug}`} className="btn btn-outline btn-sm" target="_blank">View in shop <ExternalLink className="h-3.5 w-3.5" aria-hidden /></Link> : undefined}
      />
      <div className="space-y-6">
        <ProductPhotos productId={product.id} initial={photos} />
        <ProductForm initial={{ ...product, featured: product.featured === 1 }} />
      </div>
    </>
  );
}
