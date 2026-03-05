"use client";

import React, { useState, useEffect } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false); // 生体認証対応判定
  const router = useRouter();

  // クライアントで端末に生体認証があるかチェック
  useEffect(() => {
    (async () => {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBiometricAvailable(available);
    })();
  }, []);

  // 管理画面と同じCSRF取得ロジック
  const getCsrfToken = () => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  const handleAuthAction = async () => {
    if (!biometricAvailable) {
      setStatus('error');
      setMessage('❌ この端末では生体認証が利用できません。対応端末でお試しください。');
      return;
    }

    setStatus('loading');
    setMessage('ステータスを確認中...');

    try {
      // 1. 登録状況の確認
      const checkRes = await fetch('/api/auth/check', { cache: 'no-store' });
      const { isEnrolled } = await checkRes.json();

      if (!isEnrolled) {
        // --- 【新規登録フロー】 ---
        setMessage('初回デバイス登録を開始します...');
        const optionsRes = await fetch('/api/auth/register-options');
        const options = await optionsRes.json();

        const regResponse = await startRegistration({ optionsJSON: options });

        const verifyRes = await fetch('/api/auth/register-verify', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'x-csrf-token': getCsrfToken() 
          },
          body: JSON.stringify({ ...regResponse, challenge: options.challenge }),
        });

        const result = await verifyRes.json();
        if (verifyRes.ok && result.verified) {
          onAuthSuccess();
        } else {
          throw new Error(result.error || '登録検証に失敗しました。');
        }

      } else {
        // --- 【既存ログインフロー】 ---
        setMessage('生体認証（FaceID / 指紋）を待機中...');
        const optionsRes = await fetch('/api/auth/login-options', { cache: 'no-store' });
        const options = await optionsRes.json();

        const authResponse = await startAuthentication({ optionsJSON: options });

        const verifyRes = await fetch('/api/auth/login-verify', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'x-csrf-token': getCsrfToken() 
          },
          body: JSON.stringify({ ...authResponse, challenge: options.challenge }),
        });

        const result = await verifyRes.json();
        if (verifyRes.ok && result.verified) {
          onAuthSuccess();
        } else {
          throw new Error(result.error || '認証に失敗しました。');
        }
      }
    } catch (error: any) {
      onAuthError(error);
    }
  };

  const onAuthSuccess = () => {
    setStatus('success');
    setMessage('✅ 認証成功。管理画面へ移動します。');
    setTimeout(() => router.push('/admin/dashboard'), 800);
  };

  const onAuthError = (error: any) => {
    setStatus('error');
    if (error.name === 'NotAllowedError') {
      setMessage('❌ 認証がキャンセルされました。');
    } else {
      setMessage(`❌ ${error.message}`);
    }
    console.error("[AuthError]", error);
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🏛️ 議員専用ログイン</h1>
      <div style={sectionStyle}>
        <button
          onClick={handleAuthAction}
          disabled={status === 'loading' || !biometricAvailable}
          style={{ 
            ...primaryButtonStyle, 
            backgroundColor: status === 'success' ? '#28a745' : '#333',
            cursor: status === 'loading' || !biometricAvailable ? 'not-allowed' : 'pointer'
          }}
        >
          {status === 'loading' 
            ? '処理中...' 
            : (biometricAvailable ? '生体認証を開始' : 'この端末では登録不可')}
        </button>
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

// スタイル
const containerStyle: React.CSSProperties = { padding: '80px 20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' };
const titleStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 'bold', marginBottom: '40px' };
const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const primaryButtonStyle: React.CSSProperties = { width: '100%', padding: '20px', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 'bold' };
const messageBoxStyle: React.CSSProperties = { marginTop: '30px', padding: '15px', borderRadius: '12px', fontSize: '14px' };