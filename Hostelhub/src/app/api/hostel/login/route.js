import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { verifyPassword, signJwt } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const hostelsRef = collection(db, 'hostels');
    const q = query(hostelsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const hostelDoc = querySnapshot.docs[0];
    const hostelData = hostelDoc.data();

    // Verify password
    const isValidPassword = await verifyPassword(password, hostelData.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (hostelData.status !== 'active') {
      return NextResponse.json({ error: 'Your account is inactive. Please contact support.' }, { status: 403 });
    }

    const hostelId = hostelDoc.id;

    // Generate JWT token
    const token = await signJwt({ hostelId, email });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'hostel-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Logged in successfully',
      hostelId
    }, { status: 200 });

  } catch (error) {
    console.error('Hostel Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
