"use client";

export default function TopPageEdit() {
  return (
    <div id="top-page-edit" className="tab-content">
      <div className="card">
        <h2>トップページ編集</h2>
        <p>画像、住所、SNSリンクなどの基本情報を編集します。</p>

        <div style={{ marginTop: "20px" }}>
          <a
            href="/test-top.html"
            target="_blank"
            rel="noopener noreferrer"
            className="login-button"
            style={{
              display: "inline-block",
              textDecoration: "none",
              color: "white",
              backgroundColor: "#010101",
             }}
              >
              別タブで編集画面を開く
          </a>
        </div>

        <iframe
          src="/test-top.html"
          style={{
            width: "100%",
            height: "800px",
            border: "1px solid #dfdede",
            borderRadius: "8px",
            marginTop: "20px",
          }}
        ></iframe>
      </div>
    </div>
  );
}