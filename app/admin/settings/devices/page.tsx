// directory: app/admin/settings/devices/page.tsx

"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

interface Authenticator {
  id: string;
  created_at: string;
}

/**
 * DeviceManagement: WebAuthn認証デバイスの管理画面
 * 修正論理:
 * 1. 日時表示の 9時間ズレを修正（UTCを明示的にJSTへ変換）。
 * 2. 登録・削除時のユーザーフィードバックの日本語最適化。
 * 3. CSRFトークン抽出の堅牢化。
 */
export default function DeviceManagement() {
  const [authenticators, setAuthenticators] = useState<Authenticator[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  /**
   * getCsrfToken: クッキーから論理的にCSRFトークンを抽出
   */
  const getCsrfToken = () => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  /**
   * formatToJST: 
   * DBのUTC時刻を厳密に日本標準時 (JST) に変換する責務をカプセル化
   */
  const formatToJST = (dateString: string) => {
    try {
      // 1. 文字列を ISO 8601 形式 (YYYY-MM-DDTHH:mm:ssZ) に正規化
      // スペースを T に置換し、末尾に Z がなければ付与して UTC であることを明示する
      const normalized = dateString.replace(' ', 'T');
      const utcString = normalized.endsWith('Z') ? normalized : `${normalized}Z`;
      
      const date = new Date(utcString);

      // 2. タイムゾーンを Asia/Tokyo に固定してフォーマット
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit', // 監査ログとしての精度確保
        timeZone: 'Asia/Tokyo',
        hour12: false
      }).format(date);
    } catch (e) {
      console.error("時刻変換エラー:", e);
      return dateString; // 失敗時は元の文字列を表示
    }
  };

  const fetchAuthenticators = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/authenticators', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAuthenticators(data);
      }
    } catch (err) {
      console.error("認証器の取得に失敗しました", err);
    }
  }, []);

  useEffect(() => { 
    fetchAuthenticators(); 
  }, [fetchAuthenticators]);

  /**
   * handleRegister: 新しいデバイス（パスキー）の登録実行
   */
  const handleRegister = async () => {
    setLoading(true);
    setMessage('デバイスの生体認証（顔・指紋など）を待機中...');
    
    try {
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
        setMessage('✅ デバイスの登録に成功しました。');
        await fetchAuthenticators();
      } else {
        throw new Error(result.error || '登録検証に失敗しました。');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setMessage('❌ 登録がキャンセルされました。');
      } else {
        setMessage(`❌ エラー: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleDelete: デバイスの登録解除
   */
  const handleDelete = async (id: string) => {
    if (!confirm('このデバイスを削除しますか？\n削除するとこのデバイスでのログインができなくなります。')) return;
    
    try {
      const res = await fetch(`/api/auth/authenticators/${id}`, { 
        method: 'DELETE', 
        headers: { 'x-csrf-token': getCsrfToken() } 
      });
      
      if (res.ok) {
        setMessage('🗑️ デバイスを削除しました。');
        await fetchAuthenticators();
      } else {
        throw new Error('削除に失敗しました。');
      }
    } catch (err: any) {
      setMessage(`❌ 削除エラー: ${err.message}`);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🔐 認証デバイス管理</h1>
      
      <p style={descriptionStyle}>
        ログインに使用する指紋や顔認証（パスキー）を管理します。
      </p>

      <button 
        onClick={handleRegister} 
        disabled={loading} 
        style={{
          ...primaryButtonStyle,
          backgroundColor: loading ? '#A0AEC0' : '#0070f3'
        }}
      >
        {loading ? '処理中...' : '＋ 新しい認証デバイスを追加'}
      </button>

      <div style={listAreaStyle}>
        <h2 style={subTitleStyle}>登録済みデバイス ({authenticators.length})</h2>
        {authenticators.length === 0 ? (
          <p style={emptyTextStyle}>登録されているデバイスはありません。</p>
        ) : (
          authenticators.map(auth => (
            <div key={auth.id} style={itemStyle}>
              <div style={infoAreaStyle}>
                <span style={dateStyle}>{formatToJST(auth.created_at)}</span>
                <span style={deviceLabelStyle}>登録済みパスキー（ID: {auth.id.substring(0, 8)}）</span>
              </div>
              <button 
                onClick={() => handleDelete(auth.id)} 
                style={deleteButtonStyle}
              >
                削除
              </button>
            </div>
          ))
        )}
      </div>

      {message && (
        <div style={{
          ...messageStyle,
          backgroundColor: message.includes('✅') ? '#F0FFF4' : '#FFF5F5',
          color: message.includes('✅') ? '#2F855A' : '#C53030',
          border: `1px solid ${message.includes('✅') ? '#9AE6B4' : '#FEB2B2'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

// スタイル定義
const containerStyle: React.CSSProperties = { maxWidth: '600px', margin: '60px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' };
const titleStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' };
const descriptionStyle: React.CSSProperties = { fontSize: '14px', color: '#718096', marginBottom: '30px', textAlign: 'center' };
const listAreaStyle: React.CSSProperties = { marginTop: '40px', textAlign: 'left' };
const subTitleStyle: React.CSSProperties = { fontSize: '16px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px', color: '#2D3748', fontWeight: 'bold' };
const primaryButtonStyle: React.CSSProperties = { width: '100%', padding: '16px', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'background-color 0.2s' };
const itemStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #EDF2F7' };
const infoAreaStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const dateStyle: React.CSSProperties = { fontSize: '15px', color: '#2D3748', fontWeight: '500' };
const deviceLabelStyle: React.CSSProperties = { fontSize: '12px', color: '#A0AEC0' };
const deleteButtonStyle: React.CSSProperties = { color: '#E53E3E', border: '1px solid #FED7D7', backgroundColor: '#FFF5F5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };
const emptyTextStyle: React.CSSProperties = { textAlign: 'center', color: '#A0AEC0', marginTop: '20px', fontSize: '14px' };
const messageStyle: React.CSSProperties = { marginTop: '30px', padding: '15px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' };