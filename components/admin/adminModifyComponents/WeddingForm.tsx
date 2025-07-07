import { Wedding } from '@/lib/dataTemplate';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';
import { Paper, Typography, Switch, FormControlLabel } from '@mui/material';


interface WeddingFormProps {
  editedWedding: Wedding | null;
  fieldValues: { [key: string]: string };
  setFieldValues: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  fieldStates: Record<string, {
    value: string;
    status: 'idle' | 'typing' | 'updating' | 'error' | 'success';
    timer?: NodeJS.Timeout;
  }>;
  handleInputChange: (field: string, value: string) => void;
  handleSwitchChange: (field: string, value: boolean) => void;
  handleDelete: () => void;
  toggleVisibility: () => void;
  isDeleting: boolean;
}

export function WeddingForm({ 
  editedWedding, 
  fieldValues, 
  setFieldValues, 
  fieldStates, 
  handleInputChange,
  handleSwitchChange,
  handleDelete,
  toggleVisibility,
  isDeleting
}: WeddingFormProps) {
  
  const getInputStyle = (field: string) => {
    const status = fieldStates[field]?.status;
    return `transition-colors duration-300 ${
      status === 'typing' ? 'bg-orange-50 border-red-300' :
      status === 'updating' ? 'bg-orange-100 border-orange-500' :
      status === 'error' ? 'bg-red-50 border-red-500' :
      status === 'success' ? 'bg-green-50 border-green-500' :
      ''
    }`;
  };

  const handleSave = async () => {
    try {
      const response = await myFetch('/api/updateWeddingInfos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editedWedding?.id,
          ...fieldValues,
        }),
      });

      if (!response.ok) throw new Error('Failed to update wedding');

      toast.success('🎉 Données mises à jour', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '300px',
        },
      });
    } catch (error) {
      toast.error('Echec de mise à jour.', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '300px',
        },
      });
    }
  };

  return (
    <div className="flex flex-col justify-around w-full">

      <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <div className="space-y-4 w-full">
        <Typography variant="h6" fontWeight={600} mb={2}>
        Informations du mariage
        </Typography>
        <h2 className="font-bold text-lg mb-4"></h2>
        <div className="flex justify-around gap-4 flex-row grid grid-cols-8 gap-4 items-center">
          <h4 className="text-sm text-gray-500 text-right flex items-center justify-end h-full col-span-2">Titre</h4>
          <Input
            className={`col-span-6 ${getInputStyle('title')}`}
            value={fieldValues.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Titre"
          />
        </div>
        <div className="flex justify-around gap-4 flex-row grid grid-cols-8 gap-4">
          <h4 className="text-sm text-gray-500 text-right flex items-center justify-end h-full col-span-2">Date</h4>
          <Input
            className={`col-span-6 ${getInputStyle('date')}`}
            value={fieldValues.date || ''}
            onChange={(e) => handleInputChange('date', e.target.value)}
            placeholder="Date"
          />
        </div>
        <div className="flex justify-around gap-4 flex-row grid grid-cols-8 gap-4">
          <h4 className="text-sm text-gray-500 text-right flex items-center justify-end h-full col-span-2">Lieu</h4>
          <Input
            className={`col-span-6 ${getInputStyle('location')}`}
            value={fieldValues.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Lieu"
          />
        </div>

        <div className="flex justify-around gap-4 flex-row grid grid-cols-8 gap-4 items-center">
          <h4 className="text-sm text-gray-500 text-right flex items-center justify-end h-full col-span-2">Afficher lieu</h4>
          <div className="col-span-6">
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(editedWedding?.showLocation ?? true)} // Par défaut à true si indéfini
                  onChange={(e) => handleSwitchChange('showLocation', e.target.checked)}
                  name="showLocation"
                />
              }
              label={<Typography sx={{ fontSize: '0.875rem' }}>{Boolean(editedWedding?.showLocation ?? true) ? "Affichée" : "Masquée"}</Typography>}
            />
          </div>
        </div>
        
        <div className="flex justify-around gap-4 flex-row grid grid-cols-8 gap-4">
          <h4 className="text-sm text-gray-500 text-right flex items-center justify-end h-full col-span-2">Description</h4>
          <Textarea
            placeholder="Description"
            rows={3}
            value={fieldValues.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`col-span-6 ${getInputStyle('description')}`}
          />
        </div>

        <div className="flex justify-around gap-4 flex-row grid grid-cols-8 gap-4 items-center">
          <h4 className="text-sm text-gray-500 text-right flex items-center justify-end h-full col-span-2">Afficher description</h4>
          <div className="col-span-6">
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(editedWedding?.showDescription ?? true)} // Par défaut à true si indéfini
                  onChange={(e) => handleSwitchChange('showDescription', e.target.checked)}
                  name="showDescription"
                />
              }
              label={<Typography sx={{ fontSize: '0.875rem' }}>{Boolean(editedWedding?.showDescription ?? true) ? "Affichée" : "Masquée"}</Typography>}
            />
          </div>
        </div>

        <div className="flex justify-around gap-4 flex-row grid grid-cols-8 gap-4">
          <h4 className="text-sm text-gray-500 text-right flex items-center justify-end h-full col-span-2">Template</h4>
          <div className="col-span-6">
            <Select 
              value={fieldValues.templateType || 'timeline'} 
              onValueChange={(value) => handleInputChange('templateType', value)}
            >
              <SelectTrigger className={getInputStyle('templateType')}>
                <SelectValue placeholder="Choisir un template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="masonry">Masonry</SelectItem>
                <SelectItem value="grid">Grille (ancien)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex grid grid-cols-9 gap-4 mt-4">
        <Button 
          onClick={handleDelete}
          variant={'outline'}
          className="col-span-3 bg-white border-gray-300 text-black hover:bg-red-100 "
          disabled={isDeleting}
        >
          {isDeleting ? 'Suppression...' : 'Supprimer l\'événement'}
        </Button>
        <Button 
          onClick={toggleVisibility}
          variant={editedWedding?.visible ? 'outline' : 'outline'}
          className={`col-span-3 bg-white text-black font-semibold border-gray-300 ${editedWedding?.visible ? "hover:bg-orange-100" : "hover:bg-green-100"}`}
        >
          {editedWedding?.visible ? "Masquer l'événement" : "Rendre l'événément visible"}
        </Button>
        <Button 
          onClick={handleSave}
          variant={'outline'}
          className="col-span-3 bg-white border-gray-300 text-black hover:bg-green-100 border-gray-300"
        >
          Enregistrer les modifications
        </Button>
      </div>
      </Paper>
    </div>
  );
}