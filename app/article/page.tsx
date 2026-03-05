// app/article/page.tsx
import { notFound } from 'next/navigation';
import db from '@/db/client';


export default async function ArticleDetailPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id;
  if (!id) return notFound();

  // DBから記事を取得
  const result = await db.execute(`
    SELECT id, category, title, year, items, photos FROM activity_reports WHERE id = ?;
  `, [id]);

  if (!result.rows.length) return notFound();
  const article = result.rows[0];
  const items = JSON.parse(article.items);
  const photos = article.photos ? JSON.parse(article.photos) : [];

  return (
    <main className="container">
      <article className="article-content-wrapper">
        <div className="article-meta-area">
          <div className="period">{article.year}</div>
        </div>
        <h1 className="article-detail-title">{article.title}</h1>
        <div className="article-detail-body">
          {items.map((item: string, i: number) => (
            <p key={i}>{item}</p>
          ))}
        </div>
        <div className="article-detail-photos">
          {photos.map((photo: string, i: number) => (
            <img key={i} src={`/${photo}`} alt={article.title} />
          ))}
        </div>
        <div className="back-link-area">
          <a href="/policy" className="back-button">活動報告一覧へ戻る</a>
        </div>
      </article>
    </main>
  );
}