// directory: app/api/admin/consultations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/db/client';
import { SecureCrypto } from '@/lib/crypto';
import nodemailer from 'nodemailer';
export default function Page() {
  return <div>Consultations</div>;
}

const cryptoProcessor = new SecureCrypto();

type ConsultationCreate = {
  target_type: string;
  place_type: string;
  content_type: string;
  suggestion_topic: string;
  needs_reply: boolean;
  email?: string;
  message: string;
  encrypted_message: string;
  token_hash: string;
  ip_hash: string;
  user_agent: string;
  referer_url: string;
  status?: 'unread' | 'processing' | 'completed';
};

// メール送信関数
async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string
) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER, // 送信元は.env固定
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Consultation System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // メッセージ暗号化
    const encryptedMessage = cryptoProcessor.encrypt(body.message || '');

    const newConsultation: ConsultationCreate = {
      target_type: body.target_type || '',
      place_type: body.place_type || '',
      content_type: body.content_type || '',
      suggestion_topic: body.suggestion_topic || '',
      email: body.email,
      message: body.message,
      encrypted_message: encryptedMessage,
      needs_reply: Boolean(body.needs_reply),
      token_hash: body.token_hash || '',
      ip_hash: body.ip_hash || '',
      user_agent: body.user_agent || '',
      referer_url: body.referer_url || '',
      status: 'unread',
    };

    // DB登録
    const sql = `
      INSERT INTO consultations
      (
        target_type,
        place_type,
        content_type,
        suggestion_topic,
        needs_reply,
        email,
        message,
        encrypted_message,
        token_hash,
        ip_hash,
        user_agent,
        referer_url,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const args = [
      newConsultation.target_type,
      newConsultation.place_type,
      newConsultation.content_type,
      newConsultation.suggestion_topic,
      newConsultation.needs_reply ? 1 : 0,
      newConsultation.email || '',
      newConsultation.message,
      newConsultation.encrypted_message,
      newConsultation.token_hash,
      newConsultation.ip_hash,
      newConsultation.user_agent,
      newConsultation.referer_url,
      newConsultation.status,
    ];

    await client.execute({ sql, args });

    // メール通知
    if (newConsultation.needs_reply) {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

      if (adminEmail) {
        await sendNotificationEmail(
          adminEmail,
          `新しい相談が届きました: ${newConsultation.suggestion_topic}`,
          `
          <h2>新しい相談が届きました</h2>

          <p><strong>テーマ:</strong> ${newConsultation.suggestion_topic}</p>
          <p><strong>対象:</strong> ${newConsultation.target_type}</p>
          <p><strong>場所:</strong> ${newConsultation.place_type}</p>
          <p><strong>内容タイプ:</strong> ${newConsultation.content_type}</p>

          <hr/>

          <p><strong>本文:</strong></p>
          <p>${newConsultation.message}</p>

          <hr/>

          <p><strong>返信希望:</strong> ${
            newConsultation.needs_reply ? 'あり' : 'なし'
          }</p>

          <p><strong>返信先:</strong> ${
            newConsultation.email || '未入力'
          }</p>
          `
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Consultation POST Error:', error);

    return NextResponse.json(
      {
        error: '登録に失敗しました',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
