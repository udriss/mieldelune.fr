'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY;
      setIsVisible(scrolled > 200);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Button
    size={"lg"}
      variant="secondary"
      className={`
        fixed bottom-4 right-4 z-50 rounded-lg p-2 bg-white/20 backdrop-blur-md shadow-lg hover:bg-white/30 
        transition-all duration-300 ring-4 ring-white/10 ring-offset-0 hover:bg-white/90
        shadow-lg hover:shadow-xl
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
      onClick={scrollToTop}
      aria-label="Retour en haut"
    >
      <ChevronUp size={42} strokeWidth={4} absoluteStrokeWidth />
    </Button>
  );
}