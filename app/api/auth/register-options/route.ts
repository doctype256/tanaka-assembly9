// directory: app/api/auth/register-options/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function GET() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost';
    
    /** * 【論理的修正】
     * トンネル経由なら xxx.trycloudflare.com が、
     * ローカルなら localhost:3000 が自動で入ります。
     */
    const rpID = host.split(':')[0]; 

    const options = await generateRegistrationOptions({
      rpName: '議員相談管理システム',
      rpID,
      userID: new TextEncoder().encode('admin-001'),
      userName: 'tanaka-giin',
      userDisplayName: '田中議員',
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'required',
      },
    });

    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}