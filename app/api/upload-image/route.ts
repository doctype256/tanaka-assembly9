import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

interface SessionData {
  isAdmin?: boolean;
}

// Cloudinary 設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const setCorsHeaders = (res: NextResponse) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
};

// OPTIONS
export async function OPTIONS() {
  const res = NextResponse.json({});
  setCorsHeaders(res);
  return res;
}

// POST
export async function POST(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);


    console.log("Changed code");
    // :fire: 管理者チェック（/api/profile と同じ）
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const filename = formData.get("filename");
    const folder = formData.get("folder") || "uploads";

    if (!file || !filename) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    // File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cloudinary upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          public_id: filename.toString().split(".")[0],
          folder: folder.toString(),
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });

    const json = NextResponse.json({
      success: true,
      url: (uploadResult as any).secure_url,
      public_id: (uploadResult as any).public_id,
      filename,
      uploaded_at: new Date().toISOString(),
    });

    setCorsHeaders(json);
    return json;

  } catch (error) {
    console.error("Upload error:", error);

    const res = NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );

    setCorsHeaders(res);
    return res;
  }
}
