import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { ContentElement } from './types';

export function reorderContentElements(
  elements: ContentElement[],
  draggedId: string,
  targetId: string,
  edge: 'top' | 'bottom'
): ContentElement[] {
  // Créer une copie triée des éléments
  const sortedElements = [...elements].sort((a, b) => a.order - b.order);
  
  // Trouver les indices
  const draggedIndex = sortedElements.findIndex(el => el.id === draggedId);
  const targetIndex = sortedElements.findIndex(el => el.id === targetId);
  
  if (draggedIndex === -1 || targetIndex === -1) {
    return elements;
  }
  
  // Si on essaie de déplacer l'élément sur lui-même, pas de changement
  if (draggedIndex === targetIndex) {
    return elements;
  }
  
  // Utiliser la fonction officielle reorderWithEdge
  const reorderedElements = reorderWithEdge({
    axis: 'vertical',
    list: sortedElements,
    startIndex: draggedIndex,
    indexOfTarget: targetIndex,
    closestEdgeOfTarget: edge,
  });
  
  // Mettre à jour les ordres
  return reorderedElements.map((el: ContentElement, index: number) => ({
    ...el,
    order: index
  }));
}
