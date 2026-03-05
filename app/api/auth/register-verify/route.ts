import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { client } from '@/db/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const expectedOrigin = `${protocol}://${host}`;
    const expectedRPID = host.split(':')[0];

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: body.challenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const info = (registrationInfo as any).credential; 
      
      // 🚨 【ここを修正】toString('base64url') を削除し、生のバイナリ(Uint8Array)を渡す
      // ログイン側が以前動いていたなら、DBはバイナリを期待しています。
      const rawCredentialID = info.id;       // Uint8Array のまま
      const rawPublicKey = info.publicKey;   // Uint8Array のまま

      await client.execute({
        sql: `INSERT INTO authenticators (id, credential_id, user_id, public_key, counter) VALUES (?, ?, ?, ?, ?)`,
        args: [
          body.id,             // id (フロントエンドから送られてくる一意のID)
          rawCredentialID,     // credential_id (BLOB列にバイナリとして保存)
          'admin-001',         // user_id
          rawPublicKey,        // public_key (BLOB列にバイナリとして保存)
          info.counter         // counter
        ]
      });

      return NextResponse.json({ verified: true });
    }
    return NextResponse.json({ verified: false, error: '検証失敗' }, { status: 400 });
  } catch (error: any) {
    console.error("❌ Register Error:", error);
    return NextResponse.json({ verified: false, error: error.message }, { status: 500 });
  }
}