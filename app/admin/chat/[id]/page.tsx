// directory: app/admin/chat/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

/**
 * AdminChatPage: 議員専用対話管理コンポーネント
 * * 相談の詳細情報を表示し、相談者との間で暗号化されたメッセージの送受信を行います。
 * セキュリティ上の重要機能として、Double Submit Cookie パターンによる CSRF 対策を実装しています。
 */
export default function AdminChatPage() {
  const { id } = useParams();
  const [consultation, setConsultation] = useState<any>(null); // 相談内容のメタデータおよび本文
  const [messages, setMessages] = useState<any[]>([]);        // チャット履歴
  const [newMessage, setNewMessage] = useState("");           // 入力中の新規メッセージ
  const [loading, setLoading] = useState(true);               // 読み込み状態管理

  /**
   * getCsrfToken: 
   * Cookieから 'csrf_token' を抽出する論理的ユーティリティ。
   * セキュリティポリシーに基づき、POSTリクエストの正当性を証明するために使用します。
   */
  const getCsrfToken = useCallback((): string => {
    if (typeof document === 'undefined') return '';
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('csrf_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : '';
  }, []);

  /**
   * fetchChat: 
   * 相談詳細およびメッセージ履歴をサーバーから取得します。
   */
  const fetchChat = useCallback(async () => {
    try {
      setLoading(true);
      // 議員権限でアクセスするため、バックエンド側でセッション確認が行われる想定
      const res = await fetch(`/api/admin/messages?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.history || []);
        setConsultation(data.consultation || null);
      } else {
        console.error("データの取得に失敗しました。ステータス:", res.status);
      }
    } catch (err) {
      console.error("チャット取得通信エラー:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  /**
   * handleSend: 
   * 議員からの返信を送信します。
   * オブジェクト指向の観点から、リクエストの構築、ヘッダーの付与、事後処理を一貫して管理します。
   */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // CSRFトークンを取得。存在しない場合はリクエスト自体を無効化する論理設計
      const csrfToken = getCsrfToken();
      
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken // 【重要】MiddlewareのCSRF検証を通過させるために必須
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (res.ok) {
        setNewMessage(""); // 入力フィールドの初期化
        fetchChat();       // 履歴の再取得（状態の同期）
      } else {
        const errorData = await res.json();
        alert(`送信失敗: ${errorData.error || '不明なエラー'}`);
      }
    } catch (err) {
      console.error("送信中の例外発生:", err);
      alert("通信エラーが発生しました。");
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: '1.2rem', margin: 0 }}>相談ID: {id} との対話</h1>
        <a href="/admin/consultations" style={backLinkStyle}>← 一覧に戻る</a>
      </header>

      {/* 相談者からの初期情報を表示する詳細セクション */}
      {consultation && (
        <div style={detailBoxStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '13px' }}>
            <div><strong>対象:</strong> {consultation.target_type}</div>
            <div><strong>場所:</strong> {consultation.place_type}</div>
            <div><strong>内容種別:</strong> {consultation.content_type}</div>
            <div><strong>トピック:</strong> {consultation.suggestion_topic}</div>
            <div><strong>返信希望:</strong> {consultation.needs_reply ? "あり" : "なし"}</div>
            <div><strong>送信日時:</strong> {consultation.created_at}</div>
          </div>
          <div style={originalMessageStyle}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', fontWeight: 'bold' }}>最初の相談内容：</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{consultation.message}</div>
          </div>
        </div>
      )}

      {/* チャットメッセージ履歴エリア */}
      <div style={chatBoxStyle}>
        {messages.map((m, i) => (
          <div key={i} style={m.sender_type === 'admin' ? adminMsgStyle : userMsgStyle}>
            <div style={m.sender_type === 'admin' ? adminBubble : userBubble}>
              <p style={{ margin: '0 0 5px 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {m.decrypted_body}
              </p>
              <div style={{ textAlign: 'right', fontSize: '10px', opacity: 0.7 }}>
                {m.sender_type === 'admin' ? '議員' : '相談者'} - {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            対話はまだありません。返信を入力して相談者に連絡を開始してください。
          </div>
        )}
      </div>

      {/* 返信入力フォーム */}
      <form onSubmit={handleSend} style={inputFormStyle}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="相談者への返信内容を入力してください..."
          style={textareaStyle}
          required
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          style={{
            ...sendButtonStyle,
            backgroundColor: newMessage.trim() ? '#0070f3' : '#ccc',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          返信する
        </button>
      </form>
    </div>
  );
}

// --- スタイル定義 (カプセル化を意識した定数管理) ---
const containerStyle: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', marginBottom: '15px', paddingBottom: '10px' };
const chatBoxStyle: React.CSSProperties = { height: '500px', overflowY: 'auto', padding: '20px', backgroundColor: '#f0f2f5', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #ddd' };
const userMsgStyle: React.CSSProperties = { alignSelf: 'flex-start', maxWidth: '80%' };
const adminMsgStyle: React.CSSProperties = { alignSelf: 'flex-end', maxWidth: '80%' };
const userBubble: React.CSSProperties = { backgroundColor: 'white', padding: '12px 16px', borderRadius: '18px 18px 18px 2px', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const adminBubble: React.CSSProperties = { backgroundColor: '#0070f3', color: 'white', padding: '12px 16px', borderRadius: '18px 18px 2px 18px', boxShadow: '0 2px 4px rgba(0,112,243,0.3)' };
const inputFormStyle: React.CSSProperties = { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' };
const textareaStyle: React.CSSProperties = { width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #ccc', resize: 'none', height: '100px', boxSizing: 'border-box', fontSize: '15px' };
const sendButtonStyle: React.CSSProperties = { alignSelf: 'flex-end', padding: '12px 30px', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', fontSize: '15px', transition: 'background-color 0.2s' };
const backLinkStyle: React.CSSProperties = { fontSize: '14px', color: '#0070f3', textDecoration: 'none', fontWeight: '500' };
const detailBoxStyle: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const originalMessageStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', border: '1px solid #edf2f7', padding: '12px', borderRadius: '8px', fontSize: '14px', color: '#2d3748', lineHeight: '1.6' };