/**
 * directory: app/api/top-page/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
// エラー修正: db を default import として受け取る、または適切なエクスポート名に変更
import db from "@/db/client"; 
import { TopPageRepository } from "@/db/repository/TopPageRepository";

// リポジトリのインスタンス化
const repo = new TopPageRepository(db);

/**
 * 設定取得エンドポイント
 */
export async function GET() {
  try {
    const data = await repo.getSettings();
    // 取得データが空の場合はデフォルト値を返す
    return NextResponse.json(data || {
      heroImg: '',
      address: '',
      mapUrl: '',
      ytUrl: '',
      snsJson: '[]'
    });
  } catch (error) {
    console.error("GET /api/top-page Error:", error);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}

/**
 * 設定更新エンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // パスワードチェックが必要な場合はここで this.adminPassword 等と照合するロジックを追加可能
    // 現時点では疎通優先で更新を実行
    await repo.updateSettings(body);
    
    return NextResponse.json({ message: "更新完了" });
  } catch (error) {
    console.error("POST /api/top-page Error:", error);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}