'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography, Button, TextField, Popover, IconButton } from '@mui/material';
import { HexColorPicker, RgbaColorPicker } from 'react-colorful';
import { ColorResult } from 'react-color';

interface ColorCircleProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorCircle({ color, onChange }: ColorCircleProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const [colorMode, setColorMode] = useState<'hex' | 'rgba'>('hex');
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  useEffect(() => {
    if (isPickerOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const pickerHeight = 450; // Approximate height of the color picker
      const pickerWidth = 320; // Approximate width of the color picker
      
      let top = rect.bottom + 8;
      let left = rect.left - 60;
      
      // Adjust if picker would go below viewport
      if (top + pickerHeight > viewportHeight) {
        top = rect.top - pickerHeight - 8;
      }
      
      // Adjust if picker would go outside viewport horizontally
      if (left + pickerWidth > viewportWidth) {
        left = viewportWidth - pickerWidth - 8;
      }
      if (left < 8) {
        left = 8;
      }
      
      setPickerPosition({ top, left });
    }
  }, [isPickerOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isPickerOpen && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        // Check if clicked outside the picker too
        const pickerElement = document.querySelector('[data-color-picker="true"]');
        if (pickerElement && !pickerElement.contains(event.target as Node)) {
          handleCancel();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  const parseRgbaColor = (colorStr: string) => {
    if (colorStr.startsWith('rgba')) {
      const match = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: parseFloat(match[4])
        };
      }
    }
    return { r: 255, g: 0, b: 0, a: 1 };
  };

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
  };

  const handleRgbaChange = (newRgba: { r: number, g: number, b: number, a: number }) => {
    const rgbaString = `rgba(${newRgba.r}, ${newRgba.g}, ${newRgba.b}, ${newRgba.a})`;
    setTempColor(rgbaString);
  };

  const handleClick = () => {
    setIsPickerOpen(!isPickerOpen);
  };

  const handleConfirm = () => {
    onChange(tempColor);
    setIsPickerOpen(false);
  };

  const handleCancel = () => {
    setTempColor(color);
    setIsPickerOpen(false);
  };

  const handlePopoverClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsPickerOpen(true);
    setPickerPosition({
      top: event.currentTarget.getBoundingClientRect().top - 250, // Adjust as needed
      left: event.currentTarget.getBoundingClientRect().left + event.currentTarget.getBoundingClientRect().width / 2 - 135, // Center the picker
    });
  };

  const handleClose = () => {
    setIsPickerOpen(false);
  };

  const handleChangeComplete = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
    handleClose();
  };

  const renderColorPicker = () => {
    if (!isPickerOpen) return null;

    return createPortal(
      <Box
        data-color-picker="true"
        sx={{
          position: 'fixed',
          top: pickerPosition?.top,
          left: pickerPosition?.left,
          zIndex: 9999,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          p: 2,
          minWidth: 320,
          maxWidth: 320
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2">Choisir une couleur</Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant={colorMode === 'hex' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('hex')}
            >
              HEX
            </Button>
            <Button
              size="small"
              variant={colorMode === 'rgba' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('rgba')}
            >
              RGBA
            </Button>
          </Box>
        </Box>
        
        <Box mb={2}>
          {colorMode === 'hex' ? (
            <HexColorPicker
              color={tempColor.startsWith('#') ? tempColor : '#ff0000'}
              onChange={handleColorChange}
              style={{ width: '100%' }}
            />
          ) : (
            <RgbaColorPicker
              color={tempColor.startsWith('rgba') ? parseRgbaColor(tempColor) : { r: 255, g: 0, b: 0, a: 1 }}
              onChange={handleRgbaChange}
              style={{ width: '100%' }}
            />
          )}
        </Box>
        
        <TextField
          fullWidth
          label="Code couleur"
          value={tempColor}
          onChange={(e) => setTempColor(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
        />

        <Box display="flex" justifyContent="space-between" gap={1}>
          <Button 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={handleCancel}
          >
            Annuler
          </Button>
          <Button 
            size="small" 
            variant="contained"
            onClick={handleConfirm}
          >
            Confirmer
          </Button>
        </Box>
      </Box>,
      document.body
    );
  };

  return (
    <Box position="relative" display="inline-block">
      <Box
        ref={buttonRef}
        onClick={handleClick}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: color,
          border: '2px solid #bbb',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 0 8px #0003'
          }
        }}
        title={`Couleur actuelle: ${color}`}
      />

      {renderColorPicker()}

      <Popover
        open={isPickerOpen}
        anchorEl={buttonRef.current}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: {
            opacity: pickerPosition ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            overflow: 'visible', // Important to prevent clipping
            ...pickerPosition,
          },
        }}
      >

      </Popover>
    </Box>
  );
}
