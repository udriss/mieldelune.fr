import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';
import { Wedding } from '@/lib/dataTemplate';

// Fonction utilitaire pour modifier la visibilité des images en lot
export async function updateMultipleImagesVisibility(
  weddingId: string | number, 
  imageIds: string[],
  visibility: boolean,
  setEditedWeddingFn?: (wedding: any) => void,
  setProgressState?: (state: { current: number, total: number, percent: number, status: string, processing: boolean, error: boolean }) => void,
  showToasts: boolean = true
) {
  if (!imageIds.length) return;
  
  let successCount = 0;
  let failCount = 0;
  
  // Créer une copie des IDs pour ne pas modifier l'original pendant les mises à jour
  const updatedIds: string[] = [];
  
  try {
    // Si nous avons une fonction de mise à jour de la progression
    if (setProgressState) {
      setProgressState({
        current: 0,
        total: imageIds.length,
        percent: 0,
        status: `Préparation de la mise à jour de ${imageIds.length} image(s)...`,
        processing: true,
        error: false
      });
      
      // Attendre 0.5 seconde avant de commencer pour afficher la barre de progression
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (showToasts) {
      // Fallback vers le toast si pas de fonction de progression et si les toasts sont activés
      toast.info(`Mise à jour de la visibilité de ${imageIds.length} image(s)...`, {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '350px' }
      });
    }
    
    // Traiter chaque image une par une
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      
      try {
        // Mettre à jour l'état de progression avant chaque opération
        if (setProgressState) {
          setProgressState({
            current: i,
            total: imageIds.length,
            percent: Math.round((i / imageIds.length) * 100),
            status: `Mise à jour de l'image ${i+1}/${imageIds.length}...`,
            processing: true,
            error: false
          });
        }
        
        const response = await myFetch('/api/updateImageVisibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: weddingId,
            imageId: imageId,
            imageVisibility: visibility
          })
        });
        
        if (!response.ok) throw new Error(`Failed to update image visibility ${imageId}`);
        
        // Ajouter l'ID à la liste des images modifiées
        updatedIds.push(imageId);
        successCount++;
        
        // Mettre à jour la progression après chaque succès
        if (setProgressState) {
          setProgressState({
            current: successCount,
            total: imageIds.length,
            percent: Math.round((successCount / imageIds.length) * 100),
            status: `${successCount}/${imageIds.length} image(s) mise(s) à jour`,
            processing: true,
            error: false
          });
        }
        
        // Attendre 0,100 seconde entre chaque mise à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failCount++;
        console.error(`Erreur lors de la mise à jour de l'image ${imageId}:`, error);
        
        // Mettre à jour la progression avec l'erreur
        if (setProgressState) {
          setProgressState({
            current: i + 1,
            total: imageIds.length,
            percent: Math.round(((i + 1) / imageIds.length) * 100),
            status: `Erreur lors de la mise à jour de l'image ${i+1}/${imageIds.length}`,
            processing: true,
            error: true
          });
          
          // Attendre un peu pour que l'utilisateur puisse voir l'erreur
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    // Mettre à jour l'état local si la fonction de callback est fournie
    if (setEditedWeddingFn) {
      setEditedWeddingFn((prevWedding: Wedding) => {
        const updatedImages = prevWedding.images.map(img => {
          if (updatedIds.includes(img.id)) {
            return {
              ...img,
              imageVisibility: visibility
            };
          }
          return img;
        });
        return {
          ...prevWedding,
          images: updatedImages
        };
      });
    }
    
    // Mettre à jour l'état final
    if (setProgressState) {
      setProgressState({
        current: successCount,
        total: imageIds.length,
        percent: 100,
        status: successCount === imageIds.length 
          ? `✅ ${successCount} image(s) mise(s) à jour avec succès` 
          : `⚠️ ${successCount}/${imageIds.length} image(s) mise(s) à jour`,
        processing: false,
        error: successCount !== imageIds.length
      });
    } else if (showToasts) {
      // Afficher un message de réussite si on utilise les toasts et qu'ils sont activés
      if (successCount === imageIds.length) {
        toast.success(`🎉 ${successCount} image${successCount > 1 ? 's' : ''} mise${successCount > 1 ? 's' : ''} à jour avec succès`, {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '350px' }
        });
      } else {
        toast.warning(`⚠️ ${successCount}/${imageIds.length} image${successCount > 1 ? 's' : ''} mise${successCount > 1 ? 's' : ''} à jour`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '350px' }
        });
      }
    }
    
    return successCount === imageIds.length; // Retourne true si toutes les mises à jour ont réussi
  } catch (error) {
    // Gestion des erreurs globales
    if (setProgressState) {
      setProgressState({
        current: 0,
        total: imageIds.length,
        percent: 0,
        status: "Erreur lors de la mise à jour des images",
        processing: false,
        error: true
      });
    } else if (showToasts) {
      toast.error('Erreur lors de la mise à jour des images.', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
    }
    throw error;
  }
}

// Fonction utilitaire pour modifier la visibilité des descriptions en lot
export async function updateMultipleDescriptionsVisibility(
  weddingId: string | number, 
  imageIds: string[],
  visibility: boolean,
  setEditedWeddingFn?: (wedding: any) => void,
  setProgressState?: (state: { current: number, total: number, percent: number, status: string, processing: boolean, error: boolean }) => void,
  showToasts: boolean = true
) {
  if (!imageIds.length) return;
  
  let successCount = 0;
  let failCount = 0;
  
  // Créer une copie des IDs pour ne pas modifier l'original pendant les mises à jour
  const updatedIds: string[] = [];
  
  try {
    // Si nous avons une fonction de mise à jour de la progression
    if (setProgressState) {
      setProgressState({
        current: 0,
        total: imageIds.length,
        percent: 0,
        status: `Préparation de la mise à jour de ${imageIds.length} description(s)...`,
        processing: true,
        error: false
      });
      
      // Attendre 0.5 seconde avant de commencer pour afficher la barre de progression
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (showToasts) {
      // Fallback vers le toast si pas de fonction de progression et si les toasts sont activés
      toast.info(`Mise à jour de la visibilité des descriptions pour ${imageIds.length} image(s)...`, {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '350px' }
      });
    }
    
    // Traiter chaque image une par une
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      
      try {
        // Mettre à jour l'état de progression avant chaque opération
        if (setProgressState) {
          setProgressState({
            current: i,
            total: imageIds.length,
            percent: Math.round((i / imageIds.length) * 100),
            status: `Mise à jour de la description ${i+1}/${imageIds.length}...`,
            processing: true,
            error: false
          });
        }
        
        const response = await myFetch('/api/updateDescriptionVisibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: weddingId,
            imageId: imageId,
            descriptionVisibility: visibility
          })
        });
        
        if (!response.ok) throw new Error(`Failed to update description visibility ${imageId}`);
        
        // Ajouter l'ID à la liste des images modifiées
        updatedIds.push(imageId);
        successCount++;
        
        // Mettre à jour la progression après chaque succès
        if (setProgressState) {
          setProgressState({
            current: successCount,
            total: imageIds.length,
            percent: Math.round((successCount / imageIds.length) * 100),
            status: `${successCount}/${imageIds.length} description(s) mise(s) à jour`,
            processing: true,
            error: false
          });
        }
        
        // Attendre 0,100 seconde entre chaque mise à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failCount++;
        console.error(`Erreur lors de la mise à jour de la description pour l'image ${imageId}:`, error);
        
        // Mettre à jour la progression avec l'erreur
        if (setProgressState) {
          setProgressState({
            current: i + 1,
            total: imageIds.length,
            percent: Math.round(((i + 1) / imageIds.length) * 100),
            status: `Erreur lors de la mise à jour de la description ${i+1}/${imageIds.length}`,
            processing: true,
            error: true
          });
          
          // Attendre un peu pour que l'utilisateur puisse voir l'erreur
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    // Mettre à jour l'état local si la fonction de callback est fournie
    if (setEditedWeddingFn) {
      setEditedWeddingFn((prevWedding: Wedding) => {
        const updatedImages = prevWedding.images.map(img => {
          if (updatedIds.includes(img.id)) {
            return {
              ...img,
              descriptionVisibility: visibility
            };
          }
          return img;
        });
        return {
          ...prevWedding,
          images: updatedImages
        };
      });
    }
    
    // Mettre à jour l'état final
    if (setProgressState) {
      setProgressState({
        current: successCount,
        total: imageIds.length,
        percent: 100,
        status: successCount === imageIds.length 
          ? `✅ ${successCount} description(s) mise(s) à jour avec succès` 
          : `⚠️ ${successCount}/${imageIds.length} description(s) mise(s) à jour`,
        processing: false,
        error: successCount !== imageIds.length
      });
    } else if (showToasts) {
      // Afficher un message de réussite si on utilise les toasts et qu'ils sont activés
      if (successCount === imageIds.length) {
        toast.success(`🎉 ${successCount} description${successCount > 1 ? 's' : ''} mise${successCount > 1 ? 's' : ''} à jour avec succès`, {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '350px' }
        });
      } else {
        toast.warning(`⚠️ ${successCount}/${imageIds.length} description${successCount > 1 ? 's' : ''} mise${successCount > 1 ? 's' : ''} à jour`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '350px' }
        });
      }
    }
    
    return successCount === imageIds.length; // Retourne true si toutes les mises à jour ont réussi
  } catch (error) {
    // Gestion des erreurs globales
    if (setProgressState) {
      setProgressState({
        current: 0,
        total: imageIds.length,
        percent: 0,
        status: "Erreur lors de la mise à jour des descriptions",
        processing: false,
        error: true
      });
    } else if (showToasts) {
      toast.error('Erreur lors de la mise à jour des descriptions.', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
    }
    throw error;
  }
}

// Fonction utilitaire pour supprimer des images en lot
export async function deleteMultipleImages(
    weddingId: string | number, 
    imageIds: string[],
    setEditedWeddingFn?: (wedding: any) => void,
    setProgressState?: (state: { current: number, total: number, percent: number, status: string, processing: boolean, error: boolean }) => void
  ) {
    if (!imageIds.length) return;
    
    let successCount = 0;
    let failCount = 0;
    
    // Créer une copie des IDs pour ne pas modifier l'original pendant les suppressions
    const remainingIds = [...imageIds];
    const deletedIds: string[] = [];
    
    try {
      // Si nous avons une fonction de mise à jour de la progression
      if (setProgressState) {
        setProgressState({
          current: 0,
          total: imageIds.length,
          percent: 0,
          status: `Préparation de la suppression de ${imageIds.length} image(s)...`,
          processing: true,
          error: false
        });
        
        // Attendre 1 seconde avant de commencer la suppression pour afficher la barre de progression
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Fallback vers le toast si pas de fonction de progression
        toast.info(`Début de la suppression de ${imageIds.length} image(s)...`, {
          position: "top-center",
          autoClose: false,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '350px' }
        });
      }
      
      // Traiter chaque image une par une
      for (let i = 0; i < imageIds.length; i++) {
        const imageId = imageIds[i];
        
        try {
          // Mettre à jour l'état de progression avant chaque opération
          if (setProgressState) {
            setProgressState({
              current: i,
              total: imageIds.length,
              percent: Math.round((i / imageIds.length) * 100),
              status: `Suppression de l'image ${i+1}/${imageIds.length}...`,
              processing: true,
              error: false
            });
          }
          
          const response = await myFetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: weddingId,
              imageId: imageId,
              fileType: 'storage' // Par défaut, assumons que c'est du stockage local
            })
          });
          
          if (!response.ok) throw new Error(`Failed to delete image ${imageId}`);
          
          // Ajouter l'ID à la liste des images supprimées
          deletedIds.push(imageId);
          successCount++;
          
          // Mettre à jour la progression après chaque succès
          if (setProgressState) {
            setProgressState({
              current: successCount,
              total: imageIds.length,
              percent: Math.round((successCount / imageIds.length) * 100),
              status: `${successCount}/${imageIds.length} image(s) supprimée(s)`,
              processing: true,
              error: false
            });
          }
          
          // Attendre 0,350 seconde entre chaque suppression
          await new Promise(resolve => setTimeout(resolve, 350));
          
        } catch (error) {
          failCount++;
          console.error(`Erreur lors de la suppression de l'image ${imageId}:`, error);
          
          // Mettre à jour la progression avec l'erreur
          if (setProgressState) {
            setProgressState({
              current: i + 1,
              total: imageIds.length,
              percent: Math.round(((i + 1) / imageIds.length) * 100),
              status: `Erreur lors de la suppression de l'image ${i+1}/${imageIds.length}`,
              processing: true,
              error: true
            });
            
            // Attendre un peu pour que l'utilisateur puisse voir l'erreur
            await new Promise(resolve => setTimeout(resolve, 700));
          }
        }
      }
      
      // Mettre à jour l'état local si la fonction de callback est fournie
      if (setEditedWeddingFn) {
        setEditedWeddingFn((prevWedding: Wedding) => {
          const updatedImages = prevWedding.images.filter(img => !deletedIds.includes(img.id));
          return {
            ...prevWedding,
            images: updatedImages
          };
        });
      }
      
      // Mettre à jour l'état final
      if (setProgressState) {
        setProgressState({
          current: successCount,
          total: imageIds.length,
          percent: 100,
          status: successCount === imageIds.length 
            ? `✅ ${successCount} image(s) supprimée(s) avec succès` 
            : `⚠️ ${successCount}/${imageIds.length} image(s) supprimée(s)`,
          processing: false,
          error: successCount !== imageIds.length
        });
      } else {
        // Afficher un message de réussite si on utilise les toasts
        if (successCount === imageIds.length) {
          toast.success(`🎉 ${successCount} image${successCount > 1 ? 's' : ''} supprimée${successCount > 1 ? 's' : ''} avec succès`, {
            position: "top-center",
            autoClose: 1500,
            hideProgressBar: false,
            theme: "dark",
            style: { width: '350px' }
          });
        } else {
          toast.warning(`⚠️ ${successCount}/${imageIds.length} image${successCount > 1 ? 's' : ''} supprimée${successCount > 1 ? 's' : ''}`, {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: false,
            theme: "dark",
            style: { width: '350px' }
          });
        }
      }
      
      return successCount === imageIds.length; // Retourne true si toutes les suppressions ont réussi
    } catch (error) {
      // Gestion des erreurs globales
      if (setProgressState) {
        setProgressState({
          current: 0,
          total: imageIds.length,
          percent: 0,
          status: "Erreur lors de la suppression des images",
          processing: false,
          error: true
        });
      } else {
        toast.error('Erreur lors de la suppression des images.', {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '400px' }
        });
      }
      throw error;
    }
  }