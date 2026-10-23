import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { ProductForm } from '../product-form';

export const metadata: Metadata = { title: 'Add product' };

export default function NewProduct() {
  return (
    <>
      <PageHeader title="Add product" subtitle="Save first, then add photos on the next screen." />
      <ProductForm />
    </>
  );
}
