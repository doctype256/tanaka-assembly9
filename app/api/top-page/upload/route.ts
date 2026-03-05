/**
 * directory: app/api/top-page/upload/route.ts
 * 役割: Cloudinaryへのアップロード + DB更新 + 古い画像の自動削除
 */
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

// Cloudinary設定（既存の環境変数をそのまま利用）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "top_page";

    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
    }

    // --- 1. DBから現在の画像URLを取得（削除用） ---
    const currentData = await client.execute("SELECT heroImg FROM topPage WHERE id = 1");
    const oldUrl = currentData.rows[0]?.heroImg as string;

    // --- 2. 古い画像の自動削除ロジック ---
    if (oldUrl && oldUrl.includes("cloudinary.com")) {
      try {
        // URLからPublic IDを抽出 (例: folder/filename)
        const parts = oldUrl.split('/');
        const fileNameWithExtension = parts.pop();
        const publicId = `${folder}/${fileNameWithExtension?.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log(`[Cloudinary] Deleted: ${publicId}`);
      } catch (delError) {
        console.error("Old image deletion failed:", delError);
        // 削除失敗してもアップロードは継続
      }
    }

    // --- 3. Cloudinaryへアップロード ---
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: folder, resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    }) as any;

    // --- 4. DBのURLを更新 ---
    await client.execute({
      sql: "UPDATE topPage SET heroImg = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 1",
      args: [uploadResult.secure_url]
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}