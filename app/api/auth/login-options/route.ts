// directory: app/api/auth/login-options/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

export async function GET() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost';
    const rpID = host.split(':')[0];

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
    });

    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}