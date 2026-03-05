"use client";

import React, { useEffect, useState } from "react";

type Report = {
  id: number;
  category: string;
  title: string;
  year: number;
  items: string[];
  photos: string[];
  updated_at?: string; // 最終更新時刻
};

export default function ActivityPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [category] = useState("活動報告"); // 固定
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [content, setContent] = useState(""); // 活動内容
  const [photos, setPhotos] = useState<string[]>([]); // Cloudinary URL
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // 編集中のID

  // 活動報告取得（最終更新順でソート）
  const fetchReports = async () => {
    const res = await fetch("/api/activity-reports");
    const data = await res.json();
    const sorted = (data.reports || []).sort(
      (a: Report, b: Report) =>
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    );
    setReports(sorted);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 画像アップロード
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("filename", file.name);
          formData.append("folder", "activity_reports");

          const res = await fetch("/api/upload-image", { method: "POST", body: formData });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || "Upload failed");
          return data.url;
        })
      );

      setPhotos((prev) => [...prev, ...urls]);
    } catch (error: any) {
      alert("画像アップロードに失敗しました: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // フォーム送信（新規 or 編集）
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("活動内容を入力してください");
      return;
    }

    setLoading(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = {
        category,
        title,
        year,
        items: [content],
        photos,
        ...(editingId ? { id: editingId } : {}),
      };

      const res = await fetch("/api/activity-reports", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setTitle("");
        setYear(new Date().getFullYear());
        setContent("");
        setPhotos([]);
        setEditingId(null);
        fetchReports();
      } else {
        const data = await res.json();
        alert(data.error || "保存に失敗しました");
      }
    } catch (error) {
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 編集ボタン
  const handleEdit = (report: Report) => {
    setEditingId(report.id);
    setTitle(report.title);
    setYear(report.year);
    setContent(report.items[0] || "");
    setPhotos(report.photos);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 削除
  const handleDelete = async (id: number) => {
    await fetch("/api/activity-reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchReports();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <h1 style={{ fontSize: 28, marginBottom: 30 }}>📝 活動報告編集</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <input type="hidden" value={category} />

        <input
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={inputStyle}
        />

        <textarea
          placeholder="活動内容を記入してください"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={textAreaStyle}
        />

        <label>
          画像を選択（複数可）:
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            disabled={uploading}
          />
        </label>

        {photos.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {photos.map((url, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img
                  src={url}
                  alt="アップロード画像"
                  style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
                />
                <button
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  style={removePhotoButton}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSubmit} style={primaryButton} disabled={loading || uploading}>
          {loading ? "保存中..." : editingId ? "更新する" : "保存する"}
        </button>
      </div>

      <hr style={{ margin: "50px 0" }} />

      <h2>登録済み活動報告</h2>

      {reports.map((r) => (
        <div key={r.id} style={cardStyle}>
          <h3>
            {r.title} ({r.year})
          </h3>
          <p style={{ fontSize: 12, color: "#718096" }}>
            最終更新: {r.updated_at ? new Date(r.updated_at).toLocaleString() : "-"}
          </p>
          {/* <p>カテゴリ: {r.category}</p> */}
          {/* 改行を反映 */}
          <p style={{ whiteSpace: "pre-wrap" }}>{r.items.join("\n")}</p>

          {r.photos.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {r.photos.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="報告写真"
                  style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
                />
              ))}
            </div>
          )}
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button onClick={() => handleEdit(r)} style={editButton}>
              編集
            </button>
            <button onClick={() => handleDelete(r.id)} style={deleteButton}>
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- CSS ---
const inputStyle: React.CSSProperties = {
  padding: "14px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "1px solid #ccc",
};

const textAreaStyle: React.CSSProperties = {
  padding: "14px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  minHeight: 120,
  resize: "vertical",
  whiteSpace: "pre-wrap", // textarea 内でも改行を保持
};

const primaryButton: React.CSSProperties = {
  padding: "14px",
  backgroundColor: "#3182CE",
  color: "white",
  borderRadius: "10px",
  border: "none",
  fontSize: "16px",
};

const deleteButton: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#E53E3E",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const editButton: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#38A169",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const removePhotoButton: React.CSSProperties = {
  position: "absolute",
  top: -8,
  right: -8,
  backgroundColor: "#E53E3E",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: 20,
  height: 20,
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E2E8F0",
  padding: 20,
  borderRadius: 12,
  marginTop: 20,
};