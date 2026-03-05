// directory: lib/auth-guard.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from './session';

/**
 * AuthGuard: 認証状態の論理的検証
 */
export async function applyAuthGuard(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 除外判定
  if (!pathname.startsWith('/admin')) return null;
  const isPublicAdminPage = ['/admin/login', '/admin/recovery', '/admin/settings/recovery'].includes(pathname);
  if (isPublicAdminPage) return null;

  // 2. セッションの取得 (NextResponse.next() を内部で生成してセッションを読み出す)
  const dummyResponse = new NextResponse();
  const session = await getIronSession(request, dummyResponse, sessionOptions);

  // 3. 認証判定
  // session が存在しない、または isAdmin が true でない場合
  const adminData = (session as any).isAdmin;

  if (adminData !== true) {
    console.warn(`[AuthGuard] Blocked: isAdmin is ${adminData}. Path: ${pathname}`);
    
    const loginUrl = new URL('/admin/login', request.url);
    const redirectRes = NextResponse.redirect(loginUrl);
    
    // キャッシュを無効化
    redirectRes.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return redirectRes;
  }

  // 4. 成功時は null を返し、middleware.ts 側で response.headers を設定させる
  return null;
}