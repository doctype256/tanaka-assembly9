// directory: app/admin/layout.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AdminNavigation } from '@/components/AdminNavigation';

/**
 * AdminLayout: 管理者画面のベースレイアウト
 * 修正論理：
 * ログインページなど、特定の認証前ページではナビゲーションバーを非表示にします。
 * CSR(Client Side Rendering)でのパス判定を行うため、"use client" を付与します。
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ナビゲーションを表示させたくないパスのリスト
  const noNavPaths = [
    '/admin/login',
    '/admin/login/recovery',
    '/admin/settings/recovery',
    '/admin/recovery',
  ];

  const showNavigation = !noNavPaths.includes(pathname);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      {/* ログイン画面以外の場合のみナビゲーションを表示 */}
      {showNavigation && <AdminNavigation />}
      
      {/* コンテンツエリアの余白調整
        ナビゲーションがある場合は paddingTop を 80px、
        ない場合（ログイン画面など）は 0 または適切な余白に設定します。
      */}
      <main style={{ 
        paddingTop: showNavigation ? '80px' : '0px', 
        paddingBottom: '40px', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        paddingLeft: '20px', 
        paddingRight: '20px' 
      }}>
        {children}
      </main>
    </div>
  );
}