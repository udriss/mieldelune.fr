'use client';

import { useConnectionTracker } from '@/hooks/useConnectionTracker';

export default function ConnectionTracker() {
  useConnectionTracker();
  
  // Ce composant ne rend rien visuellement
  return null;
}
