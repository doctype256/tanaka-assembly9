// directory: lib/crypto.ts

import crypto from 'crypto';

/**
 * SecureCrypto: 
 * セキュリティポリシー（AES-256-GCM）に基づき、
 * 暗号化・復号・ハッシュ化・トークン生成を行うクラス。
 */
export class SecureCrypto {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY;
    // 前回のステップで設定した 64文字のチェック
    if (!secret || secret.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes).');
    }
    this.key = Buffer.from(secret, 'hex');
  }

  /**
   * 照会URL用のランダムな生トークンを生成する
   * 32バイトの安全な乱数を16進数文字列にする
   */
  generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * トークンまたはIPアドレスをハッシュ化する (SHA-256)
   * 照会URLのトークンをDBに保存する際や、IPの匿名化に使用
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * 保存時暗号化: AES-256-GCM
   * 平文 -> IV:TAG:ENCRYPTED_DATA の形式で返す
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  /**
   * 復号: IV:TAG:ENCRYPTED_DATA -> 平文
   */
  decrypt(encryptedData: string): string {
    const [ivHex, tagHex, encryptedText] = encryptedData.split(':');
    
    if (!ivHex || !tagHex || !encryptedText) {
      throw new Error('Invalid encrypted data format.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}