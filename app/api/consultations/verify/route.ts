// directory: app/api/consultations/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ConsultationRepository } from '@/db/repository/ConsultationRepository';
import { AuditLogRepository } from '@/db/repository/AuditLogRepository';
import { SecureCrypto } from '@/lib/crypto';

/**
 * GET: トークンの検証と詳細データの返却
 * 論理修正: TypeScriptの型不整合 (ts2367) を解消し、
 * Repositoryから返される型に合わせたマッピングを行います。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');
  const crypto = new SecureCrypto();

  const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
  const ipHash = crypto.hashToken(ip);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  try {
    const tokenHash = crypto.hashToken(token);
    // Repository層で型が定義されていることを想定
    const consultation = await ConsultationRepository.findByTokenHash(tokenHash);

    if (!consultation) {
      await AuditLogRepository.create({
        consultation_id: null,
        action_type: 'AUTH_ERROR',
        status: 'FAILURE',
        error_code: 'INVALID_TOKEN',
        ip_hash: ipHash,
        user_agent: userAgent
      });
      return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
    }

    // ログ記録
    await AuditLogRepository.create({
      consultation_id: Number(consultation.id),
      action_type: 'ACCESS',
      status: 'SUCCESS',
      ip_hash: ipHash,
      user_agent: userAgent
    });

    /**
     * 論理的修正: 
     * consultation.needs_reply が boolean 型として定義されている場合、
     * 直接その値を渡すか、!! で boolean であることを保証します。
     * (consultation.needs_reply === 1) という比較は、型が異なるためTSエラーになります。
     */
    return NextResponse.json({
      success: true,
      data: {
        id: consultation.id,
        target_type: consultation.target_type,
        place_type: consultation.place_type,
        content_type: consultation.content_type,
        suggestion_topic: consultation.suggestion_topic,
        needs_reply: !!consultation.needs_reply, // booleanとして評価
        status: consultation.status,
        created_at: consultation.created_at
      }
    });

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}