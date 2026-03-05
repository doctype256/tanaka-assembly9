// directory: lib/services/CleanupService.ts
import { prisma } from '@/lib/prisma';

/**
 * CleanupService: データのライフサイクル管理を担当するクラス
 */
export class CleanupService {
  // 保持期間の定数化（ポリシーに基づき設定）
  private static readonly LOG_RETENTION_DAYS = 90;
  private static readonly CONSULTATION_RETENTION_DAYS = 180;

  /**
   * 期限切れデータを一括削除する
   */
  static async execute() {
    const now = new Date();
    const logLimit = new Date(now.getTime() - this.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const consultationLimit = new Date(now.getTime() - this.CONSULTATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // トランザクションで実行し、整合性を保つ
    return await prisma.$transaction(async (tx) => {
      const deletedLogs = await tx.auditLog.deleteMany({
        where: { created_at: { lt: logLimit } }
      });

      const deletedConsultations = await tx.consultation.deleteMany({
        where: { created_at: { lt: consultationLimit } }
      });

      // 実施記録の作成
      await tx.auditLog.create({
        data: {
          action_type: 'CRON_CLEANUP',
          status: 'SUCCESS',
          ip_hash: 'SYSTEM_INTERNAL', // 内部処理であることを明示
          details: `Log: ${deletedLogs.count}, Consultation: ${deletedConsultations.count}`
        }
      });

      return {
        logs: deletedLogs.count,
        consultations: deletedConsultations.count
      };
    });
  }
}