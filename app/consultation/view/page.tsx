// directory: app/consultation/view/page.tsx
"use client";

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ConsultationViewContent: 相談者向け対話・詳細閲覧コンポーネント
 * 修正論理：
 * 1. DBカラム名 suggestion_topic との不整合を修正。
 * 2. 議員側画面と情報の密度を合わせ、相談者が自身の入力を正確に振り返れるように構築。
 */
function ConsultationViewContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<any>(null);
  const [decryptedInitial, setDecryptedInitial] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const getCsrfToken = useCallback((): string => {
    if (typeof document === 'undefined') return '';
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('csrf_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : '';
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/consultations/messages?t=${token}`);
      if (!res.ok) throw new Error("チャット履歴の同期に失敗しました");
      const data = await res.json();
      setDecryptedInitial(data.initialMessage || "");
      setChatHistory(data.history || []);
    } catch (err: any) {
      console.error("Fetch history failed:", err.message);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("アクセス拒否：無効な照会トークンです。");
      setLoading(false);
      return;
    }

    const initLoad = async () => {
      try {
        const verifyRes = await fetch(`/api/consultations/verify?t=${token}`);
        if (!verifyRes.ok) throw new Error("認証に失敗しました。このURLは利用できません。");
        
        const verifyData = await verifyRes.json();
        
        if (verifyData && verifyData.data) {
          setConsultation(verifyData.data);
        } else {
          throw new Error("データの取得に失敗しました。");
        }
        
        await fetchMessages();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initLoad();
  }, [token, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/consultations/messages?t=${token}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (!res.ok) throw new Error("送信エラーが発生しました。");

      setNewMessage("");
      await fetchMessages();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div style={centerStyle}>セキュリティ接続を確立中...</div>;
  if (error) return <div style={{...centerStyle, color: '#e53e3e', textAlign: 'center'}}>{error}</div>;

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>相談内容の確認 (ID: {consultation?.id})</h1>
        <span style={statusTagStyle}>
          {consultation?.status === 'unread' ? '受付済み' : consultation?.status === 'completed' ? '完了' : '対応中'}
        </span>
      </header>

      {/* 相談情報の詳細表示：カラム名の論理的整合性を確保 */}
      {consultation && (
        <div style={detailBoxStyle}>
          <div style={detailGridStyle}>
            <div><strong>対象:</strong> {consultation.target_type || "未設定"}</div>
            <div><strong>場所:</strong> {consultation.place_type || "未設定"}</div>
            <div><strong>内容種別:</strong> {consultation.content_type || "未設定"}</div>
            <div><strong>トピック:</strong> {consultation.suggestion_topic || "未設定"}</div>
            <div><strong>返信希望:</strong> {consultation.needs_reply ? "あり" : "なし"}</div>
            <div><strong>送信日時:</strong> {consultation.created_at ? new Date(consultation.created_at).toLocaleString() : "-"}</div>
          </div>
          <div style={originalMessageStyle}>
            <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px', fontWeight: 'bold' }}>最初の相談内容：</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{decryptedInitial}</div>
          </div>
        </div>
      )}

      {/* チャットメッセージ履歴エリア */}
      <div style={chatBoxStyle}>
        {chatHistory.map((msg, index) => (
          <div key={index} style={msg.sender_type === 'user' ? userMsgStyle : adminMsgStyle}>
            <div style={msg.sender_type === 'user' ? userBubble : adminBubble}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.decrypted_body}</p>
              <div style={{ fontSize: '10px', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>
                {msg.sender_type === 'user' ? 'あなた' : '議員'} - {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {chatHistory.length === 0 && (
          <div style={{ textAlign: 'center', color: '#a0aec0', marginTop: '30px' }}>
            議員からの回答をお待ちください。
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} style={inputFormStyle}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="追加の情報を入力してください..."
          style={textareaStyle}
          required
        />
        <button 
          type="submit" 
          disabled={isSending || !newMessage.trim()} 
          style={isSending || !newMessage.trim() ? disabledButtonStyle : sendButtonStyle}
        >
          {isSending ? "送信中..." : "返信する"}
        </button>
      </form>
      <p style={securityNoticeStyle}>※通信はAES-256-GCMにより強力に保護されています</p>
    </div>
  );
}

export default function ConsultationViewPage() {
  return (
    <Suspense fallback={<div style={centerStyle}>Loading...</div>}>
      <ConsultationViewContent />
    </Suspense>
  );
}

// スタイル定義 (維持)
const centerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' };
const containerStyle: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#2d3748' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', marginBottom: '20px', paddingBottom: '10px' };
const titleStyle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 'bold', margin: 0 };
const statusTagStyle: React.CSSProperties = { backgroundColor: '#4a5568', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' };
const detailBoxStyle: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const detailGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', fontSize: '13px' };
const originalMessageStyle: React.CSSProperties = { backgroundColor: '#f8fafc', border: '1px solid #edf2f7', padding: '12px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' };
const chatBoxStyle: React.CSSProperties = { height: '450px', overflowY: 'auto', padding: '20px', backgroundColor: '#f7fafc', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #e2e8f0' };
const userMsgStyle: React.CSSProperties = { alignSelf: 'flex-end', maxWidth: '80%' };
const adminMsgStyle: React.CSSProperties = { alignSelf: 'flex-start', maxWidth: '80%' };
const userBubble: React.CSSProperties = { backgroundColor: '#3182ce', color: 'white', padding: '12px 16px', borderRadius: '18px 18px 2px 18px', boxShadow: '0 2px 4px rgba(49,130,206,0.3)' };
const adminBubble: React.CSSProperties = { backgroundColor: 'white', color: '#2d3748', padding: '12px 16px', borderRadius: '18px 18px 18px 2px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const inputFormStyle: React.CSSProperties = { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' };
const textareaStyle: React.CSSProperties = { width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e0', resize: 'none', height: '90px', boxSizing: 'border-box', fontSize: '15px' };
const sendButtonStyle: React.CSSProperties = { alignSelf: 'flex-end', padding: '10px 30px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' };
const disabledButtonStyle: React.CSSProperties = { ...sendButtonStyle, backgroundColor: '#cbd5e0', cursor: 'not-allowed' };
const securityNoticeStyle: React.CSSProperties = { textAlign: 'center', fontSize: '10px', color: '#a0aec0', marginTop: '10px' };