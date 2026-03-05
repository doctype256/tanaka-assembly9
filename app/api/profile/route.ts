import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import db from "@/db/client";

// ✅ セッションデータの型定義
interface SessionData {
  isAdmin?: boolean;
}

// =========================================================
// GET : 最新プロフィール取得（認証なし or 管理者判定付き）
// =========================================================
export async function GET(request: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getIronSession<SessionData>(request, res, sessionOptions);

    let profile: any;

    if (typeof (db as any).execute === "function") {
      // Turso (Cloud)
      const result = await (db as any).execute({
        sql: "SELECT Name, IMG_URL, birthday, \"From\", Family, Job, hobby FROM profile ORDER BY id DESC LIMIT 1",
      });
      profile = result.results?.[0] || result.rows?.[0];
    } else {
      // SQLite (Local)
      profile = (db as any)
        .prepare("SELECT Name, IMG_URL, birthday, \"From\", Family, Job, hobby FROM profile ORDER BY id DESC LIMIT 1")
        .get();
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error("[Profile GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// =========================================================
// POST : プロフィール保存（管理者のみ）
// =========================================================
export async function POST(request: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getIronSession<SessionData>(request, res, sessionOptions);

    if (!session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      Name,
      IMG_URL,
      birthday = null,
      From = null,
      Family = null,
      Job = null,
      hobby = null,
    } = body;

    if (!Name || !IMG_URL) {
      return NextResponse.json(
        { error: "Name and IMG_URL are required" },
        { status: 400 }
      );
    }

    if (typeof (db as any).execute === "function") {
      // Turso
      await (db as any).execute({
        sql: `
          INSERT INTO profile 
          (Name, IMG_URL, birthday, "From", Family, Job, hobby) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [Name, IMG_URL, birthday, From, Family, Job, hobby],
      });
    } else {
      // SQLite
      (db as any)
        .prepare(`
          INSERT INTO profile 
          (Name, IMG_URL, birthday, "From", Family, Job, hobby) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run(Name, IMG_URL, birthday, From, Family, Job, hobby);
    }

    return NextResponse.json({ success: true, message: "Profile saved" });
  } catch (err: any) {
    console.error("[Profile POST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
