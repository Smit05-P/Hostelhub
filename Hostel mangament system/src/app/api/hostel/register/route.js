import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { hashPassword, signJwt } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const body = await req.json();
    const { hostelName, ownerName, email, phone, address, password } = body;

    if (!hostelName || !ownerName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hostelsRef = collection(db, 'hostels');
    
    // Check if email already exists
    const q = query(hostelsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the document
    const newHostelDoc = await addDoc(hostelsRef, {
      hostelName,
      ownerName,
      email,
      phone: phone || '',
      address: address || '',
      passwordHash,
      plan: 'free',
      status: 'active',
      createdAt: serverTimestamp(),
    });

    const hostelId = newHostelDoc.id;

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
      message: 'Hostel account created successfully',
      hostelId 
    }, { status: 201 });

  } catch (error) {
    console.error('Hostel Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
