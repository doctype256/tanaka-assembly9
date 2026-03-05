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
      requireUserVerification: true, // 生体認証必須
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      // ----------------------------
      // パスキー（resident key）禁止チェック
      // ----------------------------
      // registrationInfo は @simplewebauthn/server の型に沿って確認
      // residentKey が 'required' ならパスキー扱いとして弾く
      if ((registrationInfo as any).residentKey === 'required') {
        throw new Error('❌ パスキーは使用できません。生体認証のみ登録してください。');
      }

      // 内蔵型認証器以外も弾く場合
      if ((registrationInfo as any).credentialDeviceType !== 'platform') {
        throw new Error('❌ 内蔵デバイス以外は使用できません。');
      }

      const info = (registrationInfo as any).credential;

      // 生のバイナリをDBに保存
      const rawCredentialID = info.id;       // Uint8Array
      const rawPublicKey = info.publicKey;   // Uint8Array

      await client.execute({
        sql: `INSERT INTO authenticators (id, credential_id, user_id, public_key, counter) VALUES (?, ?, ?, ?, ?)`,
        args: [
          body.id,
          rawCredentialID,
          'admin-001',
          rawPublicKey,
          info.counter
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