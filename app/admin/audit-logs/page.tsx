// directory: app/admin/audit-logs/page.tsx
"use client";

import React, { useEffect, useState } from 'react';

/**
 * AuditLogPage: 監査ログ動的表示画面
 * 固定値を排除し、DBの audit_logs テーブルの内容をありのまま可視化します。
 */
export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // APIから監査ログを取得
    fetch('/api/admin/audit-logs')
      .then(res => res.json())
      .then(data => {
        // 時系列（降順）にソート
        const sortedData = data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLogs(sortedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Audit log fetch error:", err);
        setLoading(false);
      });
  }, []);

  /**
   * DBから取得した実データに基づき統計を計算
   */
  const getDynamicStats = () => {
    const actionCounts: Record<string, number> = {};
    logs.forEach(log => {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    });
    return actionCounts;
  };

  if (loading) return <div style={centerTextStyle}>監視データを読込中（日本時間解析）...</div>;

  const stats = getDynamicStats();

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>システム監査ログ (DB直結)</h1>
        <p style={subtitleStyle}>DBから取得した生の操作・防御記録を表示しています。</p>
      </header>

      {/* DBのアクション種別ごとに動的にカードを生成 */}
      <div style={statGridStyle}>
        {Object.entries(stats).map(([action, count]) => (
          <DynamicStatCard key={action} label={action} count={count} />
        ))}
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRowStyle}>
              <th style={thStyle}>日本時間 (JST)</th>
              <th style={thStyle}>アクション種別</th>
              <th style={thStyle}>ステータス</th>
              <th style={thStyle}>接続元 (IP Hash)</th>
              <th style={thStyle}>エラーコード</th>
              <th style={thStyle}>相談ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * AuditLogRow: 1行分のログ表示
 * 日本時間への厳格な変換とDB値のレンダリングを行います。
 */
function AuditLogRow({ log }: { log: any }) {
  // DBのUTC文字列を日本時間に変換する
  const formatJST = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <tr style={trStyle}>
      <td style={tdStyle}>
        <span style={dateTextStyle}>{formatJST(log.created_at)}</span>
      </td>
      <td style={tdStyle}>
        <span style={actionBadgeStyle}>{log.action_type}</span>
      </td>
      <td style={tdStyle}>
        <StatusIndicator status={log.status} />
      </td>
      <td style={tdStyle}>
        <div style={ipHashStyle} title={log.user_agent}>{log.ip_hash}</div>
      </td>
      <td style={tdStyle}>
        <code style={errorCodeStyle}>{log.error_code || '-'}</code>
      </td>
      <td style={tdStyle}>
        {log.consultation_id || '-'}
      </td>
    </tr>
  );
}

/**
 * StatusIndicator: ステータスに応じた色分け（動的）
 */
function StatusIndicator({ status }: { status: string }) {
  const isSuccess = status === 'SUCCESS';
  const isBlocked = status === 'BLOCKED' || status === 'SPAM_REJECTED';
  
  const style = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: isSuccess ? '#C6F6D5' : isBlocked ? '#FED7D7' : '#EDF2F7',
    color: isSuccess ? '#22543D' : isBlocked ? '#822727' : '#4A5568',
  };

  return <span style={style as any}>{status}</span>;
}

/**
 * DynamicStatCard: DBの集計値を表示
 */
function DynamicStatCard({ label, count }: { label: string, count: number }) {
  return (
    <div style={cardStyle}>
      <div style={cardLabelStyle}>{label}</div>
      <div style={cardCountStyle}>{count} <span style={{fontSize: '12px'}}>件</span></div>
    </div>
  );
}

// --- Styles ---

const containerStyle: React.CSSProperties = { padding: '30px', maxWidth: '100%', backgroundColor: '#F7FAFC', minHeight: '100vh' };
const headerStyle: React.CSSProperties = { marginBottom: '30px' };
const titleStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 'bold', color: '#2D3748' };
const subtitleStyle: React.CSSProperties = { fontSize: '14px', color: '#718096' };
const statGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' };
const tableWrapperStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', overflowX: 'auto' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' };
const theadRowStyle: React.CSSProperties = { backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' };
const thStyle: React.CSSProperties = { padding: '12px 15px', textAlign: 'left', color: '#4A5568', fontWeight: 'bold' };
const trStyle: React.CSSProperties = { borderBottom: '1px solid #EDF2F7' };
const tdStyle: React.CSSProperties = { padding: '12px 15px', verticalAlign: 'middle' };
const dateTextStyle: React.CSSProperties = { fontFamily: 'monospace', color: '#2D3748' };
const actionBadgeStyle: React.CSSProperties = { fontWeight: 'bold', color: '#3182CE' };
const ipHashStyle: React.CSSProperties = { fontSize: '11px', color: '#718096', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const errorCodeStyle: React.CSSProperties = { color: '#E53E3E' };
const centerTextStyle: React.CSSProperties = { padding: '100px', textAlign: 'center', color: '#718096' };
const cardStyle: React.CSSProperties = { backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const cardLabelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#718096', marginBottom: '5px' };
const cardCountStyle: React.CSSProperties = { fontSize: '20px', fontWeight: 'bold', color: '#2D3748' };