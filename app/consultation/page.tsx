"use client";

import Link from "next/link";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CONSULTATION_QUESTIONS, 
  getSuggestions, 
  SUGGESTION_MASTER 
} from './consultation-logic';

const STORAGE_KEY = 'consultation_form_draft_v5';

export default function ConsultationPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPc, setIsPc] = useState(false);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const initialFormData = {
    q1_id: 0,
    q2_id: 0,
    q3_id: 0,
    selected_suggestion_id: 0, 
    needs_reply: false,
    email: '',
    message: '',
    hp_field: '' 
  };

  const [formData, setFormData] = useState(initialFormData);

  // --- ユーティリティ ---
  const getCsrfToken = useCallback((): string => {
    if (typeof document === 'undefined') return '';
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('csrf_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : '';
  }, []);

  const progressPercent = Math.round((step / 6) * 100);

  // --- 初期化 & リサイズ ---
  useEffect(() => {
    const handleResize = () => setIsPc(window.innerWidth >= 600);
    handleResize();
    window.addEventListener("resize", handleResize);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { savedStep, savedData } = JSON.parse(saved);
        const validatedStep = savedStep >= 5 ? 4 : savedStep;
        setStep(validatedStep || 1);
        setFormData(savedData);
      } catch (e) { console.error(e); }
    }
    setIsInitialized(true);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- 高さ調整 ---
  const sendHeightToParent = useCallback(() => {
    if (contentRef.current) {
      const height = contentRef.current.offsetHeight;
      window.parent.postMessage({ type: 'SET_HEIGHT', height: height + 80 }, '*');
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(sendHeightToParent, 150);
      return () => clearTimeout(timer);
    }
  }, [step, formData, isInitialized, sendHeightToParent]);

  // --- 下書き保存 ---
  useEffect(() => {
    if (isInitialized && step < 6) {
      const draft = { savedStep: step, savedData: formData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [formData, step, isInitialized]);

  // --- ハンドラー ---
  const handleReset = () => {
    if (confirm("入力内容をすべて消去して、最初からやり直しますか？")) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData(initialFormData);
      setStep(1);
      setRawToken(null);
      setErrorMessage('');
    }
  };

  const nextStep = () => { setErrorMessage(''); setStep(prev => prev + 1); };
  const prevStep = () => { setErrorMessage(''); setStep(prev => prev - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    setStatus('送信中...');
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({
          target_type: CONSULTATION_QUESTIONS.q1.options.find(o => o.id === formData.q1_id)?.text,
          place_type: CONSULTATION_QUESTIONS.q2.options.find(o => o.id === formData.q2_id)?.text,
          content_type: CONSULTATION_QUESTIONS.q3.options.find(o => o.id === formData.q3_id)?.text,
          suggestion_topic: formData.selected_suggestion_id === -1 ? "該当なし" : SUGGESTION_MASTER[formData.selected_suggestion_id],
          message: formData.message,
          hp_field: formData.hp_field 
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        if (result.raw_token) setRawToken(result.raw_token);
        setStatus(`✅ 送信完了`);
        localStorage.removeItem(STORAGE_KEY);
        setStep(6);
        //window.parent.postMessage('CONSULTATION_SUBMITTED', '*');
      } else { setStatus(`❌ エラー: ${result.error}`); }
    } catch (e) { setStatus('❌ 通信エラー'); } finally { setLoading(false); }
  };

  if (!isInitialized) return null;

  const consultationUrl = rawToken ? `${window.location.origin}/consultation/view?t=${rawToken}` : null;

  return (
    <div ref={contentRef} style={{ position: 'relative', padding: '20px', width: '100%', maxWidth: '800px', margin: '0 auto', fontFamily: 'M PLUS Rounded 1c, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url("/assets/ご相談ポスト背景1.jpg")', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', opacity: 0.4, zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {step <= 6 && (
          <div style={{ marginBottom: '30px', fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
            進捗:{step} / 6
            <div style={{ width: '100%', height: '6px', background: '#FCFDFE', marginTop: '8px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4a86c5', transition: '0.3s ease-in-out' }}></div>
            </div>
          </div>
        )}

        <div style={{ minHeight: '400px' }}>
          {[1, 2, 3].includes(step) && (
            <div>
              <h2 style={titleStyle}>{CONSULTATION_QUESTIONS[`q${step as 1|2|3}`].title}</h2>
              <div style={{ display: "grid", gridTemplateColumns: isPc ? "repeat(2, 250px)" : "1fr", justifyContent: "center", gap: "24px", marginBottom: "20px" }}>
                {CONSULTATION_QUESTIONS[`q${step as 1|2|3}`].options.map((opt) => (
                  <button key={opt.id} onClick={() => { setFormData({ ...formData, [`q${step}_id`]: opt.id }); nextStep(); }} 
                    style={questionButtonStyle(isPc)}>{opt.text}</button>
                ))}
              </div>
              {step > 1 && <button onClick={prevStep} style={backButtonStyle}>前の画面に戻る</button>}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={titleStyle}>詳細をご記入ください</h2>
              
              {/* ★ サマリー表示を復活 */}
              <div style={summaryBoxStyle(isPc)}>
                <div style={{ color: '#4a5568', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>選択内容の確認</div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                  <span style={{ color: '#718096' }}>時期:</span><strong>{CONSULTATION_QUESTIONS.q1.options.find(o => o.id === formData.q1_id)?.text}</strong>
                  <span style={{ color: '#718096' }}>目的:</span><strong>{CONSULTATION_QUESTIONS.q2.options.find(o => o.id === formData.q2_id)?.text}</strong>
                  <span style={{ color: '#718096' }}>場所:</span><strong>{CONSULTATION_QUESTIONS.q3.options.find(o => o.id === formData.q3_id)?.text}</strong>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <p style={labelStyle(isPc)}>Q. 最も近いテーマ（必須）</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {getSuggestions(formData.q1_id, formData.q2_id, formData.q3_id).map((text) => {
                    const masterId = Number(Object.keys(SUGGESTION_MASTER).find(key => SUGGESTION_MASTER[Number(key)] === text));
                    const isSelected = formData.selected_suggestion_id === masterId;
                    return (
                      <button key={text} 
                        onClick={() => {
                          const newId = isSelected ? 0 : masterId;
                          setFormData({ ...formData, selected_suggestion_id: newId, message: newId === 0 ? '' : text });
                        }} 
                        style={{ ...suggestionButtonStyle(isPc), borderColor: isSelected ? '#2d3748' : '#ddd', backgroundColor: isSelected ? '#edf2f7' : '#fff' }}>
                        {isSelected ? '✅ ' : ''}{text}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={labelStyle(isPc)}>Q. 具体的な内容</p>
                {formData.message && (
                  <button type="button" onClick={() => setFormData({...formData, message: ''})} style={textDeleteLinkStyle}>入力を削除</button>
                )}
              </div>
              <textarea name="message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="状況や背景など自由にご記入ください" 
                style={{...inputStyle, height: '180px', borderColor: (errorMessage && !formData.message) ? '#e53e3e' : '#e2e8f0'}} />
              
              <button onClick={() => {
                if(formData.selected_suggestion_id === 0) { setErrorMessage("テーマを選択してください"); return; }
                if(!formData.message.trim()) { setErrorMessage("内容を入力してください"); return; }
                nextStep();
              }} style={nextButtonStyle}>入力内容を確認する</button>

              {errorMessage && <div style={errorTipStyle}>{errorMessage}</div>}
              <button onClick={prevStep} style={backButtonStyle}>前の画面に戻る</button>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={titleStyle}>送信内容の確認</h2>
              <div style={confirmBoxStyle}>
                <div style={confirmItemStyle}>
                  <span style={confirmLabelStyle}>選択内容</span>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {CONSULTATION_QUESTIONS.q1.options.find(o => o.id === formData.q1_id)?.text} ／ {CONSULTATION_QUESTIONS.q2.options.find(o => o.id === formData.q2_id)?.text} ／ {CONSULTATION_QUESTIONS.q3.options.find(o => o.id === formData.q3_id)?.text}
                  </div>
                </div>
                <div style={confirmItemStyle}>
                  <span style={confirmLabelStyle}>相談テーマ</span>
                  <div style={{ fontWeight: 'bold' }}>{formData.selected_suggestion_id === -1 ? "該当なし" : SUGGESTION_MASTER[formData.selected_suggestion_id]}</div>
                </div>
                <div style={{ ...confirmItemStyle, borderBottom: 'none' }}>
                  <span style={confirmLabelStyle}>具体的な内容</span>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginTop: '5px' }}>{formData.message}</div>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={loading} style={{...nextButtonStyle, backgroundColor: '#2d3748', opacity: loading ? 0.7 : 1}}>
                {loading ? '送信中...' : '確定して送信する'}
              </button>
              <button onClick={prevStep} style={backButtonStyle}>修正する（戻る）</button>
            </div>
          )}

{step === 6 && (
  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
    <h2
  style={{
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '20px'
  }}
>
  {status}
</h2>

{/* ★ ここに追加 */}
<p
  style={{
    color: '#2d3748',
    marginBottom: '25px',
    lineHeight: '1.6'
  }}
>
  こちらは議員本人と直接やり取りができるチャットのURLです。
  ご相談への返信もこちらでお送りしますので、ぜひチャットへお入りください。
</p>

    {consultationUrl && (
      <div
        style={{
          textAlign: 'left',
          backgroundColor: '#fffaf0',
          border: '1px solid #feebc8',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}
      >
        <p style={{ color: '#c05621', fontWeight: 'bold', marginBottom: '10px' }}>
          ⚠️ 重要：このURLを保存してください
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}
        >
          <code
            style={{
              fontSize: '12px',
              wordBreak: 'break-all',
              color: '#2d3748'
            }}
          >
            {consultationUrl}
          </code>

          <button
            onClick={() => {
              navigator.clipboard.writeText(consultationUrl);
              alert("URLをコピーしました。");
            }}
            style={{
              backgroundColor: '#2d3748',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            URLをコピーする
          </button>
        </div>
      </div>
    )}

    <button
      onClick={() => window.parent.postMessage('CONSULTATION_SUBMITTED', '*')}
      style={{ ...nextButtonStyle, background: '#4a5568', maxWidth: '300px', margin: '0 auto' }}
    >
      ウィンドウを閉じる
    </button>
  </div>
)}
        </div>

{step <= 5 && (
  <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
    
    {step > 1 && (
      <button onClick={handleReset} style={resetButtonStyle}>
        最初からやり直す（全入力消去）
      </button>
    )}

    <div style={{ marginTop: '20px' }}>
      <Link
        href="/privacy"
        style={{
          fontSize: '14px',
          color: '#4a86c5',
          textDecoration: 'underline'
        }}
      >
        プライバシーポリシーはこちら
      </Link>
    </div>

  </div>
)}
      </div>
    </div>
  );
}

// --- Styles ---
const titleStyle: React.CSSProperties = { fontSize: '1.6rem', marginBottom: '1.5rem', fontWeight: 'bold', color: '#1a202c', textAlign: 'center' };
const labelStyle = (isPc: boolean): React.CSSProperties => ({ fontSize: isPc ? '16px' : '15px', marginBottom: '10px', fontWeight: 'bold', color: '#4a5568' });
const summaryBoxStyle = (isPc: boolean): React.CSSProperties => ({ marginBottom: '25px', padding: '20px', background: '#ffffff', borderRadius: '12px', fontSize: isPc ? '17px' : '14px', border: '2px solid #e2e8f0', lineHeight: '1.6' });
const questionButtonStyle = (isPc: boolean): React.CSSProperties => ({ width: "100%", border: "3px solid #ffffff", borderRadius: "20px", backgroundColor: "#d4e6f7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#2d3748", ...(isPc ? { aspectRatio: "1 / 1", fontSize: "19px", padding: "10px" } : { padding: "15px", fontSize: "15px" }) });
const suggestionButtonStyle = (isPc: boolean): React.CSSProperties => ({ width: "100%", padding: isPc ? "18px 20px" : "15px", fontSize: isPc ? "16px" : "14.5px", border: "1px solid #ddd", borderRadius: "12px", textAlign: 'left', cursor: 'pointer' });
const textDeleteLinkStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#e53e3e', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' };
const errorTipStyle: React.CSSProperties = { color: '#e53e3e', fontSize: '15px', fontWeight: 'bold', textAlign: 'center', marginTop: '12px', padding: '8px', backgroundColor: '#fff5f5', borderRadius: '8px' };
const nextButtonStyle: React.CSSProperties = { width: '100%', padding: '18px', marginTop: '15px', backgroundColor: '#4378b1', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '17px', fontWeight: 'bold' };
const backButtonStyle: React.CSSProperties = { marginTop: '20px', padding: '12px', width: '100%', background: '#f8f9fa', border: '1px solid #cbd5e0', borderRadius: '10px', color: '#4a5568', cursor: 'pointer', fontSize: '14px', fontWeight: '500' };
const resetButtonStyle: React.CSSProperties = { backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '15px', fontSize: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', marginTop: '10px', boxSizing: 'border-box', outline: 'none' };
const confirmBoxStyle: React.CSSProperties = { backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #e2e8f0', padding: '20px', marginBottom: '20px' };
const confirmItemStyle: React.CSSProperties = { paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #edf2f7' };
const confirmLabelStyle: React.CSSProperties = { fontSize: '12px', color: '#718096', display: 'block', marginBottom: '4px', fontWeight: 'bold' };