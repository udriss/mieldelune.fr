'use client'

import React, { useState, useEffect } from "react"
import { useForm, Controller, FormProvider } from "react-hook-form"
import Calendar from "@/components/ui/calendar"
import { FaCheckCircle } from 'react-icons/fa';
import { myFetch } from '@/lib/fetch-wrapper';

import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
  FormControl,
  FormHelperText
} from '@mui/material';

interface DateRange {
  from?: Date
  to?: Date
}

interface FormInputs {
  lastname: string
  firstname: string
  email: string
  phone?: string
  message?: string
  dateRange: DateRange
}

interface ContactFormProps {
  unavailableDates: string[];
}

export default function ContactForm({ unavailableDates: unavailableDatesProps }: ContactFormProps) {
  const form = useForm<FormInputs>({
      defaultValues: {
          lastname: '',
          firstname: '',
          email: '',
          phone: '',
          message: '',
          dateRange: { from: undefined, to: undefined }
      }
  })
  const { control, handleSubmit, formState: { errors }, reset, watch } = form;
  const [open, setOpen] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [isRangeInvalid, setIsRangeInvalid] = useState(false);

  const selectedDateRange = watch("dateRange");

  useEffect(() => {
    // Convert the props to Date objects
    if (unavailableDatesProps && unavailableDatesProps.length > 0) {
      setUnavailableDates(unavailableDatesProps.map((d: string) => new Date(d)));
    }
  }, [unavailableDatesProps]);

  useEffect(() => {
    if (selectedDateRange?.from && selectedDateRange?.to && unavailableDates.length > 0) {
      const from = new Date(selectedDateRange.from);
      const to = new Date(selectedDateRange.to);
      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      const isInvalid = unavailableDates.some(unavailableDate => {
        const currentUnavailableDate = new Date(unavailableDate);
        currentUnavailableDate.setHours(0, 0, 0, 0);
        return currentUnavailableDate >= from && currentUnavailableDate <= to;
      });

      setIsRangeInvalid(isInvalid);
    } else {
      setIsRangeInvalid(false);
    }
  }, [selectedDateRange, unavailableDates]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const onSubmit = async (data: FormInputs) => {
    try {
      const res = await myFetch('/api/contact', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        console.error("Error:", await res.text())
        return
      }

      reset()
      handleOpen()
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Box 
      className="max-w-[400px] w-[400px]" 
      sx={{
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)', // Pour la compatibilité avec Safari
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-md mx-auto">
          <Controller
            name="lastname"
            control={control}
            rules={{ required: "Ce champ est requis" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nom"
                required
                placeholder="Votre nom"
                variant="outlined"
                fullWidth
                error={!!errors.lastname}
                helperText={errors.lastname?.message}
              />
            )}
          />

          <Controller
            name="firstname"
            control={control}
            rules={{ required: "Ce champ est requis" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Prénom"
                required
                placeholder="Votre prénom"
                variant="outlined"
                fullWidth
                error={!!errors.firstname}
                helperText={errors.firstname?.message}
              />
            )}
          />

          <FormControl fullWidth error={!!errors.dateRange}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                Dates de votre événément <span className="text-red-500">*</span>
            </Typography>
            <Typography variant="caption" color="textSecondary" className="mb-2">
              Cliquez deux fois sur le même jour pour séléctionner un seul jour
            </Typography>
            <Controller
              name="dateRange"
              control={control}
              rules={{ 
                validate: value => (value?.from && value?.to) ? true : "Sélectionnez une plage de dates"
              }}
              render={({ field }) => (
                <div className="flex flex-col justify-center">
                <Calendar
                  // @ts-ignore
                  onChange={field.onChange}
                />
                </div>
              )}
            />
            {errors.dateRange && <FormHelperText>{errors.dateRange.message}</FormHelperText>}
            {isRangeInvalid && <FormHelperText error>La plage de dates sélectionnée contient des jours indisponibles.</FormHelperText>}
          </FormControl>

          <Controller
            name="email"
            control={control}
            rules={{ required: "Ce champ est requis" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                required
                placeholder="votre@email.com"
                variant="outlined"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Téléphone"
                type="tel"
                placeholder="0123456789"
                variant="outlined"
                fullWidth
              />
            )}
          />

          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Message"
                placeholder="Votre message..."
                multiline
                rows={4}
                slotProps={{ htmlInput: { maxLength: 200 } }}
                variant="outlined"
                fullWidth
                helperText={`${(field.value || '').length} / 200 caractères`}
              />
            )}
          />

          <Box className="flex gap-4">
            <Button className="w-full text-sm font-medium" type="submit" variant="contained"
            disabled={isRangeInvalid}
            sx={{
              fontWeight: 'bold',
            }}
            >
              Envoyer
            </Button>
            <Button 
              type="reset" 
              variant="outlined"
              className="w-full text-sm font-medium"
              onClick={() => reset()}
            >
              Réinitialiser
            </Button>
          </Box>
        </form>
      </FormProvider>

      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)', // gray-800 with opacity
              backdropFilter: 'blur(5px)',
              border: '4px solid #4B5563', // gray-600
              color: 'white',
              maxWidth: '300px',
              margin: 'auto'
            }
          }
        }}
      >
        <DialogTitle sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <FaCheckCircle className="text-green-500 w-12 h-12" />
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <DialogContentText sx={{ color: 'white', textAlign: 'center' }}>
            Votre demande de réservation a été envoyée avec succès !
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}