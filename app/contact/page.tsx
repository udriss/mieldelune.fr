import { myFetch } from '@/lib/fetch-wrapper';
import ContactPageClient from '@/components/contact/ContactPageClient';
import { Metadata } from 'next';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Contact - Réservation | MielDeLune',
  description: 'Contactez-nous pour réserver votre séance photo de mariage. Découvrez nos disponibilités et tarifs.',
};

export default async function ContactPage() {
  // Fetch availability data on the server
  let unavailableDates: string[] = [];

  try {
    const res = await myFetch('/api/availability', {
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.unavailableDates) {
      unavailableDates = data.unavailableDates;
    }
  } catch (error) {
    console.error('Error fetching availability:', error);
  }

  return <ContactPageClient unavailableDates={unavailableDates} />;
}