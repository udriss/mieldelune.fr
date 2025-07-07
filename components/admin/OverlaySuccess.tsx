import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface OverlaySuccessProps {
  show: boolean;
  animation: 'none' | 'enter' | 'exit';
}

export const OverlaySuccess: React.FC<OverlaySuccessProps> = ({ show, animation }) => {
  if (!show) return null;

  return (
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1500,
      borderRadius: '12px',
      pointerEvents: 'all', // Bloque toute interaction
      cursor: 'not-allowed',
      border: '2px solid #4caf50',
      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
      animation: animation === 'enter' 
        ? 'successEnter 0.6s ease forwards' 
        : animation === 'exit' 
          ? 'successExit 0.4s ease forwards' 
          : 'none',
      '@keyframes successEnter': {
        '0%': {
          opacity: 0,
          transform: 'scale(0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        },
        '50%': {
          opacity: 0.8,
          transform: 'scale(1.02)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)'
        },
        '100%': {
          opacity: 1,
          transform: 'scale(1)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }
      },
      '@keyframes successExit': {
        '0%': {
          opacity: 1,
          transform: 'scale(1)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        },
        '100%': {
          opacity: 0,
          transform: 'scale(0.95)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }}>
      {/* Icône de validation avec animation */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        animation: animation === 'enter' 
          ? 'checkmarkBounce 0.8s ease forwards'
          : 'none',
        '@keyframes checkmarkBounce': {
          '0%': {
            transform: 'scale(0.3) rotate(-45deg)',
            opacity: 0
          },
          '50%': {
            transform: 'scale(1.2) rotate(0deg)',
            opacity: 0.8
          },
          '70%': {
            transform: 'scale(0.9) rotate(0deg)',
            opacity: 1
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: 1
          }
        }
      }}>
        <CheckCircleOutlineIcon 
          sx={{ 
            fontSize: 60, 
            color: '#4caf50',
            filter: 'drop-shadow(0 2px 8px rgba(76, 175, 80, 0.3))'
          }} 
        />
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#4caf50', 
            fontWeight: 600,
            textAlign: 'center',
            animation: animation === 'enter' 
              ? 'textFadeIn 0.8s ease 0.3s forwards'
              : 'none',
            opacity: 0,
            '@keyframes textFadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            }
          }}
        >
          Sauvegardé avec succès
        </Typography>
      </Box>
    </Box>
  );
};
