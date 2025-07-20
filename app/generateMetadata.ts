import { myFetch } from '@/lib/fetch-wrapper';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await myFetch('/api/siteSettings');
    const data = await res.json();
    const title = data.titleSite ? `${data.titleSite} | MielDeLune` : 'Accueil | MielDeLune';
    return {
      title,
      description: data.descriptionSite || 'Photographe professionnel spécialisé mariage, couple, famille. Reportages authentiques, naturels et élégants à Paris et partout en France. Découvrez nos galeries, tarifs et disponibilités.'
    };
  } catch {
    return {
      title: 'Accueil | MielDeLune',
      description: 'Photographe professionnel spécialisé mariage, couple, famille. Reportages authentiques, naturels et élégants à Paris et partout en France. Découvrez nos galeries, tarifs et disponibilités.'
    };
  }
}
