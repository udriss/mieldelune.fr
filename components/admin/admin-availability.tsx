'use client';

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { fr } from 'date-fns/locale';
import { myFetch } from '@/lib/fetch-wrapper';
import { Button, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

export function AdminAvailability() {
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await myFetch('/api/availability');
        const data = await res.json();
        if (data.unavailableDates) {
          setUnavailableDates(data.unavailableDates.map((d: string) => new Date(d)));
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des disponibilités.");
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const handleDayClick = (day: Date) => {
    const dateExists = unavailableDates.some(d => d.getTime() === day.getTime());
    if (dateExists) {
      setUnavailableDates(unavailableDates.filter(d => d.getTime() !== day.getTime()));
    } else {
      setUnavailableDates([...unavailableDates, day]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await myFetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unavailableDates }),
      });
          toast.success('🎉 Disponibilités mises à jour', {
      position: "top-center",
      autoClose: 1500,
      hideProgressBar: false,
      theme: "dark",
      style: {
        width: '300px',
        textAlign: 'center',
      },
    });
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde des disponibilités.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h6" fontWeight={600}>
          Gérer les indisponibilités
        </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Cliquez sur les dates pour les marquer comme indisponibles. Cliquez à nouveau pour les rendre disponibles.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <DayPicker
          mode="multiple"
          selected={unavailableDates}
          onDayClick={handleDayClick}
          locale={fr}
          disabled={{ before: new Date() }}
          modifiersClassNames={{
            selected: 'rdp-day_selected_custom',
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : 'Sauvegarder les indisponibilités'}
        </Button>
      </Box>
      <style>{`
        .rdp-day_selected_custom {
          background-color: #f44336 !important;
          color: white !important;
        }
      `}</style>
    </Paper>
  );
}
