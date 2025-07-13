import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
import { Wedding } from '@/lib/dataTemplate';
import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';
import { 
    Box, 
    Button, 
    Typography, 
    TextField, 
    Paper, 
    Stack,
    Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';


interface NewEventButtonProps {
    onEventCreated?: (newWeddingId: string) => void;
}

const NewEventButton: React.FC<NewEventButtonProps> = ({ onEventCreated }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [newWedding, setNewWedding] = useState<Wedding | null>(null);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const response = await myFetch('/api/newEvent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to create event');
            const data = await response.json();
            setNewWedding(data.newWedding);

            const toastId = toast.success(`🎉 Événement avec id ${data.newWedding.id} disponible`, {
                position: "top-center",
                autoClose: false, // Ne pas fermer automatiquement
                theme: "dark",
                isLoading: true, // Montrer le loading pendant la redirection
                hideProgressBar: false,
                toastId: `new-event-${data.newWedding.id}`,
                style: {
                    width: '400px',
                    textAlign: 'center',
                  }
            });

            // Fermer le toast après 3 secondes
            setTimeout(() => {
                toast.dismiss(toastId);
            }, 3000);

            // Attendre 3 secondes puis switcher vers l'onglet Modifications
            setTimeout(() => {
                if (onEventCreated) {
                    onEventCreated(data.newWedding.id.toString());
                }
            }, 3000);
      
        } catch (error) {
            console.error('Error:', error);
            toast.error(`Erreur : ${error}`, {
                position: "top-center",
                autoClose: 3500,
                isLoading: false,
                hideProgressBar: false,
                theme: "dark",
                toastId: `new-event-error-${Date.now()}`,
                style: {
                    width: '400px',
                  }
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Stack spacing={2} alignItems="center" justifyContent="center">
            <Button 
                variant="contained"
                onClick={handleClick}
                disabled={isLoading}
                startIcon={!isLoading && <AddIcon />}
                size="large"
            >
                {isLoading ? 'En cours...' : 'Nouvel événement'}
            </Button>
            {newWedding && (
                <Paper elevation={1} sx={{ mt: 8, width: 800, maxWidth: 800, p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                        Nouvel événement disponible
                    </Typography>
                    <Stack spacing={2}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                                    Titre
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 9 }}>
                                <TextField
                                    fullWidth
                                    value={`${newWedding.title}`}
                                    slotProps={{ input: { readOnly: true } }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                                    Date
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 9 }}>
                                <TextField
                                    fullWidth
                                    value={newWedding.date}
                                    slotProps={{ input: { readOnly: true } }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                                    Lieu
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 9 }}>
                                <TextField
                                    fullWidth
                                    value={newWedding.location}
                                    slotProps={{ input: { readOnly: true } }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                                    Description
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 9 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={newWedding.description}
                                    slotProps={{ input: { readOnly: true } }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                </Paper>
            )}
        </Stack>
    );
};

export default NewEventButton;