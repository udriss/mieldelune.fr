'use client';

import { Box, Typography, Paper } from '@mui/material';
import { ContentElement } from './types';
import { PragmaticSortableContentElement } from './PragmaticSortableContentElement';

interface ContentListProps {
  content: ContentElement[];
  onUpdateElement: (element: ContentElement) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
}

export function ContentList({ content, onUpdateElement, onDeleteElement, onReorderElements }: ContentListProps) {
  return (
    <Box>
      <Typography variant="h6" mb={2}>Contenu de la page</Typography>
      
      {content.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f9fafb' }}>
          <Typography variant="body1" color="textSecondary">
            Aucun contenu ajouté. Utilisez les boutons ci-dessus pour commencer.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {content.map((element) => (
            <PragmaticSortableContentElement
              key={element.id}
              element={element}
              onUpdate={onUpdateElement}
              onDelete={onDeleteElement}
              onReorder={onReorderElements}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
