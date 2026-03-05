// app/api/posts/route.ts
import { NextResponse } from 'next/server';

const dummyPosts = [
  {
    id: "1",
    title: "テスト投稿",
    content: "これはテスト用の投稿です",
    createdAt: "2024-01-01T10:00:00"
  },
  {
    id: "2",
    title: "ダミーデータ",
    content: "投稿 API のテストです",
    createdAt: "2024-01-02T12:00:00"
  }
];

// GETリクエスト用の関数
export async function GET() {
  return NextResponse.json(dummyPosts);
}

// POSTリクエスト用の関数
export async function POST(request: Request) {
  const body = await request.json();
  const newItem = {
    id: String(Date.now()),
    ...body,
    createdAt: new Date().toISOString()
  };
  return NextResponse.json(newItem);
}

// DELETEリクエスト用の関数
export async function DELETE() {
  return NextResponse.json({ success: true });
}