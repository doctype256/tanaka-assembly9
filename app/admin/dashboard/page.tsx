// directory: app/admin/dashboard/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [lastLoginJST, setLastLoginJST] = useState<string>("読み込み中...");

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(now) + " (JST)";
    setLastLoginJST(formatted);
  }, []);

  const menuItems = [
    // 既存機能
    {
      title: "📩 相談内容の確認",
      description: "市民から届いた相談（暗号化済み）の閲覧・管理を行います。",
      path: "/admin/consultations",
      color: "#0070f3"
    },
    {
      title: "🛡️ セキュリティ・認証管理",
      description: "パスキー登録・復旧コード管理を行います。",
      path: "/admin/settings/devices",
      color: "#2D3748"
    },
    {
      title: "📋 システム操作履歴",
      description: "管理者操作ログ・不正アクセス遮断履歴を確認します。",
      path: "/admin/audit-logs",
      color: "#38A169"
    },

    // CMS機能
    {
      title: "📝 活動報告編集",
      description: "活動報告の投稿・編集・削除を行います。",
      path: "/admin/activity-report-edit",
      color: "#3182CE"
    },
    {
      title: "📰 shihoPress編集",
      description: "PDFのアップロード・管理を行います。",
      path: "/admin/shihoPress-edit",
      color: "#805AD5"
    },
    {
      title: "👤 自己紹介編集",
      description: "プロフィールおよび経歴情報を編集します。",
      path: "/admin/introduction-edit",
      color: "#DD6B20"
    }
  ];

  return (
    <div style={{
      padding: '50px 20px',
      maxWidth: '1100px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{
        marginBottom: '50px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 'bold',
          color: '#1A202C'
        }}>
          🏛️ 議員専用ダッシュボード
        </h1>
        <p style={{
          color: '#718096',
          fontSize: '14px',
          marginTop: '8px',
          lineHeight: '1.6'
        }}>
          権限: 管理者（田中しほ）<br />
          最終ログイン記録: <strong style={{ color: '#2D3748' }}>{lastLoginJST}</strong>
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '30px'
      }}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => router.push(item.path)}
            style={{
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 6px 14px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 14px 28px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = item.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '14px',
              color: item.color
            }}>
              {item.title}
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#4A5568',
              lineHeight: '1.7'
            }}>
              {item.description}
            </p>

            <div style={{
              marginTop: '25px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: item.color
            }}>
              管理画面を開く →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}