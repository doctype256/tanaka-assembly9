// directory: app/admin/settings/recovery/page.tsx
"use client";

import React, { useState } from 'react';

/**
 * RecoveryCodeManagement: ログイン不能時のための復旧コード発行画面
 */
export default function RecoveryCodeManagement() {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!confirm('新しいコードを発行すると、以前のコードは無効になります。')) return;
    setLoading(true);
    try {
      const csrf = document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '';
      const res = await fetch('/api/auth/recovery-codes/generate', { 
        method: 'POST', 
        headers: { 'x-csrf-token': csrf } 
      });
      const data = await res.json();
      setCodes(data.codes);
    } catch (err) {
      alert('発行失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>⚠️ 復旧コードの管理</h1>
      <p style={descStyle}>デバイス紛失時に備え、予備のアクセス手段を確保します。</p>
      
      {!codes ? (
        <button onClick={handleGenerate} disabled={loading} style={primaryButtonStyle}>
          復旧コードを新規発行する
        </button>
      ) : (
        <div style={codeBoxStyle}>
          <h3 style={{ color: '#856404' }}>発行されたコード (保存してください)</h3>
          <div style={gridStyle}>
            {codes.map((c, i) => <code key={i} style={codeStyle}>{c}</code>)}
          </div>
          <button onClick={() => window.print()} style={printButtonStyle}>画面を印刷して保存</button>
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = { maxWidth: '500px', margin: '40px auto' };
const titleStyle: React.CSSProperties = { fontSize: '20px', fontWeight: 'bold' };
const descStyle: React.CSSProperties = { fontSize: '14px', color: '#666', marginBottom: '20px' };
const primaryButtonStyle: React.CSSProperties = { width: '100%', padding: '15px', backgroundColor: '#1a202c', color: 'white', borderRadius: '8px', cursor: 'pointer' };
const codeBoxStyle: React.CSSProperties = { backgroundColor: '#fffbe6', padding: '20px', borderRadius: '12px', border: '1px solid #ffe58f' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' };
const codeStyle: React.CSSProperties = { background: '#fff', padding: '5px', textAlign: 'center', border: '1px solid #ddd' };
const printButtonStyle: React.CSSProperties = { marginTop: '20px', width: '100%', padding: '10px', cursor: 'pointer' };