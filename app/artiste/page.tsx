'use client';

import { notFound } from "next/navigation";
import ArtistCard from "@/components/artiste/artist-card";
import { myFetch } from '@/lib/fetch-wrapper';
import { useEffect, useState } from 'react';

export default function ArtistPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
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
        setProfile(data.profile);
        
        // Définir le titre de la page dynamiquement
        const artistName = data.profile?.name || 'Photographe';
        document.title = `${artistName} - Profil | MielDeLune`;
      } catch (error) {
        console.error('Error loading artist page:', error);
        setError('Failed to load profile');
        document.title = 'Photographe | MielDeLune';
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="page-content-profil rounded-lg max-w-[800px] mx-auto sm:px-6 lg:px-8 w-auto min-w-[400px] mt-32">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    notFound();
  }

  return (
    <div className="page-content-profil rounded-lg max-w-[800px] mx-auto sm:px-6 lg:px-8 w-auto min-w-[400px] mt-32">
      <ArtistCard profile={profile} />
    </div>
  );
}