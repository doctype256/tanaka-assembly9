// directory: lib/prisma.ts
import { PrismaClient } from '.prisma/client';
// 注意：v7ではインポート元は同じですが、初期化の引数が必須になる場合があります
// もし標準的な接続を行う場合は、以下のように記述します

/**
 * Prisma v7 対応のシングルトン管理
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(); 
  // v7では、接続URLは schema.prisma ではなく prisma.config.ts から読み込まれます

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;