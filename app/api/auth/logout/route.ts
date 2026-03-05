// directory: app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

/**
 * Logout API: サーバー・クライアント両面でセッションを抹消する
 */
export async function POST(req: Request) {
  const response = NextResponse.json({ success: true });
  const session = await getIronSession(req, response, sessionOptions);

  // 1. iron-sessionの内部データを破棄
  session.destroy();

  // 2. Cookieを明示的に上書きして削除（論理的確実性）
  // sessionOptions.cookieName が 'session' であると仮定
  response.cookies.set(sessionOptions.cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0), // 過去の日付を指定して即時破棄
  });

  return response;
}