// header.js（修正版）

document.addEventListener('DOMContentLoaded', () => {
  fetch('data/static-texts.json')
    .then(res => res.json())
    .then(data => {

      /* ===== header name ===== */
      const headerName = document.getElementById('header-name');
      if (headerName && data.profile?.name) {
        
        const logoLink = document.createElement('a'); // 1. aタグを新しく作る
        logoLink.href ='index.html';  // 2. リンク先をトップページ（index.htmlなど）に設定
        logoLink.textContent = data.profile.name; // 3. テキストにJSONの名前を代入
        logoLink.classList.add('header-logo-link'); // 4. スタイル調整用にクラスを付ける（任意）
        headerName.innerHTML = '';  // 5. 元の要素の中身を空にしてから、aタグを追加
        headerName.appendChild(logoLink);
      }

      /* ===== header nav ===== */
   const headerNav = document.getElementById('header-nav');

headerNav.innerHTML = '';
data.navigation.forEach(n => {
  const a = document.createElement('a');
  a.href = n.href;
  a.textContent = n.text;

  // href ファイル名だけ取得
  let fileName = n.href.split('/').pop().replace('.html','').trim();
  let currentFileName = window.location.pathname.split('/').pop().replace('.html','').trim();

  // 補正マップ
  const pageMap = {
    index: 'top',
    'pdf-text': 'shihopress',
    profile: 'profile',
    policy: 'policy',
    contact: 'contact',
    post: 'post'
  };

  // 補正を適用
  const normalizedFileName = pageMap[fileName] || fileName;
  const normalizedCurrent = pageMap[currentFileName] || currentFileName;

  // 比較
  if (normalizedFileName === normalizedCurrent) {
    a.classList.add('active');
  }

  headerNav.appendChild(a);
});

// --- ここから【ご相談】リンクを最後に追加する処理 ---
const contactPost = document.createElement('a');
contactPost.href = '#'; // ページ遷移させない
contactPost.textContent = 'ご相談'; // 表示テキスト
contactPost.classList.add('nav-post-item'); // 専用のクラス（装飾用）

contactPost.onclick = (e) => {
  e.preventDefault();
  if (typeof window.openConsultationModal === 'function') {
    window.openConsultationModal(); // 上記スクリプトを呼び出す
  }
};

/*  20260304 午前の状態
// 現在のページが post.html だったら active クラスをつける
if (window.location.pathname.includes('post')) {
  contactPost.classList.add('active');
}
*/
headerNav.appendChild(contactPost);
// --- 追加処理ここまで ---





      /* ===== header nav が存在しない場合のエラーハンドリング ===== */

      /* ===== overlay 作成（誤タップ防止）===== */
      let overlay = document.getElementById('menu-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'menu-overlay';
        document.body.appendChild(overlay);
      }

      /* ===== hamburger control ===== */
      const toggle = document.getElementById('menu-toggle');
      if (toggle && headerNav) {
        toggle.addEventListener('click', e => {
          e.stopPropagation();
          headerNav.classList.toggle('open');
          overlay.classList.toggle('active');
        });
      }

      /* ===== header内クリックでは閉じない ===== */
      const header = document.querySelector('header');
      if (header) header.addEventListener('click', e => e.stopPropagation());

      /* ===== overlayクリックで閉じる ===== */
      overlay.addEventListener('click', () => {
        headerNav.classList.remove('open');
        overlay.classList.remove('active');
      });

      /* ===== ナビリンクを押したら閉じる ===== */
      headerNav.addEventListener('click', e => {
        if (e.target.tagName === 'A') {
          headerNav.classList.remove('open');
          overlay.classList.remove('active');
        }
      });

    })
    .catch(err => console.error('header.js error:', err));
});
