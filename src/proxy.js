import { NextResponse } from 'next/server';
import * as jose from 'jose';

const TOKEN_NAME = 'auth_token';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-jwt-secret-hostelhub-fallback-key-2026';
}

export async function proxy(request) {
  const url = request.nextUrl.clone();
  const origin = request.headers.get('origin') || '*';

  // 1. Handle CORS for API routes
  if (url.pathname.startsWith('/api/')) {
    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-hostel-id');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }
  }

  // 2. Read token from cookie or Authorization header
  let token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }
  
  let session = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(getJwtSecret());
      const { payload } = await jose.jwtVerify(token, secret);
      session = payload;
    } catch (error) {
      // Token is invalid or expired
      session = null;
    }
  }

  // 3. Protect /admin routes
  if (url.pathname.startsWith('/admin')) {
    if (!session) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      url.pathname = '/student/dashboard'; 
      return NextResponse.redirect(url);
    }

    if (url.pathname === '/admin') {
      url.pathname = '/admin/hostels';
      return NextResponse.redirect(url);
    }
  }

  // 4. Protect /student routes
  if (url.pathname.startsWith('/student')) {
    if (!session) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (session.role !== 'student') {
      url.pathname = '/admin/hostels';
      return NextResponse.redirect(url);
    }
    
    // Check for hostel selection
    if (!session.hostelId && 
        url.pathname !== '/student/select-hostel' && 
        url.pathname !== '/student/pending') {
      url.pathname = '/student/select-hostel';
      return NextResponse.redirect(url);
    }

    if (url.pathname === '/student') {
      url.pathname = '/student/dashboard';
      return NextResponse.redirect(url);
    }
  }
  
  // 5. Restrict access to login/register for logged-in users
  if (url.pathname === '/login' || url.pathname === '/register') {
    if (session) {
      if (session.role === 'admin' || session.role === 'super_admin') {
        url.pathname = '/admin/hostels';
        return NextResponse.redirect(url);
      } else if (session.role === 'student') {
        url.pathname = session.hostelId ? '/student/dashboard' : '/student/select-hostel';
        return NextResponse.redirect(url);
      }
    }
  }

  // 6. Normal response with CORS headers attached for API routes
  const response = NextResponse.next();
  if (url.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-hostel-id');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/student',
    '/student/:path*',
    '/login',
    '/register',
    '/api/:path*',
  ],
};
