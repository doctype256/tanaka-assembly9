// scripts/check-turso.ts
// Turso データベースの内容を確認するスクリプト
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config({ path: ".env.local" });
const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://testdata-kyoto343.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN;
if (!tursoToken) {
    console.error("❌ TURSO_AUTH_TOKEN is not set");
    process.exit(1);
}
const db = createClient({
    url: tursoUrl,
    authToken: tursoToken,
});
async function checkTurso() {
    try {
        console.log("🔍 Checking Turso database...\n");
        // コメント数を確認
        const commentsResult = await db.execute({
            sql: "SELECT COUNT(*) as count FROM comments",
        });
        const commentCountRow = (commentsResult.rows || [])[0];
        const commentCount = (commentCountRow === null || commentCountRow === void 0 ? void 0 : commentCountRow.count) || 0;
        console.log(`📝 Comments: ${commentCount}`);
        if (commentCount > 0) {
            const allComments = await db.execute({
                sql: "SELECT id, article_title, name, message, approved, created_at FROM comments ORDER BY created_at DESC",
            });
            console.log("   Recent comments:");
            const comments = allComments.rows || [];
            comments.slice(0, 3).forEach((comment, idx) => {
                console.log(`   ${idx + 1}. ${comment.name} - ${comment.message.substring(0, 30)}...`);
            });
        }
        // お問い合わせ数を確認
        const contactsResult = await db.execute({
            sql: "SELECT COUNT(*) as count FROM contacts",
        });
        const contactCountRow = (contactsResult.rows || [])[0];
        const contactCount = (contactCountRow === null || contactCountRow === void 0 ? void 0 : contactCountRow.count) || 0;
        console.log(`\n📧 Contacts: ${contactCount}`);
        if (contactCount > 0) {
            const allContacts = await db.execute({
                sql: "SELECT id, name, email, message, created_at FROM contacts ORDER BY created_at DESC",
            });
            console.log("   Recent contacts:");
            const contacts = allContacts.rows || [];
            contacts.slice(0, 3).forEach((contact, idx) => {
                console.log(`   ${idx + 1}. ${contact.name} (${contact.email})`);
            });
        }
        console.log("\n✅ Turso database check complete");
    }
    catch (error) {
        console.error("❌ Error checking Turso database:", error);
        process.exit(1);
    }
}
checkTurso();
