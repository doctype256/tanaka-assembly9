// directory: db/repository/AuditLogRepository.ts

import { client } from "@/db/client";

/**
 * AuditLogEntry: 監査ログの型定義
 * 取得時（findAll）には DB側で自動生成される id や created_at が含まれます。
 */
export interface AuditLogEntry {
  id?: number;              // 自動採番される一意識別子
  consultation_id: number | null; // 関連する相談ID（認証失敗時や攻撃遮断時はnull）
  action_type: string;      // 操作種別（例: 'POST', 'GET', 'CHAT_ADMIN'）
  
  /**
   * status: 操作の結果およびセキュリティイベントの分類
   * SUCCESS: 正常終了
   * FAILURE: 失敗（不正アクセス試行等）
   * SPAM_REJECTED: 課題5に基づくスパムフィルタリング
   * CRON_CLEANUP: 課題8に基づくデータ自動削除の実行記録
   * XSS_BLOCKED: XSS攻撃検知によるリクエスト拒絶 (新規追加)
   */
  status: "SUCCESS" | "FAILURE" | "SPAM_REJECTED" | "CRON_CLEANUP" | "XSS_BLOCKED";
  
  error_code?: string;      // 失敗時の詳細コード
  ip_hash: string;          // 課題7: 個人特定を避けるためにハッシュ化された識別子
  user_agent: string;       // アクセス元のブラウザ情報
  created_at?: string;      // 記録日時
}

/**
 * AuditLogRepository: 監査ログ管理クラス
 * * 【セキュリティ設計の論理的根拠】
 * 1. 真正性の担保 (課題2: AppendOnly): 
 * データの更新 (UPDATE) および個別削除 (DELETE) メソッドを実装しません。
 * 一度記録された事実は変更不可能であることを、クラスの構造自体で保証します。
 * 2. ログの最小化 (課題7): 
 * 相談本文や個人を特定できる情報は引数に含めず、証跡としてのメタデータのみを扱います。
 * 3. データのライフサイクル (課題8):
 * 取得を直近500件に制限し、古いデータは自動削除バッチによって物理削除される運用を前提とします。
 */
export class AuditLogRepository {
  /**
   * 監査ログの新規記録（追記専用）
   * * @param entry 記録する監査ログのエントリ
   * @returns データベースの実行結果
   */
  static async create(entry: AuditLogEntry) {
    // 常に新しいレコードを末尾に追加する INSERT 命令のみを使用。
    // XSS_BLOCKED 等の新しいステータスも、型定義に従い安全に保存されます。
    const sql = `
      INSERT INTO audit_logs (consultation_id, action_type, status, error_code, ip_hash, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    return await client.execute({
      sql,
      args: [
        entry.consultation_id,
        entry.action_type,
        entry.status,
        entry.error_code ?? null,
        entry.ip_hash,
        entry.user_agent
      ]
    });
  }

  /**
   * 全監査ログの取得（参照専用）
   * 議員本人が管理画面からアクセス状況を監視し、透明性を確保するために提供されます。
   * * @returns 監査ログエントリの配列
   */
  static async findAll(): Promise<AuditLogEntry[]> {
    // 課題8を考慮し、最新のログから最大500件を取得。
    // これにより、大量のログによるメモリ圧迫とパフォーマンス低下を論理的に回避します。
    const sql = `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500`;
    const result = await client.execute(sql);
    
    // Row データを型定義されたオブジェクトにマッピング。
    // status は DB から文字列として返るため、AuditLogEntry.status 型としてキャストします。
    return result.rows.map((row: any) => ({
      id: row.id,
      consultation_id: row.consultation_id,
      action_type: row.action_type,
      status: row.status as AuditLogEntry["status"],
      error_code: row.error_code,
      ip_hash: row.ip_hash,
      user_agent: row.user_agent,
      created_at: row.created_at
    }));
  }

  /**
   * 【不変性の維持】
   * 課題2に基づき、既存ログの修正 (update) や個別削除 (delete) のための
   * ロジックの実装は、本システムの信頼境界を維持するために固く禁じられています。
   * 操作は常に「追記」か「システムによる一括削除」のいずれかのみとなります。
   */
}