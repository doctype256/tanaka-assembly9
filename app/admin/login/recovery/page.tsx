// directory: app/admin/setup-auth/page.tsx (または復旧コード発行画面)
"use client";

import React, { useState } from 'react';

/**
 * RecoveryCodeSection: 復旧コードの管理コンポーネント
 * セキュリティ上の信頼境界（CSRF対策）を維持しつつ発行処理を行います。
 */
export default function RecoveryCodeSection() {
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * getCsrfToken: CookieからCSRFトークンを抽出
   */
  const getCsrfToken = (): string => {
    if (typeof document === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1] || '';
  };

  /**
   * generateCodes: 復旧コードの生成をリクエスト
   */
  const generateCodes = async () => {
    if (!confirm('新しい復旧コードを生成しますか？既存のコードは無効になります。')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/recovery-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 【論理的必須】ミドルウェアの検証を通過させるためのヘッダー
          'x-csrf-token': getCsrfToken()
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'コードの生成に失敗しました。');
      }

      setCodes(result.codes);
      alert('復旧コードを正常に生成しました。必ず保存してください。');
      
    } catch (error: any) {
      console.error("Recovery code error:", error);
      alert(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>復旧コードの管理</h2>
      <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px' }}>
        パスキーを紛失した場合に、アカウントを復旧するための使い捨てコードです。
      </p>

      <button
        onClick={generateCodes}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2D3748',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '生成中...' : '新しいコードを生成する'}
      </button>

      {codes.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F7FAFC', borderRadius: '6px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>生成されたコード（再表示されません）:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {codes.map((code, index) => (
              <code key={index} style={{ padding: '5px', background: '#fff', border: '1px solid #CBD5E0', textAlign: 'center' }}>
                {code}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}