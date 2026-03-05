/**
 * directory: db/repository/TopPageRepository.ts
 */
import { Client } from "@libsql/client";

export interface TopPageData {
  heroImg: string;
  address: string;
  mapUrl: string;
  ytUrl: string;
  snsJson: string;
}

export class TopPageRepository {
  private db: Client;

  constructor(dbClient: Client) {
    this.db = dbClient;
  }

  async getSettings(): Promise<TopPageData | null> {
    const result = await this.db.execute("SELECT heroImg, address, mapUrl, ytUrl, snsJson FROM topPage WHERE id = 1 LIMIT 1");
    if (result.rows.length === 0) return null;
    return result.rows[0] as unknown as TopPageData;
  }

  async updateSettings(data: TopPageData): Promise<void> {
    // undefinedを空文字に変換する防御的処理
    const args = [
      data.heroImg || "",
      data.address || "",
      data.mapUrl  || "",
      data.ytUrl   || "",
      data.snsJson || "[]"
    ];

    const sql = `
      UPDATE topPage 
      SET heroImg = ?, address = ?, mapUrl = ?, ytUrl = ?, snsJson = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = 1
    `;
    
    await this.db.execute({ sql, args });
  }
}