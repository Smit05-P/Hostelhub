import { NextResponse } from 'next/server';
import { POST as authRegisterPost } from '@/app/api/auth/register/route';

/**
 * Legacy alias for unified /api/auth/register
 * Ensures backward compatibility with existing admin registrations
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const modifiedBody = {
      ...body,
      name: body.ownerName || body.name || body.hostelName,
      role: 'admin',
    };

    const mockRequest = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(modifiedBody),
    });

    return await authRegisterPost(mockRequest);
  } catch (error) {
    console.error('Hostel Register Alias Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
