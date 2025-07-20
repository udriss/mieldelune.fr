import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const router = useRouter();
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        px: 3,
        py: 2,
        background: 'rgba(30, 41, 59, 0.4)',
        color: 'white',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px 0 rgba(0,0,0,0.06)',
        minHeight: 64,
        maxWidth: 900,
        minWidth: 900,
        margin: '0 auto',
        my: 2,
      }}
    >
      <Button
        variant="contained"
        color="primary"
        size='small'
        onClick={() => router.push("/")}
        startIcon={<ArrowLeft style={{ width: 20, height: 20 }} />}
        sx={{
          fontWeight: 700,
          borderRadius: 2,
          fontSize: '0.75rem',
          letterSpacing: 2,
          textTransform: 'uppercase',
          px: 2,
          py: 0.5,
          background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)',
          color: 'white',
          boxShadow: 'none',
          minWidth: 0,
          '&:hover': {
            background: 'linear-gradient(90deg, #1e40af 0%, #2563eb 100%)',
          },
        }}
      >
        Retour à l'accueil
      </Button>
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography
          variant="overline"
          fontWeight={700}
          sx={{
            color: 'white',
            letterSpacing: 2,
            fontSize: '1.1rem',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Panneau admin
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="error"
        size='small'
        onClick={onLogout}
        sx={{
          fontWeight: 700,
          borderRadius: 2,
          fontSize: '0.75rem',
          letterSpacing: 2,
          textTransform: 'uppercase',
          px: 2,
          py: 0.5,
          background: 'linear-gradient(90deg, #ef44448e 0%, #b91c1c8e 100%)',
          color: 'white',
          boxShadow: 'none',
          minWidth: 0,
          '&:hover': {
            background: 'linear-gradient(90deg, #b91c1c8e 0%, #ef44448e 100%)',
          },
        }}
      >
        Déconnexion
      </Button>
    </Box>
  );
}