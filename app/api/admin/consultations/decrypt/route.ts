// directory: app/api/admin/consultations/decrypt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SecureCrypto } from '@/lib/crypto';
import { client } from '@/db/client';
import { AuditLogRepository } from '@/db/repository/AuditLogRepository';

/**
 * GET: 管理者による相談内容の復号
 * 課題7準拠：管理者の閲覧アクションを監査ログに記録する
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const crypto = new SecureCrypto();

  // ログ用メタデータ
  const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
  const ipHash = crypto.hashToken(ip);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  if (!id) {
    return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
  }

  try {
    // 1. データベースから暗号化された相談内容を取得
    const res = await client.execute({
      sql: `SELECT id, encrypted_message FROM consultations WHERE id = ?`,
      args: [id]
    });

    // Row型から目的の型へ二段階キャスト
    const row = res.rows[0] as unknown as { id: number; encrypted_message: string } | undefined;

    if (!row) {
      return NextResponse.json({ error: '相談が見つかりません' }, { status: 404 });
    }

    // 2. AES-256-GCMによる復号
    const decryptedMessage = crypto.decrypt(row.encrypted_message);

    // 3. 【課題7：ログ設計】管理者が「閲覧」したことを記録
    await AuditLogRepository.create({
      consultation_id: row.id,
      action_type: 'ACCESS', 
      status: 'SUCCESS', // 型定義に合わせる
      ip_hash: ipHash,
      user_agent: userAgent
    });

    return NextResponse.json({
      decrypted: decryptedMessage
    });
  } catch (error) {
    console.error("Admin decryption error:", error);

    // 失敗時もログを記録
    if (id) {
      await AuditLogRepository.create({
        consultation_id: parseInt(id),
        action_type: 'ACCESS',
        status: 'FAILURE', // "ERROR" から "FAILURE" に修正
        ip_hash: ipHash,
        user_agent: userAgent
      });
    }

    return NextResponse.json({ error: '復号処理に失敗しました' }, { status: 500 });
  }
}