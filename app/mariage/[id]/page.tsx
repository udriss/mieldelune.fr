import {WeddingGallery} from '@/components/gallery/wedding-gallery';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import type { Params } from './types';
import { myFetch } from '@/lib/fetch-wrapper';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await myFetch(`/api/mariage/${id}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!res.ok) {
      return {
        title: 'Mariage introuvable | MielDeLune',
        description: 'Ce mariage n\'existe pas ou n\'est plus disponible.',
      };
    }

    const wedding = await res.json();
    
    return {
      title: `${wedding.title || 'Mariage'} - Galerie | MielDeLune`,
      description: `Découvrez les photos du mariage ${wedding.title || ''}. Galerie de photos de mariage professionnelles.`,
    };
  } catch (error) {
    return {
      title: 'Mariage | MielDeLune',
      description: 'Galerie de photos de mariage professionnelles.',
    };
  }
}

export default async function WeddingPage({ params }: Params) {
  const { id } = await params;

  const res = await myFetch(`/api/mariage/${id}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });

  if (!res.ok) {
    notFound();
  }

  const wedding = await res.json();

  return (
      <div className="max-w-[1600px] mx-auto py-16">
        <WeddingGallery wedding={wedding} />
      </div>
  );
}