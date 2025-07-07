import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import CryptoJS from 'crypto-js'

const STORED_HASH = process.env.STORED_HASH as string
const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY as string)


if (!process.env.SECRET_KEY) {
  throw new Error('JWT_SECRET is not defined');
}

if (!STORED_HASH) {
  throw new Error('STORED_HASH is not defined');
}

export async function POST(request: Request) {
  try {
    const { password, rememberMe } = await request.json();
    const hashedPassword = CryptoJS.SHA256(password).toString();
    
    if (hashedPassword === STORED_HASH) {
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(rememberMe ? '7d' : '24h')
        .sign(SECRET_KEY);

      const response = NextResponse.json({ 
        success: true,
        message: 'Connexion réussie' 
      });

      response.cookies.set({
        name: 'adminAuth',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : 1 * 60 * 60
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Mot de passe incorrect' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}