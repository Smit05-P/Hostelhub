import { NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = 'auth_token';

export async function proxy(request) {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  const url = request.nextUrl.clone();
  
  let session = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      session = payload;
    } catch (error) {
      console.warn('Middleware: Invalid token');
    }
  }

  // Protect /admin routes
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

  // Protect /student routes
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
  
  // Restrict access to login/register for logged in users
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/student',
    '/student/:path*',
    '/login',
    '/register'
  ],
};
