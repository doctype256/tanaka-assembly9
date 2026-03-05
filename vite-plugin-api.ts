import { ViteDevServer } from 'vite';
import { createClient, Client } from '@libsql/client';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// .env.local を読み込み
config({ path: '.env.local' });

const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://testdata-kyoto343.aws-ap-northeast-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

/**
 * Vite 開発サーバー用 API ミドルウェア
 */
export default function apiPlugin() {
  return {
    name: 'vite-plugin-api',
    configResolved() {
      // プラグイン設定完了
    },
    async configureServer(server: ViteDevServer) {
      // ファイル配信ミドルウェア: /uploads/ パスからのファイル提供
      server.middlewares.use('/uploads', (req, res, next) => {
        const encodedFileName = req.url?.replace(/^\//, '');
        if (!encodedFileName) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        // URLデコード
        const fileName = decodeURIComponent(encodedFileName);
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        
        // パストラバーサル対策
        if (!filePath.startsWith(path.join(process.cwd(), 'uploads'))) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        try {
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': 'application/pdf' });
            res.end(fileContent);
          } else {
            res.writeHead(404);
            res.end('File not found');
          }
        } catch (error) {
          console.error('[API] Error serving file:', error);
          res.writeHead(500);
          res.end('Internal server error');
        }
      });

      // POST ハンドラー: コメント、お問い合わせ、ご相談ポスト
      server.middlewares.use('/api', async (req, res, next) => {
        // CORS ヘッダー設定
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

          // ===== コメント API =====
          if (req.url?.startsWith('/comments')) {
            // GET: 記事のコメント取得
            if (req.method === 'GET') {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const articleTitle = url.searchParams.get('article') || url.searchParams.get('article_title');
              const password = url.searchParams.get('password');
              const all = url.searchParams.get('all') === 'true';

              try {
                if (all && password) {
                  // 管理者: すべてのコメント取得
                  const expectedPassword = process.env.ADMIN_PASSWORD;
                  console.log(`[API] Password check - received: "${password}", expected: "${expectedPassword}", match: ${password === expectedPassword}`);
                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  const result = await (db as Client).execute({
                    sql: 'SELECT id, article_title, name, message, approved, created_at FROM comments ORDER BY created_at DESC',
                  });
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify(result.rows));
                  console.log('[API] ✓ GET /api/comments (admin)');
                } else if (articleTitle) {
                  // 通常: 承認済みコメント取得
                  const result = await (db as Client).execute({
                    sql: 'SELECT id, article_title, name, message, created_at FROM comments WHERE article_title = ? AND approved = 1 ORDER BY created_at DESC',
                    args: [articleTitle],
                  });
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify(result.rows));
                  console.log(`[API] ✓ GET /api/comments?article=${articleTitle}`);
                } else {
                  res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'article parameter required' }));
                }
              } catch (error: any) {
                console.error('[API] ✗ GET Error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // POST: コメント投稿
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { article_title, name, message } = data;

                  if (!article_title || !name || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'article_title, name, and message are required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'INSERT INTO comments (article_title, name, message) VALUES (?, ?, ?)',
                    args: [article_title, name, message],
                  });

                  console.log(`[API] ✓ Comment saved to Turso - article: "${article_title}"`);
                  res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ POST Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }

            // PATCH: コメント承認/非承認
            if (req.method === 'PATCH') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { id, approved, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!id || approved === undefined) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'id and approved are required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'UPDATE comments SET approved = ? WHERE id = ?',
                    args: [approved ? 1 : 0, id],
                  });

                  console.log(`[API] ✓ Comment ${approved ? 'approved' : 'unapproved'} - id: ${id}`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ PATCH Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }

            // DELETE: コメント削除
            if (req.method === 'DELETE') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { id, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!id) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'id is required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'DELETE FROM comments WHERE id = ?',
                    args: [id],
                  });

                  console.log(`[API] ✓ Comment deleted from Turso - id: ${id}`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true, message: 'Comment deleted' }));
                } catch (error: any) {
                  console.error('[API] ✗ DELETE Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }
          }

          // ===== お問い合わせ API =====
          if (req.url?.startsWith('/contacts')) {
            // GET: お問い合わせ取得
            if (req.method === 'GET') {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const password = url.searchParams.get('password');

              try {
                const expectedPassword = process.env.ADMIN_PASSWORD;
                if (password !== expectedPassword) {
                  res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Unauthorized' }));
                  return;
                }

                const result = await (db as Client).execute({
                  sql: 'SELECT id, name, furigana, email, message, created_at FROM contacts ORDER BY created_at DESC',
                });

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result.rows));
                console.log('[API] ✓ GET /api/contacts');
              } catch (error: any) {
                console.error('[API] ✗ GET Error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // POST: お問い合わせ送信
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { name, furigana, email, message } = data;

                  if (!name || !email || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'name, email, and message are required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'INSERT INTO contacts (name, furigana, email, message) VALUES (?, ?, ?, ?)',
                    args: [name, furigana || null, email, message],
                  });

                  console.log(`[API] ✓ Contact saved to Turso - email: "${email}"`);
                  res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ POST Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }

            // DELETE: お問い合わせ削除
            if (req.method === 'DELETE') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { id, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!id) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'id is required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'DELETE FROM contacts WHERE id = ?',
                    args: [id],
                  });

                  console.log(`[API] ✓ Contact deleted from Turso - id: ${id}`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true, message: 'Contact deleted' }));
                } catch (error: any) {
                  console.error('[API] ✗ DELETE Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }
          }

          // ===== ご相談ポスト API =====
          if (req.url?.startsWith('/posts')) {
            // GET: ポスト取得
            if (req.method === 'GET') {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const password = url.searchParams.get('password');
              const all = url.searchParams.get('all') === 'true';

              try {
                if (all && password) {
                  // 管理者: すべてのポスト取得
                  const expectedPassword = process.env.ADMIN_PASSWORD;
                    if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  const result = await (db as Client).execute({
                    sql: 'SELECT id, name, subject, content, ip_address, approved, created_at FROM posts ORDER BY created_at DESC',
                  });
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify(result.rows));
                  console.log('[API] ✓ GET /api/posts (admin)');
                } else {
                  // 通常のポスト取得リクエスト（承認済みのみ）
                  const result = await (db as Client).execute({
                    sql: 'SELECT id, name, subject, content, created_at FROM posts WHERE approved = 1 ORDER BY created_at DESC',
                  });
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify(result.rows));
                  console.log('[API] ✓ GET /api/posts');
                }
              } catch (error: any) {
                console.error('[API] ✗ GET Error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // POST: ポスト投稿
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { name, subject, content, ip_address } = data;

                  if (!name || !subject || !content || !ip_address) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'name, subject, content, and ip_address are required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'INSERT INTO posts (name, subject, content, ip_address) VALUES (?, ?, ?, ?)',
                    args: [name, subject, content, ip_address],
                  });

                  console.log(`[API] ✓ Post saved to Turso - name: "${name}", subject: "${subject}"`);
                  res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ POST Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }

            // PATCH: ポスト承認/非承認
            if (req.method === 'PATCH') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { id, approved, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!id || approved === undefined) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'id and approved are required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'UPDATE posts SET approved = ? WHERE id = ?',
                    args: [approved ? 1 : 0, id],
                  });

                  console.log(`[API] ✓ Post ${approved ? 'approved' : 'unapproved'} - id: ${id}`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ PATCH Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }

            // DELETE: ポスト削除
            if (req.method === 'DELETE') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { id, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!id) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'id is required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'DELETE FROM posts WHERE id = ?',
                    args: [id],
                  });

                  console.log(`[API] ✓ Post deleted from Turso - id: ${id}`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true, message: 'Post deleted' }));
                } catch (error: any) {
                  console.error('[API] ✗ DELETE Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }
          }

          // ===== プロフィール API =====
          if (req.url?.startsWith('/profile')) {
            // GET: プロフィール取得
            if (req.method === 'GET') {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const password = url.searchParams.get('password');

              try {
                const expectedPassword = process.env.ADMIN_PASSWORD;
                  if (password !== expectedPassword) {
                  res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Unauthorized' }));
                  return;
                }

                const result = await (db as Client).execute({
                  sql: 'SELECT id, IMG_URL, Name, birthday, "From", Family, Job, hobby FROM profile LIMIT 1',
                });

                const profile = result.rows[0] || {
                  IMG_URL: '',
                  Name: '',
                  birthday: '',
                  From: '',
                  Family: '',
                  Job: '',
                  hobby: '',
                };

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(profile));
                console.log('[API] ✓ GET /api/profile');
              } catch (error: any) {
                console.error('[API] ✗ GET Error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // POST: プロフィール保存
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { Name, IMG_URL, birthday, From, Family, Job, hobby, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!Name || !IMG_URL || !birthday || !From || !Family || !Job || !hobby) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'All fields are required' }));
                    return;
                  }

                  // 既存のプロフィールを削除
                  await (db as Client).execute({ sql: 'DELETE FROM profile' });

                  // 新しいプロフィールを挿入
                  await (db as Client).execute({
                    sql: 'INSERT INTO profile (Name, IMG_URL, birthday, "From", Family, Job, hobby) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    args: [Name, IMG_URL, birthday, From, Family, Job, hobby],
                  });

                  console.log(`[API] ✓ Profile saved to Turso - name: "${Name}"`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ POST Profile Error:', error.message, 'Body:', body);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
                }
              });
              return;
            }
          }

          // ===== キャリア API =====
          if (req.url?.startsWith('/career')) {
            // GET: キャリア一覧取得
            if (req.method === 'GET') {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const password = url.searchParams.get('password');

              try {
                const expectedPassword = process.env.ADMIN_PASSWORD;
                  if (password !== expectedPassword) {
                  res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Unauthorized' }));
                  return;
                }

                const result = await (db as Client).execute({
                  sql: 'SELECT id, year, month, Content, Create_at FROM Career ORDER BY year DESC, month DESC',
                });

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result.rows || []));
              } catch (error: any) {
                console.error('[API] ✗ GET Career Error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // POST: キャリア追加
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { year, month, Content, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!year || !month || !Content) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'All fields are required' }));
                    return;
                  }

                  const result = await (db as Client).execute({
                    sql: 'INSERT INTO Career (year, month, Content) VALUES (?, ?, ?)',
                    args: [year, month, Content],
                  });

                  console.log(`[API] ✓ Career added to Turso - year: "${year}", month: "${month}"`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true, id: Number(result.lastInsertRowid) }));
                } catch (error: any) {
                  console.error('[API] ✗ POST Career Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }

            // DELETE: キャリア削除
            if (req.method === 'DELETE') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { id, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!id) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'ID is required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'DELETE FROM Career WHERE id = ?',
                    args: [id],
                  });

                  console.log(`[API] ✓ Career deleted from Turso - id: "${id}"`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ DELETE Career Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }
          }

          // ===== PDF API =====
          if (req.url?.startsWith('/pdfs')) {
            // GET: PDF一覧取得
            if (req.method === 'GET') {
              try {
                const result = await (db as Client).execute({
                  sql: 'SELECT id, title, description, file_path, file_name, created_at FROM PDFs ORDER BY created_at DESC',
                });

                console.log('[API] ✓ GET /api/pdfs');
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result.rows || []));
              } catch (error: any) {
                console.error('[API] ✗ GET PDFs Error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
              return;
            }

            // POST: PDF追加
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { title, description, file_path, file_name, file_data, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  console.log('[API] POST /api/pdfs - Received request:', { title, file_name, hasFileData: !!file_data });

                  if (password !== expectedPassword) {
                    console.warn('[API] ✗ Unauthorized POST to /pdfs');
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!title || !file_name) {
                    console.warn('[API] ✗ Missing required fields in /pdfs POST');
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'title and file_name are required' }));
                    return;
                  }

                  // ファイル保存ディレクトリ
                  const uploadsDir = path.join(process.cwd(), 'uploads');
                  console.log('[API] Uploads directory:', uploadsDir);
                  
                  // ディレクトリが存在しなければ作成
                  if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                    console.log('[API] ✓ Created uploads directory');
                  }

                  // Base64 データをデコードしてファイルに保存
                  if (file_data) {
                    try {
                      console.log('[API] Processing file_data - length:', file_data.length);
                      // Base64 データから binary data を抽出
                      const matches = file_data.match(/^data:application\/pdf;base64,(.+)$/);
                      if (!matches) {
                        throw new Error('Invalid PDF data format');
                      }
                      
                      const binaryData = Buffer.from(matches[1], 'base64');
                      const timestamp = Date.now();
                      const fileName = `pdf_${timestamp}_${file_name}`;
                      const filePath = path.join(uploadsDir, fileName);

                      // ファイルを書き込み
                      fs.writeFileSync(filePath, binaryData);
                      
                      console.log(`[API] ✓ PDF file saved: ${filePath}`);

                      // データベースに保存（実際のパスを保存）
                      await (db as Client).execute({
                        sql: 'INSERT INTO PDFs (title, description, file_path, file_name) VALUES (?, ?, ?, ?)',
                        args: [title, description || '', `/uploads/${fileName}`, file_name],
                      });

                      console.log(`[API] ✓ PDF added to Turso - title: "${title}"`);
                      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                      res.end(JSON.stringify({ success: true }));
                    } catch (fileError: any) {
                      console.error('[API] ✗ File save error:', fileError.message);
                      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                      res.end(JSON.stringify({ error: 'Failed to save PDF file: ' + fileError.message }));
                    }
                  } else {
                    // file_data がない場合
                    await (db as Client).execute({
                      sql: 'INSERT INTO PDFs (title, description, file_path, file_name) VALUES (?, ?, ?, ?)',
                      args: [title, description || '', file_path || '', file_name],
                    });

                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                  }
                } catch (error: any) {
                  console.error('[API] ✗ POST PDF Error:', error.message, 'Body:', body);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
                }
              });
              return;
            }

            // DELETE: PDF削除
            if (req.method === 'DELETE') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { id, password } = data;
                  const expectedPassword = process.env.ADMIN_PASSWORD;

                  if (password !== expectedPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                  }

                  if (!id) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'ID is required' }));
                    return;
                  }

                  await (db as Client).execute({
                    sql: 'DELETE FROM PDFs WHERE id = ?',
                    args: [id],
                  });

                  console.log(`[API] ✓ PDF deleted from Turso - id: "${id}"`);
                  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ success: true }));
                } catch (error: any) {
                  console.error('[API] ✗ DELETE PDF Error:', error.message);
                  res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
              return;
            }
          }

          // その他のリクエストは next() に委譲
          next();
        });
    },
  };
}
