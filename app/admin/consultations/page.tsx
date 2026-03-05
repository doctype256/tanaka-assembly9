// directory: app/admin/consultations/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/**
 * 型定義 (Consultationオブジェクト)
 */
type Consultation = {
  id: number;
  target_type: string;
  place_type: string;
  content_type: string;
  suggestion_topic: string;
  needs_reply: number;
  email: string;
  message: string;
  status: 'unread' | 'processing' | 'completed';
  admin_memo: string | null;
  created_at: string;
};

/**
 * AdminConsultationPage
 * 管理者向けの問い合わせ管理コンポーネント。
 */
export default function AdminConsultationPage() {
  // --- 状態管理 (State) ---
  const [data, setData] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Consultation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);

 // directory: app/admin/consultations/page.tsx

  /**
   * getCsrfToken: 
   * ブラウザのCookieからCSRFトークンを取得する。
   * Double Submit Cookieパターンにおいて、信頼境界を越えるための必須処理。
   */
  const getCsrfToken = useCallback((): string => {
    if (typeof document === 'undefined') return '';
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('csrf_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : '';
  }, []);

  /**
   * fetchConsultations: 問い合わせデータの取得
   */
  const fetchConsultations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/consultations');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * fetchAdminSettings: 管理者設定の取得
   */
  const fetchAdminSettings = useCallback(async () => {
    const keys = ['admin_notification_email', 'smtp_user', 'smtp_pass'];
    try {
      for (const key of keys) {
        const res = await fetch(`/api/admin/settings?key=${key}`);
        if (res.ok) {
          const json = await res.json();
          if (key === 'admin_notification_email') setAdminEmail(json.value || '');
          if (key === 'smtp_user') setSmtpUser(json.value || '');
          if (key === 'smtp_pass') setSmtpPass(json.value || '');
        }
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // 初回データフェッチの実行
    fetchConsultations();
    fetchAdminSettings();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [fetchConsultations, fetchAdminSettings]);

  /**
   * handleSaveSettings: 管理者設定の保存処理 (POST)
   * CSRFトークンをヘッダーに付与して検証を通過させる。
   */
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const settings = [
      { key: 'admin_notification_email', value: adminEmail },
      { key: 'smtp_user', value: smtpUser },
      { key: 'smtp_pass', value: smtpPass },
    ];

    try {
      const token = getCsrfToken();
      for (const setting of settings) {
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': token 
          },
          body: JSON.stringify(setting),
        });
      }
      alert("設定を保存しました。");
    } catch (error) {
      console.error("Save settings error:", error);
      alert("設定の保存に失敗しました。");
    } finally {
      setIsSavingSettings(false);
    }
  };

  /**
   * handleStatusChange: ステータス更新処理 (PATCH)
   */
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/consultations', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus as any } : item));
        if (selectedItem?.id === id) setSelectedItem(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  /**
   * handleSaveMemo: 管理者メモの保存処理 (PATCH)
   */
  const handleSaveMemo = async (id: number, memo: string) => {
    try {
      await fetch('/api/admin/consultations', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ id, admin_memo: memo }),
      });
      setData(prev => prev.map(item => item.id === id ? { ...item, admin_memo: memo } : item));
      if (selectedItem?.id === id) setSelectedItem(prev => prev ? { ...prev, admin_memo: memo } : null);
    } catch (error) {
      console.error("Memo save error:", error);
    }
  };

  /**
   * deleteConsultations: 削除処理 (DELETE)
   * 複数のIDをカンマ区切りで送信し、論理的ガードを通過して削除を実行する。
   */
  const deleteConsultations = async (ids: number[]) => {
    if (!confirm(`${ids.length}件削除しますか？`)) return;
    try {
      const res = await fetch(`/api/admin/consultations?id=${ids.join(',')}`, { 
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken() // CSRF検証通過のために必須
        }
      });
      
      if (res.ok) {
        setData(prev => prev.filter(item => !ids.includes(item.id)));
        setSelectedIds([]);
        if (selectedItem && ids.includes(selectedItem.id)) setSelectedItem(null);
      } else {
        const err = await res.json();
        alert(`削除に失敗しました: ${err.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("削除処理中にエラーが発生しました。");
    }
  };
  /**
   * フィルタリングロジック
   */
  const filteredData = data.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.admin_memo || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'unread': return '#fff5f5';
      case 'processing': return '#fffbea';
      case 'completed': return '#f0fff4';
      default: return '#ffffff';
    }
  };

  const getStatusTagColor = (status: string) => {
    switch (status) {
      case 'unread': return '#feb2b2';
      case 'processing': return '#f6e05e';
      case 'completed': return '#9ae6b4';
      default: return '#e2e8f0';
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;

  return (
    <div style={{ padding: isMobile ? '10px' : '20px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'sans-serif', color: '#2d3748' }}>
      {/* ヘッダーセクション */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2d3748', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px' }}>管理者ダッシュボード</h1>
        {selectedIds.length > 0 && (
          <button onClick={() => deleteConsultations(selectedIds)} style={bulkDeleteButtonStyle}>選択 {selectedIds.length} 件を削除</button>
        )}
      </div>

      {/* メール設定パネル（保存ボタンを復元） */}
      <div style={settingsPanelStyle}>
        <div onClick={() => setIsSettingsOpen(!isSettingsOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', margin: 0 }}>📧 メール通知・送信設定</h2>
          <span>{isSettingsOpen ? '▲' : '▼'}</span>
        </div>
        {isSettingsOpen && (
          <div style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px' }}>
              <div><label style={labelStyle}>通知先</label><input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>送信元Gmail</label><input type="email" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} style={inputStyle} /></div>
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}><label style={labelStyle}>アプリパスワード</label><input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                style={saveSettingsButtonStyle}
              >
                {isSavingSettings ? '保存中...' : '設定を保存する'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* フィルタ・検索セクション */}
      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['all', 'unread', 'processing', 'completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', cursor: 'pointer', backgroundColor: filterStatus === s ? '#2d3748' : 'white', color: filterStatus === s ? 'white' : '#2d3748' }}>
              {s === 'all' ? 'すべて' : s === 'unread' ? '未読' : s === 'processing' ? '対応中' : '完了'}
            </button>
          ))}
        </div>
        <input type="text" placeholder="検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
      </div>

      {/* データリスト（テーブル表示） */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredData.map(item => (
            <div key={item.id} style={{ ...mobileCardStyle, backgroundColor: getStatusBgColor(item.status) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} style={{ ...selectStyle, backgroundColor: getStatusTagColor(item.status) }}>
                  <option value="unread">未読</option><option value="processing">対応中</option><option value="completed">完了</option>
                </select>
                <Link href={`/admin/chat/${item.id}`} style={chatButtonStyle}>対話を開く</Link>
              </div>
              <div onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                <div style={themeTextStyle}>{item.suggestion_topic}</div>
                <div style={{ ...messagePreviewStyle, wordBreak: 'break-all' }}>
                  {typeof item.message === 'string' ? item.message : String(item.message)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ backgroundColor: '#2d3748', color: 'white' }}>
              <th style={{ ...thStyle, width: '60px', textAlign: 'center', verticalAlign: 'middle' }}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  onChange={() => setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i => i.id))}
                  checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                />
              </th>
              <th style={{ ...thStyle, width: '90px' }}>ステータス</th>
              <th style={{ ...thStyle, width: '400px' }}>相談カテゴリ</th>
              <th style={thStyle}>内容の詳細 (クリックで開く)</th>
              <th style={{ ...thStyle, width: '250px' }}>管理者メモ / 操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7', backgroundColor: getStatusBgColor(item.status) }}>
                <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                  <input
                    type="checkbox"
                    style={checkboxStyle}
                    checked={selectedIds.includes(item.id)}
                    onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                  />
                </td>
                <td style={tdStyle}>
                  <div style={tripleStackStyle}>
                    <div style={{ fontSize: '11px', textAlign: 'center' }}><strong>{new Date(item.created_at).toLocaleDateString()}</strong></div>
                    <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} style={{ ...selectStyle, backgroundColor: getStatusTagColor(item.status) }}>
                      <option value="unread">未読</option><option value="processing">対応中</option><option value="completed">完了</option>
                    </select>
                    <button onClick={() => deleteConsultations([item.id])} style={deleteButtonStyle}>削除</button>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={structContainerStyle}>
                    <div style={dataValueStyle}>{item.target_type}</div>
                    <div style={dataValueStyle}>{item.content_type}</div>
                    <div style={dataValueStyle}>{item.place_type}</div>
                    <div style={{ ...dataValueStyle, fontWeight: 'bold', color: item.needs_reply ? '#e53e3e' : '#718096' }}>返信希望: {item.needs_reply ? 'あり' : '不要'}</div>
                  </div>
                </td>
                <td style={{ ...tdStyle, cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                  <div style={themeTextStyle}>{item.suggestion_topic}</div>
                  <div style={{ ...messagePreviewStyle, wordBreak: 'break-all' }}>
                    {/* プレビューでは pre-wrap を外し、確実に文字列として扱う */}
                    {String(item.message)}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      defaultValue={item.admin_memo || ''}
                      onBlur={(e) => handleSaveMemo(item.id, e.target.value)}
                      style={memoAreaSmallStyle}
                      placeholder="メモを入力..."
                    />
                    <Link href={`/admin/chat/${item.id}`} style={chatButtonStyle}>
                      💬 相談者と対話する
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 詳細モーダル */}
      {selectedItem && (
        <div style={modalOverlayStyle} onClick={() => setSelectedItem(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '1100px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>相談内容の詳細</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link href={`/admin/chat/${selectedItem.id}`} style={{ ...chatButtonStyle, padding: '8px 20px' }}>対話画面へ</Link>
                <select value={selectedItem.status} onChange={(e) => handleStatusChange(selectedItem.id, e.target.value)} style={{ ...selectStyle, backgroundColor: getStatusTagColor(selectedItem.status), padding: '8px 15px', fontSize: '14px' }}>
                  <option value="unread">未読</option><option value="processing">対応中</option><option value="completed">完了</option>
                </select>
                <button onClick={() => setSelectedItem(null)} style={closeButtonStyle}>&times;</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '30px', marginTop: '25px' }}>
              <div style={{ flex: 1, backgroundColor: '#f7fafc', padding: '25px', borderRadius: '15px' }}>
                <h3 style={modalSubTitle}>属性データ</h3>
                <div style={modalInfoItem}><strong>テーマ:</strong> {selectedItem.suggestion_topic}</div>
                <div style={modalInfoItem}><strong>時期:</strong> {selectedItem.target_type}</div>
                <div style={modalInfoItem}><strong>目的:</strong> {selectedItem.content_type}</div>
                <div style={modalInfoItem}><strong>場所:</strong> {selectedItem.place_type}</div>
                <div style={modalInfoItem}><strong>連絡先:</strong> {selectedItem.needs_reply ? selectedItem.email : '不要'}</div>
              </div>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={modalSubTitle}>相談本文</h3>
                  <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: '1.7',
                    fontFamily: 'monospace' // 攻撃コードを見極めやすくするために推奨
                  }}>
                    {selectedItem.message.toString()}
                  </div>
                </div>
                <div>
                  <h3 style={modalSubTitle}>管理者メモ</h3>
                  <textarea defaultValue={selectedItem.admin_memo || ''} onBlur={(e) => handleSaveMemo(selectedItem.id, e.target.value)} style={{ ...memoAreaStyle, height: '140px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 ---

const checkboxStyle: React.CSSProperties = { transform: 'scale(1.5)', cursor: 'pointer', display: 'block', margin: 'auto' };
const mobileCardStyle: React.CSSProperties = { padding: '15px', borderRadius: '12px', border: '1px solid #edf2f7', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'separate', borderSpacing: '0', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' };
const thStyle: React.CSSProperties = { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold' };
const tdStyle: React.CSSProperties = { padding: '15px 12px', verticalAlign: 'top', borderBottom: '1px solid #edf2f7' };
const tripleStackStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const structContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const dataValueStyle: React.CSSProperties = { fontSize: '13px' };
const themeTextStyle: React.CSSProperties = { color: '#2b6cb0', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' };
const messagePreviewStyle: React.CSSProperties = { color: '#4a5568', fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

const memoAreaStyle: React.CSSProperties = {
  width: '100%',
  height: '100px',
  fontSize: '13px',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#fffaf0',
  resize: 'none',
  boxSizing: 'border-box'
};

const memoAreaSmallStyle: React.CSSProperties = {
  ...memoAreaStyle,
  height: '60px',
  fontSize: '12px'
};

const chatButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  textAlign: 'center',
  backgroundColor: '#3182ce',
  color: 'white',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 'bold',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const settingsPanelStyle: React.CSSProperties = { backgroundColor: '#f7fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 'bold' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '13px' };
const selectStyle: React.CSSProperties = { padding: '5px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #cbd5e0', fontWeight: 'bold' };
const deleteButtonStyle: React.CSSProperties = { color: '#e53e3e', border: '1px solid #feb2b2', background: 'white', padding: '4px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' };
const bulkDeleteButtonStyle: React.CSSProperties = { backgroundColor: '#e53e3e', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' };

// 保存ボタン用スタイル
const saveSettingsButtonStyle: React.CSSProperties = {
  backgroundColor: '#38a169',
  color: 'white',
  border: 'none',
  padding: '8px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 'bold',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '25px', maxHeight: '90vh', overflowY: 'auto' };
const modalHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '15px' };
const modalSubTitle: React.CSSProperties = { fontSize: '15px', borderLeft: '4px solid #2d3748', paddingLeft: '10px', marginBottom: '12px', fontWeight: 'bold' };
const modalInfoItem: React.CSSProperties = { fontSize: '14px', marginBottom: '12px' };
const messageBoxStyle: React.CSSProperties = { background: '#f8fafc', padding: '20px', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.7' };
const closeButtonStyle: React.CSSProperties = { border: 'none', background: 'none', fontSize: '30px', color: '#a0aec0', cursor: 'pointer' };