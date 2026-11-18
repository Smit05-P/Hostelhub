import { NextResponse } from 'next/server';
import { POST as authLoginPost } from '@/app/api/auth/login/route';

/**
 * Legacy alias for unified /api/auth/login
 * Ensures backward compatibility with existing admin accounts
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const modifiedBody = {
      ...body,
      role: body.role || 'admin',
    };

    const mockRequest = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(modifiedBody),
    });

    return await authLoginPost(mockRequest);
  } catch (error) {
    console.error('Hostel Login Alias Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
