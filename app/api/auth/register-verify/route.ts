// directory: app/api/auth/register-verify/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { client } from '@/db/client.ts';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 【論理的重要点】リクエストヘッダーから現在のドメインを動的に取得
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost';
    
    // プロトコル（httpsかhttpか）を判定
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const expectedOrigin = `${protocol}://${host}`;
    const expectedRPID = host.split(':')[0];

    // 本来はセッション等からチャレンジを取得するが、実装に合わせてbodyから取得
    const expectedChallenge = body.challenge;

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential } = registrationInfo;

      // データベースへの保存（オブジェクト指向的整合性）
      await client.execute({
        sql: `INSERT INTO authenticators (id, credential_id, public_key, counter, user_id) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          body.id,
          isoBase64URL.toBuffer(credential.id), 
          credential.publicKey, 
          credential.counter,
          'admin-001' // テスト用固定ID
        ]
      });

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false, error: '検証に失敗しました。' }, { status: 400 });

  } catch (error: any) {
    console.error("❌ Verification Error:", error);
    // 確実にJSONを返すことでフロント側のSyntaxErrorを防ぐ
    return NextResponse.json({ verified: false, error: error.message }, { status: 500 });
  }
}