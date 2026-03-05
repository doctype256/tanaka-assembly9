import { NextResponse } from "next/server";
import db from "@/db/client";
import { writeFile, mkdir, unlink } from "fs/promises"; // unlink を追加
import path from "path";

// ===== GET (一覧取得) =====
export async function GET() {
  try {
    const result = await db.execute(`
      SELECT * FROM pdfs ORDER BY created_at DESC
    `);
    
    // データが空でも、必ず配列 [] を返すようにする
    const rows = result.rows || [];
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET PDFs error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// ===== POST (保存) =====
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const createdAt = formData.get('created_at') as string;

    if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public/uploads/pdfs');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const publicPath = `/uploads/pdfs/${fileName}`;
    await writeFile(path.join(uploadDir, fileName), buffer);

    await db.execute({
      sql: `INSERT INTO pdfs (title, description, file_path, file_name, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [title, description, publicPath, file.name, createdAt]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "保存失敗" }, { status: 500 });
  }
}

// ===== DELETE (ファイル実体も削除する版) =====
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;

    // 1. まずデータベースからファイルパスを取得する
    const result = await db.execute({
      sql: `SELECT file_path FROM pdfs WHERE id = ?`,
      args: [id]
    });

    const pdf = result.rows[0];

    if (pdf && pdf.file_path) {
      // 2. ファイルの実体パスを構築 (public フォルダ内のパスを絶対パスに変換)
      // pdf.file_path は "/uploads/pdfs/filename.pdf" という形式を想定
      const filePath = path.join(process.cwd(), 'public', pdf.file_path as string);

      try {
        // 3. サーバー上のファイルを削除
        await unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (err) {
        // ファイルが既に手動で消されている場合などのエラーをハンドリング
        console.warn("File already deleted or not found on server:", err);
      }
    }

    // 4. データベースのレコードを削除
    await db.execute({
      sql: `DELETE FROM pdfs WHERE id = ?`,
      args: [id]
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE PDFs error:", error);
    return NextResponse.json({ error: "Failed to delete PDF" }, { status: 500 });
  }
}