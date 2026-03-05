// directory: db/repository/ConsultationRepository.ts
import db from '../client';

/**
 * ConsultationRepository: 相談データの永続化と検索を担うリポジトリクラス
 * 課題8：データの自動削除（90日保持ルール）に対応
 */
export class ConsultationRepository {
  /**
   * 相談データをDBに新規保存する
   */
  static async create(data: {
    target_type: string;
    place_type: string;
    content_type: string;
    suggestion_topic: string;
    needs_reply: boolean;
    email?: string | null;
    message: string;
    encrypted_message: string;
    token_hash: string | null;
    ip_hash: string;
    user_agent: string;
    referer_url: string;
  }) {
    const query = `
      INSERT INTO consultations (
        target_type, 
        place_type, 
        content_type, 
        suggestion_topic, 
        needs_reply, 
        email, 
        message, 
        encrypted_message,
        token_hash,
        ip_hash, 
        user_agent, 
        referer_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await db.execute({
      sql: query,
      args: [
        data.target_type,
        data.place_type,
        data.content_type,
        data.suggestion_topic,
        data.needs_reply ? 1 : 0,
        data.email || null,
        data.message,
        data.encrypted_message,
        data.token_hash,
        data.ip_hash,
        data.user_agent,
        data.referer_url,
      ],
    });
  }

  /**
   * トークンハッシュによる相談データの検索（ユーザー認証用）
   */
  static async findByTokenHash(tokenHash: string) {
    const sql = `SELECT * FROM consultations WHERE token_hash = ? LIMIT 1`;
    const result = await db.execute({ sql, args: [tokenHash] });
    
    const row = result.rows[0] as any;
    if (!row) return null;

    return {
      id: row.id,
      target_type: row.target_type,
      place_type: row.place_type,
      content_type: row.content_type,
      suggestion_topic: row.suggestion_topic,
      needs_reply: Boolean(row.needs_reply),
      email: row.email,
      message: row.message,
      encrypted_message: row.encrypted_message,
      status: row.status || 'unread',
      created_at: row.created_at,
      token_hash: row.token_hash
    };
  }

  /**
   * 管理者用：全件取得
   */
  static async findAll() {
    const result = await db.execute("SELECT * FROM consultations ORDER BY created_at DESC");
    
    return result.rows.map((row: any) => ({
      id: row.id,
      target_type: row.target_type,
      place_type: row.place_type,
      content_type: row.content_type,
      suggestion_topic: row.suggestion_topic,
      needs_reply: Boolean(row.needs_reply),
      email: row.email,
      message: row.message,
      encrypted_message: row.encrypted_message,
      status: row.status || 'unread',
      admin_memo: row.admin_memo,
      created_at: row.created_at
    }));
  }

  /**
   * ステータスの更新
   */
  static async updateStatus(id: number, status: string) {
    const query = `UPDATE consultations SET status = ? WHERE id = ?`;
    return await db.execute({ sql: query, args: [status, id] });
  }

  /**
   * 管理者メモの更新
   */
  static async updateAdminMemo(id: number, memo: string) {
    const query = `UPDATE consultations SET admin_memo = ? WHERE id = ?`;
    return await db.execute({ sql: query, args: [memo, id] });
  }

  /**
   * 指定したIDの相談データを削除
   */
  static async delete(id: number) {
    const query = `DELETE FROM consultations WHERE id = ?`;
    return await db.execute({ sql: query, args: [id] });
  }

  /**
   * 【課題8】90日以上経過した相談データの自動クリーンアップ
   * * 論理的根拠：個人情報保護方針に基づき、一定期間を経過したデータを物理削除します。
   * * 補足：consultation_messages テーブルに ON DELETE CASCADE が設定されている前提で動作します。
   */
  static async cleanupOldConsultations(): Promise<number> {
    // SQLite/LibSQL の date 関数を利用して90日前の境界を計算
    // 現在時刻から '90 days' を引いた値より古いデータを対象とする
    const query = `
      DELETE FROM consultations 
      WHERE created_at < datetime('now', '-90 days')
    `;

    try {
      const result = await db.execute(query);
      // 削除された行数を返却
      return Number(result.rowsAffected);
    } catch (error) {
      console.error("[Cleanup Error] Failed to delete old records:", error);
      throw error;
    }
  }
}