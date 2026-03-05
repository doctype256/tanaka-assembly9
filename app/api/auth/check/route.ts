import { NextResponse } from 'next/server';
import { client } from '@/db/client'; // クライアントのインポートが必要

export async function GET() {
  try {
    const result = await client.execute("SELECT COUNT(*) as count FROM authenticators");
    
    // Tursoの戻り値から数値を確実に取得する
    const count = Number(result.rows[0]?.count || 0);
    const isEnrolled = count > 0;

    return NextResponse.json({ isEnrolled });
  } catch (error: any) {
    console.error("Check Error:", error);
    return NextResponse.json({ isEnrolled: false, error: error.message }, { status: 500 });
  }
}