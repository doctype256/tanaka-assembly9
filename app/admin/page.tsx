// directory: app/admin/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

/**
 * AdminDashboard: 管理者（議員）専用ポータル画面
 * セキュリティを維持しつつ、システム内の各機能へのゲートウェイとして機能します。
 */
export default async function AdminDashboard() {
  // 1. セッションの論理チェック
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session || session.value !== 'authenticated_token_v1') {
    redirect('/admin/login');
  }

  // 2. 各管理機能の定義（オブジェクト指向的にリスト化）
  const menuItems = [
    {
      title: "相談一覧・管理",
      description: "市民から届いた陳情や相談内容を確認し、対応状況を更新します。",
      href: "/admin/consultations",
      icon: "📩",
      color: "bg-blue-50"
    },
    {
      title: "監査ログ確認",
      description: "誰がいつログインしたか、どのような操作を行ったかの履歴を確認します。",
      href: "/admin/audit-logs",
      icon: "📜",
      color: "bg-gray-50"
    },
    {
      title: "生体認証設定",
      description: "ログインに使用する顔認証デバイスの追加登録や管理を行います。",
      href: "/admin/setup-auth",
      icon: "🔐",
      color: "bg-green-50"
    },
    {
      title: "統計データ",
      description: "相談件数の推移やカテゴリー別の集計データを閲覧します。",
      href: "/admin/stats",
      icon: "📊",
      color: "bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">🏛 議員専用ポータル</h1>
            <p className="text-gray-500 mt-1">セキュリティ保護された管理セッションです</p>
          </div>
          <div className="text-right">
            <span className="block text-sm font-medium text-gray-700">管理者: admin-001</span>
            <Link href="/admin/login" className="text-sm text-red-600 hover:text-red-800 font-semibold underline">
              ログアウト
            </Link>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`block p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] ${item.color} group`}
            >
              <div className="flex items-start">
                <span className="text-4xl mr-4 group-hover:animate-pulse">{item.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </main>

        <footer className="mt-12 text-center text-gray-400 text-xs">
          © 2026 自治体相談管理システム - 生体認証（FIDO2/WebAuthn）保護適用済み
        </footer>
      </div>
    </div>
  );
}