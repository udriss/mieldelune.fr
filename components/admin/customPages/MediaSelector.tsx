'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Pagination
} from '@mui/material';
import {
  Search,
  X,
  Check,
  Delete,
  FileImage,
  FileVideo,
  Calendar
} from 'lucide-react';
import { myFetch } from '@/lib/fetch-wrapper';
import { toast } from 'react-toastify';
import Image from 'next/image';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  lastModified: number;
}

interface MediaSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  mediaType: 'images' | 'videos';
}

export function MediaSelector({ open, onClose, onSelect, mediaType }: MediaSelectorProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const filesPerPage = 12;

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open, mediaType]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await myFetch(`/api/custom-pages-files?type=${mediaType}`);
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      toast.error('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const response = await myFetch(`/api/custom-pages-files?file=${fileName}&type=${mediaType}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFiles(prev => prev.filter(f => f.name !== fileName));
        toast.success('Fichier supprimé');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du fichier');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedFiles = filteredFiles.slice(
    (page - 1) * filesPerPage,
    page * filesPerPage
  );

  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedFile(null);
    setSearchTerm('');
    setPage(1);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            {mediaType === 'images' ? <FileImage /> : <FileVideo />}
            <Typography variant="h6">
              Sélectionner {mediaType === 'images' ? 'une image' : 'une vidéo'}
            </Typography>
            <Chip 
              label={`${filteredFiles.length} fichier${filteredFiles.length > 1 ? 's' : ''}`}
              size="small"
              color="primary"
            />
          </Box>
          <IconButton onClick={handleClose}>
            <X />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Rechercher un fichier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <Typography>Chargement...</Typography>
          </Box>
        ) : paginatedFiles.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" p={4}>
            {mediaType === 'images' ? <FileImage size={64} color="#999" /> : <FileVideo size={64} color="#999" />}
            <Typography variant="h6" color="textSecondary" mt={2}>
              {searchTerm ? 'Aucun fichier trouvé' : `Aucun${mediaType === 'images' ? 'e image' : 'e vidéo'} disponible`}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm ? 'Essayez avec un autre terme de recherche' : 'Uploadez votre premier fichier'}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {paginatedFiles.map((file) => (
                <Grid size={{ xs: 12, sm:6, md: 4, lg:3 }} key={file.name}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedFile === file.url ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                    onClick={() => setSelectedFile(file.url)}
                  >
                    <Box position="relative">
                      {mediaType === 'images' ? (
                        <CardMedia
                          component="div"
                          sx={{ height: 140, position: 'relative' }}
                        >
                          <Image
                            src={file.url}
                            alt={file.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </CardMedia>
                      ) : (
                        <CardMedia
                          component="video"
                          height="140"
                          src={file.url}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.name);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                      >
                        <Delete size={16} color="#dc2626" />
                      </IconButton>

                      {selectedFile === file.url && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#3b82f6',
                            borderRadius: '50%',
                            p: 0.5
                          }}
                        >
                          <Check size={16} color="white" />
                        </Box>
                      )}
                    </Box>

                    <CardContent sx={{ p: 2 }}>
                      <Typography 
                        variant="body2" 
                        noWrap
                        title={file.name}
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        {file.name}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="caption" color="textSecondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Calendar size={12} color="#999" />
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(file.lastModified)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSelect}
          disabled={!selectedFile}
          startIcon={<Check />}
        >
          Sélectionner
        </Button>
      </DialogActions>
    </Dialog>
  );
}
