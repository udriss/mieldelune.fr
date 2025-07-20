import { myFetch } from '../../lib/fetch-wrapper';
import type { Metadata } from '../../types/next-metadata';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await myFetch('/api/profile/', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch profile');
    }
    const data = await res.json();
    const artistName = data.profile?.name || 'Photographe';
    const artistDescription = data.profile?.description || 'Découvrez le parcours, la vision et les inspirations de votre photographe de mariage. Passion, expérience et authenticité au service de vos souvenirs.';
    return {
      title: `${artistName} - Profil | MielDeLune`,
      description: artistDescription
    };
  } catch {
    return {
      title: 'Photographe | MielDeLune',
      description: 'Découvrez le parcours, la vision et les inspirations de votre photographe de mariage. Passion, expérience et authenticité au service de vos souvenirs.'
    };
  }
}
