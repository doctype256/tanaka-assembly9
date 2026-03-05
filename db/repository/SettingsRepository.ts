// directory: db/repository/SettingsRepository.ts (新規作成する場合の例)

import { client } from "@/db/client";

export class SettingsRepository {
  /**
   * キーを指定して設定値を取得
   */
  static async get(key: string): Promise<string> {
    const result = await client.execute({
      sql: 'SELECT value FROM site_settings WHERE key = ?',
      args: [key]
    });
    return (result.rows[0]?.value as string) || '';
  }

  /**
   * 設定値を保存または更新
   */
  static async set(key: string, value: string): Promise<void> {
    await client.execute({
      sql: `
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (?, ?, datetime('now', 'localtime'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now', 'localtime')
      `,
      args: [key, value]
    });
  }
}