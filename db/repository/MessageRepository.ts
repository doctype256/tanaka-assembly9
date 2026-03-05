// directory: db/repository/MessageRepository.ts

import { client } from '@/db/client';

export interface MessageCreateInput {
  consultation_id: number;
  sender_type: 'user' | 'admin'; // 議員と相談者を区別
  encrypted_body: string;
}

/**
 * MessageRepository: 対話メッセージ（相談履歴）の永続化を担当
 * 課題2・6のデータ操作をカプセル化します。
 */
export class MessageRepository {
  /**
   * メッセージを保存
   */
  static async create(input: MessageCreateInput) {
    const sql = `
      INSERT INTO consultation_messages (consultation_id, sender_type, encrypted_body)
      VALUES (?, ?, ?)
    `;
    return await client.execute({
      sql,
      args: [input.consultation_id, input.sender_type, input.encrypted_body]
    });
  }

  /**
   * 指定した相談の全メッセージ履歴を取得
   */
  static async findByConsultationId(consultationId: number) {
    const sql = `
      SELECT sender_type, encrypted_body, created_at 
      FROM consultation_messages 
      WHERE consultation_id = ? 
      ORDER BY created_at ASC
    `;
    const result = await client.execute({ sql, args: [consultationId] });
    return result.rows;
  }
}