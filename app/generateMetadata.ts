import { myFetch } from '@/lib/fetch-wrapper';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await myFetch('/api/siteSettings');
    const data = await res.json();
    const title = data.titleSite ? `${data.titleSite} | MielDeLune` : 'MielDeLune – Photographe Mariage Professionnel';
    const description = data.descriptionSite || 'Photographe professionnel spécialisé mariage, couple, famille. Reportages authentiques, naturels et élégants à Paris et partout en France. Découvrez nos galeries exclusives, tarifs transparents et réservez en ligne facilement.';
    
    return {
      title,
      description
    };
  } catch {
    return {
      title: 'MielDeLune – Photographe Mariage Professionnel',
      description: 'Photographe professionnel spécialisé mariage, couple, famille. Reportages authentiques, naturels et élégants à Paris et partout en France. Découvrez nos galeries exclusives, tarifs transparents et réservez en ligne facilement.'
    };
  }
}
