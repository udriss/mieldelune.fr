'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-rose-50 to-slate-50 w-full">
      {/* Main Content Container */}
      <main className="container mx-auto flex-1 p-4">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-8 p-8 max-w-2xl">
            {/* Animated Heart Icon */}
            <div className="relative w-32 h-32 mx-auto">
              <Heart 
                className="absolute inset-0 w-full h-full text-pink-500 animate-pulse" 
                strokeWidth={1.5} 
              />
              <HeartOff 
                className={`
                  absolute inset-0 w-full h-full text-gray-800/80
                  transition-opacity duration-1000
                  ${showAnimation ? 'opacity-100 animate-[bounceIn_1s_ease-in-out]' : 'opacity-0'}
                `}
                strokeWidth={2} 
              />
            </div>

            {/* Error Message */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
              Page introuvable
            </h1>
            
            <p className="text-xl text-gray-600">
              Cette page a peut-être été déplacée ou n&apos;existe plus, comme un amour perdu...
            </p>

            {/* Return Button */}
            <Button 
              className="mt-8 bg-pink-500 hover:bg-pink-600 transition-colors"
              asChild
            >
              <Link href="/">
                Retourner à l&apos;accueil
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}