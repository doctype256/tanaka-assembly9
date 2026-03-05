// app/api/cases/route.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import db from "@/db/client";


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  // ===== GET =====
  if (req.method === "GET") {
    try {
      let rows;

      if (typeof (db as any).execute === "function") {
        const result = await (db as any).execute(
          "SELECT * FROM cases ORDER BY created_at DESC"
        );
        rows = result.rows;
      } else {
        rows = (db as any)
          .prepare("SELECT * FROM cases ORDER BY created_at DESC")
          .all();
      }

      return res.status(200).json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ===== POST =====
  if (req.method === "POST") {
    try {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const { title } = body;

      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      if (typeof (db as any).execute === "function") {
        await (db as any).execute({
          sql: "INSERT INTO cases (title) VALUES (?)",
          args: [title],
        });
      } else {
        (db as any)
          .prepare("INSERT INTO cases (title) VALUES (?)")
          .run(title);
      }

      return res.status(201).json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
