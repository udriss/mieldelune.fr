import { useEffect } from 'react';

interface ConnectionData {
  timestamp: number;
  url: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export function useConnectionTracker() {
  useEffect(() => {
    // Fonction pour enregistrer une connexion
    const trackConnection = async () => {
      try {
        // Vérifier si la connexion a déjà été enregistrée
        const trackingKey = 'mieldelune_tracked';
        const hasBeenTracked = localStorage.getItem(trackingKey);
        
        if (hasBeenTracked) {
          // La connexion a déjà été enregistrée
          return;
        }
        
        // Collecter les informations de la connexion
        const connectionData: ConnectionData = {
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        };
        
        // Envoyer les données au serveur
        const response = await fetch('/api/connections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(connectionData)
        });
        
        if (response.ok) {
          // Marquer la connexion comme enregistrée
          localStorage.setItem(trackingKey, 'true');
          console.log('Connexion enregistrée avec succès');
        } else {
          console.error('Erreur lors de l\'enregistrement de la connexion');
        }
        
      } catch (error) {
        console.error('Erreur lors du suivi de la connexion:', error);
      }
    };
    
    // Enregistrer la connexion après un petit délai pour éviter les problèmes de hydratation
    const timer = setTimeout(() => {
      trackConnection();
    }, 1000);
    
    // Nettoyer le timer lors du démontage du composant
    return () => {
      clearTimeout(timer);
    };
  }, []); // Tableau de dépendances vide pour n'exécuter qu'une seule fois
}
