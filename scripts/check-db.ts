// directory: scripts/check-db.ts

import { client } from '../db/client';

async function check() {
  try {
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='consultations';");
    
    if (result.rows.length > 0) {
      console.log("✅ テーブル 'consultations' は正常に存在します。");
      
      // カラム情報の表示
      const columns = await client.execute("PRAGMA table_info(consultations);");
      console.log("--- カラム構成 ---");
      columns.rows.forEach(row => {
        console.log(`- ${row.name} (${row.type})`);
      });
    } else {
      console.log("❌ テーブル 'consultations' が見つかりません。");
    }
  } catch (error) {
    console.error("❌ 確認中にエラーが発生しました:", error);
  }
}

check();