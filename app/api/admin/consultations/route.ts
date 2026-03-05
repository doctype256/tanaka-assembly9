// directory: app/api/admin/consultations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ConsultationRepository } from '@/db/repository/ConsultationRepository';
import { client } from "@/db/client";
import { SecureCrypto } from '@/lib/crypto';

const cryptoProcessor = new SecureCrypto();

const resolveContent = (row: any): string => {
  try {
    if (row.encrypted_message && row.encrypted_message.includes(':')) {
      return cryptoProcessor.decrypt(row.encrypted_message);
    }
    return row.message || "";
  } catch (error) {
    return "【復号に失敗しました】";
  }
};

export async function GET() {
  try {
    const rows = await ConsultationRepository.findAll();
    const sanitizedRows = rows.map((row: any) => ({
      ...row,
      message: resolveContent(row) || "（本文データ無し）",
      needs_reply: Boolean(row.needs_reply)
    }));

    return NextResponse.json(sanitizedRows, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';"
      },
    });
  } catch (error) {
    return NextResponse.json({ error: '取得失敗' }, { status: 500 });
  }
}

/**
 * DELETE: 議員（管理者）によるデータ消去
 * 論理：相談本体は消すが、証跡（ログ）は物理的に残す
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idString = searchParams.get('id');
    if (!idString) return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    const ids = idString.split(',').map(id => Number(id.trim())).filter(n => !isNaN(n));
    const placeholders = ids.map(() => '?').join(',');

    // セキュリティ・ガードを一時解除
    await client.execute("UPDATE site_settings SET value = 'true' WHERE key = 'system_cleanup_running'");

    try {
      // 削除実行。監査ログは ON DELETE SET NULL によりレコードが維持される
      const sql = `DELETE FROM consultations WHERE id IN (${placeholders})`;
      await client.execute({ sql, args: ids });
    } finally {
      // 成功・失敗に関わらずガードを再有効化
      await client.execute("UPDATE site_settings SET value = 'false' WHERE key = 'system_cleanup_running'");
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error("Delete API Error:", error);
    return NextResponse.json({ error: '削除に失敗しました', details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, admin_memo } = body;
    if (!id) return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    if (status !== undefined) await ConsultationRepository.updateStatus(id, status);
    if (admin_memo !== undefined) await ConsultationRepository.updateAdminMemo(id, admin_memo);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}