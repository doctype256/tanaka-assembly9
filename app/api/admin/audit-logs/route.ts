// directory: app/api/admin/audit-logs/route.ts

import { NextResponse } from 'next/server';
import { AuditLogRepository } from '@/db/repository/AuditLogRepository';

/**
 * GET: 監査ログ一覧の取得
 * ※ WebAuthn等による管理者認証が完了している前提
 */
export async function GET() {
  try {
    const logs = await AuditLogRepository.findAll();

    // セキュリティヘッダーの付与（課題3：XSS対策共通）
    const headers = new Headers();
    headers.set('Content-Security-Policy', "default-src 'self';");
    headers.set('X-Content-Type-Options', 'nosniff');

    return NextResponse.json(logs, { status: 200, headers });
  } catch (error) {
    console.error('Audit Log Fetch Error:', error);
    return NextResponse.json({ error: 'ログの取得に失敗しました' }, { status: 500 });
  }
}