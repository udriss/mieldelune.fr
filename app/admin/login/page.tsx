"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Box, 
  IconButton, 
  InputAdornment, 
  FormControlLabel, 
  Checkbox,
  Alert,
  CircularProgress
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = 'Connexion Admin | MielDeLune';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          password,
          rememberMe
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Force page reload and redirect
        window.location.href = '/admin';
      } else {
        setError(data.message || "Erreur de connexion");
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Container maxWidth="sm" sx={{ py: 4, mt: 8 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        Connexion admin
      </Typography>
      
      <Card sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
        <CardContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            autoComplete="on"
          >
            {/* Champ caché pour indiquer au navigateur qu'il s'agit d'un login sans username */}
            <input
              type="text"
              name="username"
              value="admin"
              autoComplete="username"
              style={{ display: 'none' }}
              readOnly
            />
            
            <TextField
              id="password"
              name="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              helperText={error || ""}
              autoComplete="current-password"
              variant="outlined"
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  name="remember"
                />
              }
              label="Se souvenir de moi"
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              size="large"
              sx={{ mt: 2 }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
    </>
  );
}