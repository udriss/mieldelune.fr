"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

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
    <div className="container py-8 mt-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Connexion admin</h1>
      <Card className="max-w-md mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? "border-red-500 pr-10" : "pr-10"}
                autoComplete="current-password"
                aria-describedby={error ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && <p id="password-error" className="text-sm text-red-500">{error}</p>}
            
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Se souvenir de moi
              </label>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </Card>
    </div>
  );
}