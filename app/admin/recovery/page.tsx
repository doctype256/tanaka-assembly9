// directory: app/admin/recovery/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * RecoveryLoginPage: 復旧コード専用のログインページ
 * パスキー認証が利用できない場合の緊急避難経路です。
 */
export default function RecoveryLoginPage() {
  const [recoveryCode, setRecoveryCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // CSRFトークンの取得論理
  const getCsrfToken = () => {
    if (typeof document === 'undefined') return '';
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode) return;

    setStatus('loading');
    setMessage('コードを検証中...');

    try {
      const res = await fetch('/api/auth/recovery-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ code: recoveryCode.trim() }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatus('success');
        setMessage('✅ 認証に成功しました。ダッシュボードへ移動します。');
        // 1秒後にリダイレクト
        setTimeout(() => router.push('/admin/dashboard'), 1000);
      } else {
        throw new Error(result.error || '復旧コードが無効です。');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🔐 復旧ログイン</h1>
      <p style={descStyle}>保存した 8 桁の復旧コード（例: A3A5-DC25）を入力してください。</p>
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          placeholder="XXXX-XXXX"
          value={recoveryCode}
          onChange={(e) => setRecoveryCode(e.target.value)}
          style={inputStyle}
          disabled={status === 'loading'}
          autoFocus
        />
        <button 
          type="submit" 
          disabled={status === 'loading' || !recoveryCode} 
          style={status === 'loading' ? { ...buttonStyle, opacity: 0.6 } : buttonStyle}
        >
          {status === 'loading' ? '検証中...' : 'ログイン'}
        </button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => router.push('/admin/login')} style={linkButtonStyle}>
          ← パスキー（生体認証）に戻る
        </button>
      </div>

      {message && (
        <div style={{
          ...messageStyle,
          backgroundColor: status === 'error' ? '#fff1f0' : '#f6ffed',
          color: status === 'error' ? '#cf1322' : '#389e0d',
          border: `1px solid ${status === 'error' ? '#ffa39e' : '#b7eb8f'}`,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

// デザイン定義
const containerStyle: React.CSSProperties = { padding: '80px 20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center', fontFamily: 'system-ui' };
const titleStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' };
const descStyle: React.CSSProperties = { fontSize: '14px', color: '#666', marginBottom: '30px' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle: React.CSSProperties = { padding: '15px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '18px', textAlign: 'center', letterSpacing: '2px' };
const buttonStyle: React.CSSProperties = { padding: '15px', backgroundColor: '#1a202c', color: 'white', borderRadius: '10px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
const linkButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#0070f3', fontSize: '14px', cursor: 'pointer' };
const messageStyle: React.CSSProperties = { marginTop: '30px', padding: '15px', borderRadius: '10px', fontSize: '14px' };