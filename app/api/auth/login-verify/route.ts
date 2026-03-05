///ログイン処理

// directory: app/api/auth/login-verify/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { client } from '@/db/client';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

/**
 * WebAuthn Login Verification API
 * 認証器からのレスポンスを検証し、成功時に管理セッションを確立します。
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. バリデーション: 必要なパラメータの存在確認
    if (!body.id || !body.challenge) {
      throw new Error("リクエストボディ（ID/Challenge）が不足しています。");
    }

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // 2. 永続層（DB）から認証器情報を取得
    const resultSet = await client.execute({
      sql: `SELECT credential_id, public_key, counter FROM authenticators WHERE id = ?`,
      args: [body.id]
    });

    const dbAuthenticator = resultSet.rows[0];

    // 論理的検証: 該当する認証器が登録されているか
    if (!dbAuthenticator || !dbAuthenticator.public_key || !dbAuthenticator.credential_id) {
      console.error("❌ DB Data Missing:", dbAuthenticator);
      return NextResponse.json({ error: '認証器のデータが見つかりません。' }, { status: 404 });
    }

    // データの正規化
    const pubKeyRaw = dbAuthenticator.public_key as any;
    const credIdRaw = dbAuthenticator.credential_id as any;
    const cleanPublicKey = new Uint8Array(pubKeyRaw);
    const cleanCredentialID = new Uint8Array(credIdRaw);

    // 3. WebAuthn 検証ロジックの実行
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: (challenge) => {
        const b1 = isoBase64URL.toBuffer(body.challenge);
        const b2 = isoBase64URL.toBuffer(challenge);
        return isoUint8Array.areEqual(b1, b2);
      },
      expectedOrigin: `${protocol}://${host}`,
      expectedRPID: host.split(':')[0],
      credential: {
        id: isoBase64URL.fromBuffer(cleanCredentialID),
        publicKey: cleanPublicKey as unknown as Uint8Array<ArrayBuffer>,
        counter: Number(dbAuthenticator.counter),
      },
      requireUserVerification: true,
    });

    // 4. 検証成功時の処理
    if (verification.verified) {
      // カウンターの更新（クローン・リプレイ攻撃対策）
      await client.execute({
        sql: `UPDATE authenticators SET counter = ? WHERE id = ?`,
        args: [verification.authenticationInfo.newCounter, body.id]
      });

      // --- 【重要修正】セッション確立の論理 ---
      // 1. レスポンスオブジェクトを先に生成
      const response = NextResponse.json({ verified: true });

      // 2. レスポンスと紐づけてセッションを取得（ここにSet-Cookieが書き込まれる）
      const session = await getIronSession(req, response, sessionOptions);

      // 3. 管理者権限を付与
      (session as any).isAdmin = true;

      // 4. セッションを暗号化してCookieに書き出し
      await session.save();

      // セッションCookieが含まれたレスポンスを返す
      return response;
    }

    // 検証失敗
    return NextResponse.json({ verified: false, error: '検証に失敗しました。' }, { status: 400 });

  } catch (error: any) {
    console.error("❌ Login Verification Fatal Error:", error);
    return NextResponse.json({ 
      error: error.message || "予期せぬエラーが発生しました",
    }, { status: 500 });
  }
}