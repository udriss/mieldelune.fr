// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // 1. GÉRER LES REQUÊTES API ET CORS
  if (url.pathname.startsWith('/api')) {
    // Gérer les requêtes OPTIONS (preflight) pour CORS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // Ou spécifiez les domaines autorisés
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Pour les autres méthodes, ajouter les headers CORS à la réponse
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  // 2. GÉRER L'AUTHENTIFICATION ADMIN (votre code existant)
  if (url.pathname.startsWith('/admin')) {
    const token = request.cookies.get('adminAuth')?.value;
    
    // Allow access to login page
    if (url.pathname === '/admin/login') {
      if (!token) {
        return NextResponse.next();
      }
      try {
        await jwtVerify(token, SECRET_KEY);
        return NextResponse.rewrite(new URL('/admin', request.url));
      } catch {
        return NextResponse.next();
      }
    }

    // All other admin routes require valid token
    if (!token) {
      return NextResponse.rewrite(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch {
      return NextResponse.rewrite(new URL('/admin/login', request.url));
    }
  }

  // Pour toutes les autres routes, continuer normalement
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*']
};