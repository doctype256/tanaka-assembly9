import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import db from "@/db/client";

// ✅ セッションデータの型定義
interface SessionData {
  isAdmin?: boolean;
}

// 共通CORSヘッダー
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// テーブル作成（初回のみ）
export async function createTables() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        year INTEGER NOT NULL,
        items TEXT NOT NULL,
        photos TEXT,
        updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
      );
    `);
    console.log("Tables created or already exist.");

    const result = await db.execute(`SELECT COUNT(*) as count FROM activity_reports;`);
    const count: number = Number(result.rows[0]?.count);

    if (count > 0) {
      console.log("Data already exists, skipping initial data insertion.");
      return;
    }

    await createInitialData();
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

// 初期データ挿入（省略せずそのまま使ってOK）
async function createInitialData() {
  // ...元のコードと同じ内容をここに貼ってね！
}

createTables();

// GET: 活動報告の取得（認証なしでもOK）
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const query = id
      ? `SELECT * FROM activity_reports WHERE id = ?`
      : `SELECT * FROM activity_reports ORDER BY year DESC, id DESC`;
    const result = await db.execute(query, id ? [id] : []);

    const reports = result.rows.map((row: any) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      year: row.year,
      items: JSON.parse(row.items),
      photos: row.photos ? JSON.parse(row.photos) : [],
      updated_at: row.updated_at || null,
    }));

    return new NextResponse(JSON.stringify({ success: true, reports }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching activity reports:", error);
    return new NextResponse(JSON.stringify({ success: false, error: "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// POST: 活動報告の追加（セッション認証）
export async function POST(req: Request) {
  try {
    const res = new NextResponse();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.isAdmin) {
      return new NextResponse(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { category, title, year, items, photos } = body;

    if (!category || !title || !year || !items || !Array.isArray(items)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "必要なデータが不足しています。" }),
        { status: 400 }
      );
    }

    const itemsJSON = JSON.stringify(items);
    const photosJSON = photos ? JSON.stringify(photos) : null;

    await db.execute(
      `INSERT INTO activity_reports (category, title, year, items, photos, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'));`,
      [category, title, year, itemsJSON, photosJSON]
    );

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "活動報告が保存されました。",
        data: { category, title, year, items, photos },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving activity report:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "保存に失敗しました。" }),
      { status: 500 }
    );
  }
}

// PATCH: 活動報告の更新（セッション認証）
export async function PATCH(req: Request) {
  try {
    const res = new NextResponse();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.isAdmin) {
      return new NextResponse(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { id, category, title, year, items, photos } = body;

    if (!id || !category || !title || !year || !items || !Array.isArray(items)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "必要なデータが不足しています。" }),
        { status: 400 }
      );
    }

    const itemsJSON = JSON.stringify(items);
    const photosJSON = photos ? JSON.stringify(photos) : null;

    await db.execute(
      `UPDATE activity_reports
       SET category = ?, title = ?, year = ?, items = ?, photos = ?, updated_at = datetime('now', 'localtime')
       WHERE id = ?;`,
      [category, title, year, itemsJSON, photosJSON, id]
    );

    return new NextResponse(
      JSON.stringify({ success: true, message: "活動報告が更新されました。" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating activity report:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "更新に失敗しました。" }),
      { status: 500 }
    );
  }
}

// DELETE: 活動報告の削除（セッション認証）
export async function DELETE(req: Request) {
  try {
    const res = new NextResponse();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.isAdmin) {
      return new NextResponse(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "id is required" }),
        { status: 400 }
      );
    }

    await db.execute(`DELETE FROM activity_reports WHERE id = ?;`, [id]);

    return new NextResponse(
      JSON.stringify({ success: true, message: "活動報告が削除されました。" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting activity report:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "削除に失敗しました。" }),
      { status: 500 }
    );
  }
}
