// directory: app/api/consultations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ConsultationRepository } from '@/db/repository/ConsultationRepository';
import { client } from "@/db/client";
import { SecureCrypto } from '@/lib/crypto';
import { AuditLogRepository } from '@/db/repository/AuditLogRepository';
import nodemailer from 'nodemailer';

/**
 * POST: 相談受付・保存・暗号化
 * オブジェクト指向に基づき、信頼境界（Security Boundary）での検知・記録・遮断を厳格に行います。
 */
export async function POST(req: NextRequest) {
  const secureCrypto = new SecureCrypto();

  // メタデータの取得
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
  const ip_hash = secureCrypto.hashToken(ip);
  const user_agent = req.headers.get('user-agent') || 'unknown';
  const referer_url = req.headers.get('referer') || 'unknown';

  try {
    const body = await req.json();

    // --- 1. Invisible CAPTCHA (Honeypot) チェック ---
    // 論理的修正：検知時にログを記録し、ステータス 400 を返してテスト側で検知可能にする
    if (body.hp_field && body.hp_field.length > 0) {
      console.warn(`[Spam Detected] IP Hash: ${ip_hash}`);
      
      // 監査ログへ記録
      await AuditLogRepository.create({
        consultation_id: null,
        action_type: 'POST',
        status: 'SPAM_REJECTED',
        ip_hash,
        user_agent
      });

      // テストスクリプトが検知できるよう、400 Bad Request を明示的に返す
      return NextResponse.json(
        { success: false, error: 'Spam detected.' }, 
        { status: 400 }
      );
    }

    // --- 2. 必須バリデーション ---
    const { target_type, place_type, content_type, suggestion_topic, message } = body;
    if (!target_type || !place_type || !content_type || !suggestion_topic || !message) {
      return NextResponse.json({ error: '必須項目が不足しています。' }, { status: 400 });
    }

    // --- 3. XSS攻撃検知 ---
    const xssPattern = /<script|javascript:|onclick|onmouseover|onerror/i;
    if (xssPattern.test(message) || xssPattern.test(suggestion_topic)) {
      console.error(`[XSS Blocked] Attempt from IP Hash: ${ip_hash}`);
      
      await AuditLogRepository.create({
        consultation_id: null,
        action_type: 'POST',
        status: 'XSS_BLOCKED',
        ip_hash,
        user_agent
      });

      return NextResponse.json({ error: '不正な入力が含まれています。' }, { status: 400 });
    }

    // --- 4. サニタイズ処理 ---
    const sanitize = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const safeTopic = sanitize(suggestion_topic);
    const safeMessage = sanitize(message);

    // --- 5. 暗号化処理 ---
    const encryptedMessage = secureCrypto.encrypt(safeMessage);
    const rawToken = secureCrypto.generateRawToken();
    const tokenHash = secureCrypto.hashToken(rawToken);

    // --- 6. DB保存 ---
    const result = await ConsultationRepository.create({
      target_type,
      place_type,
      content_type,
      suggestion_topic: safeTopic,
      needs_reply: !!body.needs_reply,
      email: body.email || null,
      message: safeMessage,
      encrypted_message: encryptedMessage,
      token_hash: tokenHash,
      ip_hash,
      user_agent,
      referer_url,
    });

    const newId = Number(result.lastInsertRowid);

    // --- 7. 成功ログの記録 ---
    await AuditLogRepository.create({
      consultation_id: newId,
      action_type: 'POST',
      status: 'SUCCESS',
      ip_hash,
      user_agent
    });

    // --- 8. 管理者への通知メール送信 (環境設定がある場合のみ) ---
    // ※ 処理の重延を避けるため、本来は background job が望ましい
    try {
      const settingsResult = await client.execute({
        sql: "SELECT key, value FROM site_settings WHERE key IN ('admin_notification_email', 'smtp_user', 'smtp_pass')",
        args: []
      });

      const settings: Record<string, string> = {};
      settingsResult.rows.forEach(row => {
        settings[row.key as string] = row.value as string;
      });

      if (settings['admin_notification_email'] && settings['smtp_user'] && settings['smtp_pass']) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: settings['smtp_user'], pass: settings['smtp_pass'] },
        });

        await transporter.sendMail({
          from: settings['smtp_user'],
          to: settings['admin_notification_email'],
          subject: `【新着相談】${safeTopic}`,
          text: `新しい相談が届きました。\n\nテーマ：${safeTopic}\n内容：\n${safeMessage}`.trim(),
        });
      }
    } catch (e) {
      console.error('Mail notification failed:', e);
    }

    return NextResponse.json({
      success: true,
      raw_token: rawToken
    });

  } catch (error: any) {
    console.error('API Error:', error);
    await AuditLogRepository.create({
      consultation_id: null,
      action_type: 'POST',
      status: 'FAILURE',
      ip_hash,
      user_agent
    });
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}