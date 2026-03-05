"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();
  const [privacy, setPrivacy] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/data/static-texts.json");
      const data = await res.json();
      setPrivacy(data["privacy-policy"]);
    };

    fetchData();
  }, []);

  if (!privacy) return null;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "10px 20px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "20px" }}>
        {privacy.title}
      </h1>

      <p style={{ marginBottom: "10px", fontSize: "18px" }}>{privacy.text}</p>
      <p style={{ marginBottom: "30px", fontSize: "18px" }}>{privacy.text2}</p>

      {privacy.privacy.map((section: any, index: number) => (
        <div key={index} style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px" }}>
            {section.title}
          </h2>

          {section.text && (
            <p style={{ marginBottom: "10px", fontSize: "18px" }}>{section.text}</p>
          )}

          {section.texts && (
            <ul style={{ paddingLeft: "20px", marginBottom: "10px", fontSize: "18px" }}>
              {section.texts.map((t: string, i: number) => (
                <li key={i} style={{ marginBottom: "5px" }}>
                  {t}
                </li>
              ))}
            </ul>
          )}

          {section.text2 && (
            <p style={{ fontSize: "18px", marginTop: "10px", lineHeight: "1.8" }}>
              {section.text2}
            </p>
          )}
        </div>
      ))}

      {/* 🔽 戻るボタン */}
      <div style={{ textAlign: "center", marginTop: "60px" }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "18px 72px",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          戻る
        </button>
      </div>
    </div>
  );
}