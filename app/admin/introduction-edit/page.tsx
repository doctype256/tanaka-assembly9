"use client";

import React, { useEffect, useState } from "react";

type Career = {
  id: number;
  year: string;
  month: string;
  Content: string;
};

type Profile = {
  id?: number;
  Name: string;
  IMG_URL: string;
  birthday: string | null;
  From: string | null;
  Family: string | null;
  Job: string | null;
  hobby: string | null;
  updated_at?: string | null;
  careers?: Career[];
};

export default function ProfileEdit() {
  const [profile, setProfile] = useState<Profile>({
    Name: "",
    IMG_URL: "",
    birthday: null,
    From: null,
    Family: null,
    Job: null,
    hobby: null,
    careers: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [careerForm, setCareerForm] = useState({ year: "", month: "", Content: "" });

  // =========================================
  // GET: プロフィール取得＋経歴取得
  // =========================================
  const fetchProfile = async () => {
    try {
      const resProfile = await fetch("/api/profile");
      const dataProfile = await resProfile.json();
      if (!resProfile.ok) throw new Error(dataProfile.error || "プロフィール取得失敗");

      // 経歴取得
      const resCareer = await fetch("/api/career");
      const dataCareer = await resCareer.json();
      if (!resCareer.ok) throw new Error(dataCareer.error || "経歴取得失敗");

      // 年・月で降順にソート
      const sortedCareers = (dataCareer || []).sort((a: Career, b: Career) => {
        if (b.year !== a.year) return parseInt(b.year) - parseInt(a.year);
        return parseInt(b.month) - parseInt(a.month);
      });

      setProfile({ ...dataProfile, careers: sortedCareers });
      setPreview(dataProfile.IMG_URL || "");
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =========================================
  // 画像アップロード
  // =========================================
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "profile");

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "アップロード失敗");

      setProfile((prev) => ({ ...prev, IMG_URL: data.url }));
      setPreview(data.url);
    } catch (err: any) {
      alert("画像アップロードに失敗しました: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // =========================================
  // プロフィール保存
  // =========================================
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗");
      alert("プロフィールを保存しました");
      fetchProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // 経歴追加
  // =========================================
  const handleCareerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const year = careerForm.year.trim();
    const month = careerForm.month.trim();
    const Content = careerForm.Content.trim();

    if (!year || !month || !Content) {
      alert("年・月・内容をすべて入力してください");
      return;
    }

    try {
      // API の期待するキーに変換
      const body = {
        year,
        month,
        Content,
      };

    const res = await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "経歴追加失敗");

    alert("経歴を追加しました");
    setCareerForm({ year: "", month: "", Content: "" });
    fetchProfile();
  } catch (err: any) {
    alert(err.message);
  }
};

  // =========================================
  // 経歴削除
  // =========================================
  const handleCareerDelete = async (id: number) => {
    if (!confirm("この経歴を削除しますか？")) return;

    try {
      const res = await fetch("/api/career", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "削除失敗");
      alert("経歴を削除しました");
      fetchProfile();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
      <h2 style={{ fontSize: 28, marginBottom: 20 }}>自己紹介編集</h2>

      {profile.updated_at && (
        <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
          最終更新: {new Date(profile.updated_at).toLocaleString()}
        </p>
      )}

      {/* プロフィール編集フォーム */}
      <form
        onSubmit={handleProfileSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}
      >
        <div>
          <label>名前</label>
          <input
            type="text"
            value={profile.Name}
            onChange={(e) => setProfile({ ...profile, Name: e.target.value })}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label>写真</label>
          <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
          <div
            style={{
              marginTop: 10,
              minHeight: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #ccc",
              background: "#f9f9f9",
            }}
          >
            {preview ? (
              <img src={preview} alt="プレビュー" style={{ maxWidth: "100%", maxHeight: 200 }} />
            ) : (
              <span style={{ color: "#999" }}>画像がアップロードされるとここに表示されます</span>
            )}
          </div>
        </div>

        <div>
          <label>生年月日</label>
          <input
            type="text"
            value={profile.birthday || ""}
            onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
            placeholder="例：1994年7月21日"
            style={inputStyle}
          />
        </div>

        <div>
          <label>出身地</label>
          <input
            type="text"
            value={profile.From || ""}
            onChange={(e) => setProfile({ ...profile, From: e.target.value })}
            placeholder="例：京都市"
            style={inputStyle}
          />
        </div>

        <div>
          <label>家族構成</label>
          <input
            type="text"
            value={profile.Family || ""}
            onChange={(e) => setProfile({ ...profile, Family: e.target.value })}
            placeholder="例：夫・子ども2人"
            style={inputStyle}
          />
        </div>

        <div>
          <label>前職</label>
          <input
            type="text"
            value={profile.Job || ""}
            onChange={(e) => setProfile({ ...profile, Job: e.target.value })}
            placeholder="例：ICU看護師"
            style={inputStyle}
          />
        </div>

        <div>
          <label>趣味・特技</label>
          <input
            type="text"
            value={profile.hobby || ""}
            onChange={(e) => setProfile({ ...profile, hobby: e.target.value })}
            placeholder="例：ボランティア活動"
            style={inputStyle}
          />
        </div>

        <button type="submit" disabled={loading || uploading} style={primaryButton}>
          {loading ? "保存中..." : "保存"}
        </button>
      </form>

      {/* 経歴追加フォーム */}
      <h3 style={{ fontSize: 22, marginBottom: 20 }}>経歴追加</h3>
      <form
        onSubmit={handleCareerSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 15, marginBottom: 30 }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            placeholder="年"
            value={careerForm.year}
            onChange={(e) => setCareerForm({ ...careerForm, year: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="月"
            value={careerForm.month}
            onChange={(e) => setCareerForm({ ...careerForm, month: e.target.value })}
            style={inputStyle}
          />
        </div>
        <input
          type="text"
          placeholder="内容"
          value={careerForm.Content}
          onChange={(e) => setCareerForm({ ...careerForm, Content: e.target.value })}
          style={inputStyle}
        />
        <button type="submit" style={secondaryButton}>
          経歴追加
        </button>
      </form>

      {/* 経歴一覧 */}
      <h3 style={{ fontSize: 22, marginBottom: 10 }}>経歴一覧</h3>
      {profile.careers && profile.careers.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {profile.careers.map((c) => (
            <li
              key={c.id}
              style={{
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #ccc",
                paddingBottom: 5,
              }}
            >
              <span>
                {c.year}年 {c.month}月：{c.Content}
              </span>
              <button onClick={() => handleCareerDelete(c.id)} style={deleteButton}>
                削除
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#666" }}>経歴がまだ追加されていません</p>
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

const secondaryButton: React.CSSProperties = {
  padding: "12px",
  backgroundColor: "#38A169",
  color: "white",
  borderRadius: "6px",
  border: "none",
  fontSize: "14px",
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