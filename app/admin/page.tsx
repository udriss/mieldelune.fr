import { myFetch } from '@/lib/fetch-wrapper';
import Head from 'next/head';
import { Wedding } from '@/lib/dataTemplate';
import { Profile } from '@/lib/dataProfil';
import AdminClientWrapper from '@/components/admin/AdminPageClient';
import { Metadata } from 'next';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Administration | MielDeLune',
  description: 'Panneau d\'administration pour gérer les mariages, profils et paramètres du site.',
};

export default async function AdminPage() {
  // Fetch data on the server
  let weddings: Wedding[] = [];
  let profile: Profile[] = [];

  try {
    const weddingsRes = await myFetch('/api/mariages', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
    });
    
    const weddingsData = await weddingsRes.json();
    if (weddingsData.weddings) {
      weddings = weddingsData.weddings;
    }
  } catch (error) {
    console.error('Error fetching weddings:', error);
  }

  try {
    const profileRes = await myFetch('/api/profile', {
      cache: 'no-store',
    });
    
    const profileData = await profileRes.json();
    if (profileData.profile) {
      profile = profileData.profile;
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  }

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminClientWrapper initialWeddings={weddings} initialProfile={profile} />
    </>
  );
}
