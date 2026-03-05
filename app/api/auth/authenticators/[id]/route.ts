// directory: app/api/auth/authenticators/[id]/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/db/client.ts';

/**
 * DELETE: 指定された認証器IDを削除する
 * Next.js 15+ の非同期 params 仕様に対応した実装です。
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params は Promise 型として定義
) {
  try {
    // 【論理的修正】params を await して id を取得する
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: 'IDが指定されていません。' }, { status: 400 });
    }

    // セキュリティ上の論理チェック: 
    // user_id = 'admin-001' の認証器がこれ1つしかない場合は削除を拒否する
    const countResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM authenticators WHERE user_id = 'admin-001'`,
      args: []
    });
    
    const count = Number((countResult.rows[0] as any).count);
    if (count <= 1) {
      return NextResponse.json({ 
        error: '最後の1つであるため削除できません。ログインできなくなるのを防ぐため、別のデバイスを登録してから削除してください。' 
      }, { status: 403 });
    }

    // 削除の実行
    await client.execute({
      sql: `DELETE FROM authenticators WHERE id = ? AND user_id = 'admin-001'`,
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}