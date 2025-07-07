// Ce fichier contient des modificateurs de style qui seront injectés après le chargement de la page
// Utilisé pour garantir que même les popups et les éléments de portal utilisent la bonne police

'use client';

import { useEffect } from 'react';

export function AdminStyleOverrides() {
  useEffect(() => {
    // Créer un élément de style pour appliquer les règles CSS nécessaires
    const styleElement = document.createElement('style');
    styleElement.id = 'admin-style-overrides';
    styleElement.innerHTML = `
      /* S'assurer que tous les portails et popups utilisent la police Roboto */
      div[data-radix-popper-content-wrapper] * {
        font-family: 'Roboto', sans-serif !important;
      }
      
      /* Portails spécifiques pour les menus déroulants */
      [role="listbox"],
      [role="dialog"],
      [role="tooltip"],
      [role="menu"] {
        font-family: 'Roboto', sans-serif !important;
      }
      
      /* Contenu des sélecteurs */
      .select-dropdown-content * {
        font-family: 'Roboto', sans-serif !important;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    // Nettoyer lorsque le composant est démonté
    return () => {
      const existingStyle = document.getElementById('admin-style-overrides');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  
  return null;
}
