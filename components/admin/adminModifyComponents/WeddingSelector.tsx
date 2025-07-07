import { Wedding } from '@/lib/dataTemplate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setCookie } from '@/utils/cookies';
import { useEffect, useState } from 'react';

interface WeddingSelectorProps {
  weddings: Wedding[];
  selectedWedding: string;
  onWeddingSelect: (value: string) => void;
}

export function WeddingSelector({ weddings, selectedWedding, onWeddingSelect }: WeddingSelectorProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Applique la police Roboto aux éléments du menu déroulant
    const applyRobotoFont = () => {
      document.querySelectorAll('.select-dropdown-content *').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.fontFamily = "'Roboto', sans-serif";
        }
      });
    };
    
    // Observer pour détecter quand le menu déroulant est ouvert
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const selectContent = document.querySelector('.select-dropdown-content');
          if (selectContent) {
            applyRobotoFont();
          }
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleWeddingSelect = (value: string) => {
    onWeddingSelect(value);
    setCookie('lastWeddingId', value);
  };

  if (!mounted) return null;

  return (
    <div className="w-full font-roboto">
      <Select onValueChange={handleWeddingSelect} value={selectedWedding}>
        <SelectTrigger className="font-roboto">
          <SelectValue placeholder="Sélectionnez un mariage" className="font-roboto" />
        </SelectTrigger>
        <SelectContent className="select-dropdown-content font-roboto">
          {weddings && weddings.length > 0 ? (
            weddings.map(wedding => (
              <SelectItem 
                key={`${wedding.id}-${Date.now()}`} 
                value={String(wedding.id)}
                className="font-roboto"
              >
                {wedding.title}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-data" className="font-roboto">Aucun mariage trouvé</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
