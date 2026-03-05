// directory: app/api/consultations/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SecureCrypto } from '@/lib/crypto';
import { ConsultationRepository } from '@/db/repository/ConsultationRepository';
import { AuditLogRepository } from '@/db/repository/AuditLogRepository';
import { client } from '@/db/client'; // 履歴取得用

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');
  const crypto = new SecureCrypto();

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tokenHash = crypto.hashToken(token);
    const consultation = await ConsultationRepository.findByTokenHash(tokenHash);
    if (!consultation) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    // 1. 初期メッセージの復号
    const initialMessage = crypto.decrypt(consultation.encrypted_message);

    // 2. 履歴の取得
    const historyRes = await client.execute({
      sql: `SELECT * FROM consultation_messages WHERE consultation_id = ? ORDER BY created_at ASC`,
      args: [consultation.id]
    });

    // 3. 履歴メッセージを一つずつ復号
    const history = historyRes.rows.map((row: any) => ({
      sender_type: row.sender_type,
      created_at: row.created_at,
      decrypted_body: crypto.decrypt(row.encrypted_body)
    }));

    return NextResponse.json({ initialMessage, history });
  } catch (error) {
    return NextResponse.json({ error: 'Data retrieval error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 以前提示した POST メソッド（暗号化して保存＋課題7のログ記録）をここに配置
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');
  const { message } = await req.json(); // フロントから送られてくる平文
  const crypto = new SecureCrypto();

  // ログ用メタデータ
  const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
  const ipHash = crypto.hashToken(ip);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  if (!token || !message) {
    return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
  }

  try {
    const tokenHash = crypto.hashToken(token);
    const consultation = await ConsultationRepository.findByTokenHash(tokenHash);

    if (!consultation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. 本文を AES-256-GCM で暗号化
    const encryptedBody = crypto.encrypt(message);

    // 2. データベースへ保存 (以前作成したテーブル)
    const sql = `
      INSERT INTO consultation_messages (consultation_id, sender_type, encrypted_body)
      VALUES (?, 'user', ?)
    `;
    // ※ 簡易化のため直接実行していますが、Repositoryクラスに分けるのがオブジェクト指向的です
    await client.execute({
      sql,
      args: [consultation.id, encryptedBody]
    });

    // 3. 【課題7：ログ設計】メッセージ送信成功を記録
    await AuditLogRepository.create({
      consultation_id: consultation.id,
      action_type: 'POST',
      status: 'SUCCESS',
      ip_hash: ipHash,
      user_agent: userAgent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post message error:", error);
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 });
  }
}