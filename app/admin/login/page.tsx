// directory: app/admin/login/page.tsx

"use client";

import React, { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

/**
 * LoginPage: 議員専用ログイン画面 (パスキー認証専用)
 * 修正論理: 
 * 1. optionsJSON をそのまま startAuthentication に渡す一貫性の確保。
 * 2. CSRFトークン取得の堅牢化。
 * 3. エラーハンドリングの具体化。
 */
export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  /**
   * getCsrfToken: クッキーから論理的にCSRFトークンを抽出
   */
  const getCsrfToken = (): string => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  /**
   * handlePasskeyLogin: 
   * サーバーから取得した allowCredentials を含むオプションを用いて認証を開始
   */
  const handlePasskeyLogin = async () => {
    setStatus('loading');
    setMessage('生体認証（FaceID / 指紋）を待機中...');
    
    try {
      // 1. 認証オプションの取得
      // API側 (login-options) で allowCredentials がセットされていることが前提
      const optionsRes = await fetch('/api/auth/login-options', {
        cache: 'no-store' // キャッシュによる古いチャレンジの再利用を防止
      });
      
      if (!optionsRes.ok) throw new Error('認証オプションの取得に失敗しました。');
      const options = await optionsRes.json();

      // 2. ブラウザの生体認証呼び出し
      // startAuthentication は内部で Base64URL 文字列を Buffer に変換する責務を持つ
      const authResponse = await startAuthentication({ optionsJSON: options });

      // 3. サーバーでの検証リクエスト
      const verifyRes = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken() 
        },
        body: JSON.stringify({ 
          ...authResponse, 
          challenge: options.challenge // 検証のためにチャレンジを同期
        }),
      });

      const result = await verifyRes.json();
      
      if (verifyRes.ok && result.verified) {
        onAuthSuccess();
      } else {
        throw new Error(result.error || '認証に失敗しました。');
      }
    } catch (error: any) {
      onAuthError(error);
    }
  };

  const onAuthSuccess = () => {
    setStatus('success');
    setMessage('✅ 認証成功。管理画面へ移動します。');
    // セッションCookieがブラウザにセットされるのを待ってから遷移
    setTimeout(() => router.push('/admin/dashboard'), 800);
  };

  const onAuthError = (error: any) => {
    setStatus('error');
    if (error.name === 'NotAllowedError') {
      setMessage('❌ 認証がキャンセルされたか、タイムアウトしました。');
    } else if (error.name === 'SecurityError') {
      setMessage('❌ セキュリティエラー。HTTPS接続であることを確認してください。');
    } else {
      setMessage(`❌ ${error.message}`);
    }
    console.error("[AuthError]", error);
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '40px', color: '#1A202C' }}>
        🏛️ 議員専用ログイン
      </h1>

      <div style={sectionStyle}>
        <button
          onClick={handlePasskeyLogin}
          disabled={status === 'loading'}
          style={{ 
            ...primaryButtonStyle, 
            backgroundColor: status === 'success' ? '#28a745' : '#333',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.7 : 1
          }}
        >
          {status === 'loading' ? '認証中...' : '顔・指紋認証でログイン'}
        </button>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            onClick={() => router.push('/admin/recovery')} 
            style={textLinkStyle}
          >
            デバイスを紛失した（復旧コードを使用）
          </button>
          
          <hr style={{ width: '100%', border: '0', borderTop: '1px solid #E2E8F0' }} />
          
          <button 
            type="button" 
            onClick={() => router.push('/admin/settings/recovery')}
            style={{ ...textLinkStyle, color: '#e53e3e', fontSize: '12px' }}
          >
            復旧コードをまだ作成していない方
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          ...messageBoxStyle,
          backgroundColor: status === 'error' ? '#FFF5F5' : '#F0FFF4',
          color: status === 'error' ? '#C53030' : '#2F855A',
          border: `1px solid ${status === 'error' ? '#FEB2B2' : '#9AE6B4'}`,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

// スタイル定義（変更なし）
const containerStyle: React.CSSProperties = { padding: '80px 20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' };
const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const primaryButtonStyle: React.CSSProperties = { width: '100%', padding: '20px', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 'bold', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' };
const textLinkStyle: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', color: '#3182CE', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' };
const messageBoxStyle: React.CSSProperties = { marginTop: '30px', padding: '15px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.5' };