"use client";

import React, { useState, useEffect, useCallback } from 'react';

export default function ConsultationFloatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [mounted, setMounted] = useState(false);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setShowBanner(true);   // ← バナーを再表示
  }, []);

  const openModal = useCallback(() => {
    setShowBanner(false);  // ← バナーを消す
    setIsOpen(true);
  }, []);

  const [iframeHeight, setIframeHeight] = useState('85vh');

useEffect(() => {
  setMounted(true);

  const handleMessage = (event: MessageEvent) => {

    if (event.data && event.data.type === 'SET_HEIGHT') {
      const currentWidth = window.innerWidth;
      const isMobile = currentWidth <= 768;

      const minHeight = isMobile ? 500 : 600;
      const maxHeightPx = window.innerHeight * 0.9;
        const buffer = 40; // ゆとりを持たせる
      const requestedHeight = event.data.height + buffer;
        
        // 「中身の高さ」か「画面の90%」の、どちらか小さい方を採用
      const calculatedHeight = Math.max(requestedHeight, minHeight);
      const finalHeight = Math.min(calculatedHeight, maxHeightPx);
      setIframeHeight(`${finalHeight}px`);
    }

    if (event.data === 'CONSULTATION_SUBMITTED') {
      setTimeout(() => closeModal(), 2000);
    }

   if (event.data === 'HTML_MODAL_OPEN') {
      setShowBanner(false);
    }

    if (event.data === 'HTML_MODAL_CLOSE') {
      setShowBanner(true);
    }

  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);

}, [closeModal]);

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .banner-trigger-btn {
          position: fixed;
          z-index: 1000;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          padding: 0 !important;
          cursor: pointer;
          line-height: 0;
          -webkit-tap-highlight-color: transparent;
        }

        /* --- 共通の画像スタイル（指定色 #4682B4 の枠 / 影なし） --- */
        .banner-img {
          width: 100%;
          height: auto;
          display: block;
          border: 4px solid #4682B4; 
          box-sizing: border-box;
          background-color: #4682B4; 
          /* 影を完全に削除 */
          filter: none !important; 
        }

        /* --- PC版：大きく表示 --- */
        @media (min-width: 769px) {
          .banner-trigger-btn {
            bottom: 40px;
            right: 40px;
            width: 420px;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .banner-trigger-btn:hover {
            transform: scale(1.05) translateY(-5px);
          }
          .banner-img {
            border-radius: 18px; 
          }
        }

        /* --- スマホ版：枠あり浮遊（影なし） --- */
        @media (max-width: 768px) {
          .banner-trigger-btn {
            bottom: 15px;
            left: 5%;
            width: 90%;
            display: flex;
            justify-content: center;
          }
          .banner-img {
            width: 100%;
            max-width: 400px;
            border-radius: 12px;
          }
          body { padding-bottom: 120px !important; }
        }

        /* モーダル部分（ここからも影を削除） */
        .modal-responsive {
          background: white;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          /* 影を削除し、代わりに細い枠線で境界を出す */
          border: 1px solid #ddd;
          animation: modalFadeIn 0.3s ease-out;
        }

              /* --- PC版：大きく表示 --- */
        @media (min-width: 769px) {
          .modal-responsive {
            width: 90%;       /* 画面幅の9割を使用 */
            max-width: 900px; /* 最大幅を800から900に拡張 */
            /* CSS側でもmin-heightを入れておくと、通信待ちの間も形が崩れません */
            min-height: 600px; 
            transition: height 0.3s ease, transform 0.3s ease;
        }
        }

      `}} />

      {showBanner && (
        <button type="button" onClick={openModal} className="banner-trigger-btn">
          <img
            src="/assets/バナー3.png"
            alt="相談する"
            className="banner-img"
          />
        </button>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', /* 背景の暗がりは視認性のため維持 */
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex:20000, padding: '16px', boxSizing: 'border-box'
        }} onClick={closeModal}>
          <div className="modal-responsive" style={{ height: iframeHeight,maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', 
              background: '#4682B4', 
              color: 'white',
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>ご相談フォーム</span>
                <button onClick={closeModal} style={{
                background: 'none', border: 'none', fontSize: '32px', color: 'white', cursor: 'pointer', lineHeight: 1
                }}>×</button>
              </div>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}></div>
                <iframe
                  src="/consultation"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  title="consultation-form"
                />
              </div>
            </div>
      )}
    </>
  );
}
