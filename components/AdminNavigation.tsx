// directory: components/AdminNavigation.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/**
 * AdminNavigation: レスポンシブ対応 & ログアウト論理実装
 */
export const AdminNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 画面幅の監視
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false); // PCサイズになったらメニューを閉じる
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { label: 'ダッシュボード', href: '/admin/dashboard' },
    { label: 'TOPページ編集', href: '/admin/top-page-edit' },
    { label: '自己紹介編集', href: '/admin/introduction-edit' },
    { label: '活動報告編集', href: '/admin/activity-report-edit' },
    { label: 'ShihoPress編集', href: '/admin/shihoPress-edit' },
    { label: '相談一覧', href: '/admin/consultations' },
    { label: 'デバイス管理', href: '/admin/settings/devices' },
  ];

  /**
   * ログアウト処理: 
   * サーバーセッションを破棄し、クライアントキャッシュをリフレッシュしてリダイレクトする
   */
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('ログアウトしますか？')) return;

    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'x-csrf-token': document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf_token='))
            ?.split('=')[1] || ''
        }
      });

      if (res.ok) {
        setIsOpen(false);
        // ルーターのキャッシュをクリアしてログインページへ強制移動
        router.push('/admin/login');
        router.refresh(); 
      } else {
        alert('ログアウトに失敗しました。');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <nav style={navStyle}>
        <div style={containerStyle}>
          <div style={brandStyle}>管理者パネル</div>

          {/* PC版メニュー */}
          {!isMobile && (
            <ul style={desktopUlStyle}>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} style={pathname === item.href ? activeLinkStyle : linkStyle}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li style={{ marginLeft: '20px' }}>
                <button onClick={handleLogout} style={logoutButtonStyle}>
                  ログアウト
                </button>
              </li>
            </ul>
          )}

          {/* モバイル版ハンバーガー */}
          {isMobile && (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              style={hamburgerButtonStyle}
              aria-label="メニュー"
            >
              <div style={isOpen ? { ...barStyle, transform: 'rotate(45deg) translate(5px, 6px)' } : barStyle} />
              <div style={isOpen ? { ...barStyle, opacity: 0 } : barStyle} />
              <div style={isOpen ? { ...barStyle, transform: 'rotate(-45deg) translate(5px, -6px)' } : barStyle} />
            </button>
          )}
        </div>
      </nav>

      {/* モバイル用オーバーレイ */}
      {isMobile && isOpen && (
        <div style={mobileMenuOverlayStyle}>
          <ul style={mobileUlStyle}>
            {navItems.map((item) => (
              <li key={item.href} style={{ width: '100%' }}>
                <Link 
                  href={item.href} 
                  onClick={() => setIsOpen(false)}
                  style={pathname === item.href ? activeMobileLinkStyle : mobileLinkStyle}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li style={{ marginTop: '30px' }}>
              <button onClick={handleLogout} style={logoutButtonStyle}>
                ログアウト
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* ヘッダー分のスペーサー */}
      <div style={{ height: '60px' }} />
    </>
  );
};

// --- スタイル定義 ---

const navStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, height: '60px',
  backgroundColor: '#1a202c', color: 'white',
  display: 'flex', alignItems: 'center', zIndex: 1000,
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

const containerStyle: React.CSSProperties = {
  width: '100%', maxWidth: '1200px', margin: '0 auto',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px',
};

const brandStyle: React.CSSProperties = { fontWeight: 'bold', fontSize: '1.2rem' };

const desktopUlStyle: React.CSSProperties = {
  display: 'flex', listStyle: 'none', gap: '20px', margin: 0, padding: 0, alignItems: 'center',
};

const linkStyle: React.CSSProperties = { color: '#a0aec0', textDecoration: 'none', fontSize: '14px' };
const activeLinkStyle: React.CSSProperties = { ...linkStyle, color: 'white', fontWeight: 'bold' };

const hamburgerButtonStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  width: '24px', height: '18px', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
};

const barStyle: React.CSSProperties = {
  width: '100%', height: '2px', backgroundColor: 'white', transition: '0.3s'
};

const mobileMenuOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: '60px', left: 0, width: '100%', height: 'calc(100vh - 60px)',
  backgroundColor: '#2d3748', zIndex: 999, padding: '40px 20px',
};

const mobileUlStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', listStyle: 'none', gap: '25px', margin: 0, padding: 0, textAlign: 'center'
};

const mobileLinkStyle: React.CSSProperties = { color: 'white', fontSize: '1.2rem', textDecoration: 'none', display: 'block' };
const activeMobileLinkStyle: React.CSSProperties = { ...mobileLinkStyle, color: '#63b3ed', fontWeight: 'bold' };

const logoutButtonStyle: React.CSSProperties = {
  color: '#fc8181', border: '1px solid #fc8181', backgroundColor: 'transparent',
  padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
};