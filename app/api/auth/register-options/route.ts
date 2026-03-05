import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function GET() {
  try {
    // Next.js 13 App Router の headers() は同期で取得可能
    // 型エラーを避けるため any にキャスト
    const headersList = headers() as any; 
    const host = headersList.get('host') || 'localhost';
    const rpID = host.split(':')[0];

    const options = generateRegistrationOptions({
      rpName: '議員相談管理システム',
      rpID,

      userID: new TextEncoder().encode('admin-001'),
      userName: 'tanaka-giin',
      userDisplayName: '田中議員',

      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // 内蔵型デバイス限定
        residentKey: 'discouraged',          // パスキー生成は不要
        requireResidentKey: false,
        userVerification: 'required',        // 生体認証必須
      },

      supportedAlgorithmIDs: [-7, -257],
      timeout: 60000,
    });

    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}