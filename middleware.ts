import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('adminAuth')?.value;
  const url = request.nextUrl.clone();

  // Only check admin routes
  if (!url.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (url.pathname === '/admin/login') {
    if (!token) {
      return NextResponse.next();
    }
    try {
      await jwtVerify(token, SECRET_KEY);
      // Use rewrite instead of redirect for production
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

export const config = {
  matcher: ['/admin/:path*']
};