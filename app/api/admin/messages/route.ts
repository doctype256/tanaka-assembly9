// directory: app/api/admin/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SecureCrypto } from '@/lib/crypto';
import { client } from '@/db/client';
import { AuditLogRepository } from '@/db/repository/AuditLogRepository';

/**
 * GET: チャット履歴および相談詳細の取得（議員用）
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const crypto = new SecureCrypto();

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    // 1. 相談詳細（カテゴリ、場所、対象、本文など）の取得
    const consultationRes = await client.execute({
      sql: `SELECT 
              id, 
              target_type, 
              place_type, 
              content_type, 
              suggestion_topic, 
              needs_reply, 
              status, 
              encrypted_message, 
              created_at 
            FROM consultations WHERE id = ?`,
      args: [id]
    });

    const consultationRow = consultationRes.rows[0] as any;
    if (!consultationRow) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    }

    // 相談本文（初期メッセージ）を復号
    let decryptedInitialMessage = "";
    try {
      decryptedInitialMessage = crypto.decrypt(consultationRow.encrypted_message);
    } catch (e) {
      decryptedInitialMessage = "【復号失敗】";
    }

    const consultation = {
      ...consultationRow,
      message: decryptedInitialMessage,
      needs_reply: Boolean(consultationRow.needs_reply)
    };

    // 2. チャット履歴の取得
    const messagesRes = await client.execute({
      sql: `SELECT sender_type, encrypted_body, created_at FROM consultation_messages 
            WHERE consultation_id = ? ORDER BY created_at ASC`,
      args: [id]
    });
    const messageRows = messagesRes.rows as any[];

    const history = [];

    /* * 【論理的修正】
     * 以前ここで history.push({ sender_type: 'user', ... }) を行っていましたが、
     * 送信時に consultation_messages テーブルへも初期メッセージを保存している場合、
     * 下記のループ処理と内容が重複するため、手動 push を削除しました。
     */

    // DBに保存されているメッセージ（初期送信分を含む）を復号して history に追加
    for (const row of messageRows) {
      try {
        history.push({
          sender_type: row.sender_type,
          decrypted_body: crypto.decrypt(row.encrypted_body),
          created_at: row.created_at
        });
      } catch (e) {
        console.error(`Message decryption failed for row:`, row);
      }
    }

    return NextResponse.json({ consultation, history });

  } catch (error) {
    console.error("Admin fetch messages error:", error);
    return NextResponse.json({ error: '履歴の取得に失敗しました' }, { status: 500 });
  }
}

// POST メソッドは変更不要のため省略
export async function POST(req: NextRequest) {
  // ... (既存の POST ロジックをそのまま維持)
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const { message } = await req.json();
  const crypto = new SecureCrypto();

  const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
  const ipHash = crypto.hashToken(ip);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  if (!id || !message) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  try {
    const encryptedBody = crypto.encrypt(message);

    await client.execute({
      sql: `INSERT INTO consultation_messages (consultation_id, sender_type, encrypted_body) VALUES (?, 'admin', ?)`,
      args: [id, encryptedBody]
    });

    await client.execute({
      sql: `UPDATE consultations SET status = 'processing' WHERE id = ? AND status = 'unread'`,
      args: [id]
    });

    await AuditLogRepository.create({
      consultation_id: parseInt(id),
      action_type: 'POST', 
      status: 'SUCCESS',
      ip_hash: ipHash,
      user_agent: userAgent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin post message error:", error);
    await AuditLogRepository.create({
      consultation_id: parseInt(id),
      action_type: 'POST',
      status: 'FAILURE',
      ip_hash: ipHash,
      user_agent: userAgent
    });
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 });
  }
}