// app/api/notify/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/db/client';
import nodemailer from 'nodemailer';

type SettingRow = { value: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { ok: false, error: 'subject or message missing' },
        { status: 400 }
      );
    }

    // -------------------------------
    // 管理者メールとSMTP情報の取得
    // -------------------------------
    const getSettingValue = async (key: string): Promise<string> => {
      const result = await client.execute({
        sql: `SELECT value FROM settings WHERE key = ?`,
        args: [key],
      });

      // 型安全に unknown → SettingRow[]
      const rows = result as unknown as SettingRow[];
      if (!rows || rows.length === 0 || !rows[0].value) {
        throw new Error(`Setting "${key}" is not defined`);
      }

      return rows[0].value;
    };

    const adminEmail = await getSettingValue('admin_notification_email');
    const smtpUser = await getSettingValue('smtp_user');
    const smtpPass = await getSettingValue('smtp_pass');

    // -------------------------------
    // Nodemailer でメール送信
    // -------------------------------
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: adminEmail,
      subject,
      text: message,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Notify Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}