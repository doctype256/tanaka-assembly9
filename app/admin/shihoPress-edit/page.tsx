"use client";

import React, { useEffect, useState } from "react";

type PDFItem = {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_name: string;
  created_at: string;
};

export default function PDFManager() {
  const [pdfs, setPDFs] = useState<PDFItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });

  // =========================================
  // GET: PDF 一覧取得
  // =========================================
  const fetchPDFs = async () => {
    try {
      const res = await fetch("/api/pdfs");
      const data = await res.json();
      setPDFs(data || []);
    } catch (err: any) {
      alert("PDF取得に失敗しました: " + err.message);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  // =========================================
  // ファイル選択
  // =========================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, file: e.target.files[0] });
    }
  };

  // =========================================
  // PDFアップロード
  // =========================================
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.file) {
      alert("タイトルの入力、またはファイルを選択が必要です。");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("file", form.file);
      formData.append("created_at", new Date().toISOString());

      const res = await fetch("/api/pdfs", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "アップロード失敗");

      alert("PDFをアップロードしました");
      setForm({ title: "", description: "", file: null });
      fetchPDFs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  // =========================================
  // PDF削除
  // =========================================
  const handleDelete = async (id: number) => {
    if (!confirm("このPDFを削除しますか？")) return;

    try {
      const res = await fetch("/api/pdfs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "削除失敗");

      alert("PDFを削除しました");
      fetchPDFs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
      <h2 style={{ fontSize: 28, marginBottom: 20 }}>ShihoPress管理</h2>

      {/* PDFアップロードフォーム */}
      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
        <input
          type="text"
          placeholder="タイトル"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="説明"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={inputStyle}
        />
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button type="submit" disabled={uploading} style={primaryButton}>
          {uploading ? "アップロード中..." : "アップロード"}
        </button>
      </form>

      {/* PDF一覧 */}
      <h3 style={{ fontSize: 22, marginBottom: 10 }}>PDF一覧</h3>
      {pdfs.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pdfs.map((pdf) => (
            <li key={pdf.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: 5 }}>
              <a href={pdf.file_path} target="_blank" rel="noopener noreferrer">
                {pdf.title} ({pdf.file_name})
              </a>
              <button onClick={() => handleDelete(pdf.id)} style={deleteButton}>削除</button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#666" }}>PDFがまだアップロードされていません</p>
      )}
    </div>
  );
}

// -------------------- Styles --------------------
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  fontSize: "16px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const primaryButton: React.CSSProperties = {
  padding: "14px",
  backgroundColor: "#3182CE",
  color: "white",
  borderRadius: "8px",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
};

const deleteButton: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#E53E3E",
  color: "white",
  borderRadius: "4px",
  border: "none",
  fontSize: "12px",
  cursor: "pointer",
};