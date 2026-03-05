import './style.css';
// ----------------------------------------------------
// SVGアイコンの定数定義
// ----------------------------------------------------
// 1. 憑依解放（翼のある十字架）
const ICON_PURIFICATION = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 mx-auto">
        <path d="M11.5 12.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zM9 16.25h6a.75.75 0 000-1.5H9a.75.75 0 000 1.5z"/>
        <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 18a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5zm-5.69-7.86a.75.75 0 00-.91 1.29l1.455 1.011a.75.75 0 00.91-1.29L6.31 12.39zM18.38 12.39a.75.75 0 00-.91 1.29l1.455 1.011a.75.75 0 00.91-1.29l-1.455-1.011zM12 4.5a.75.75 0 00-.75.75V9h1.5V5.25a.75.75 0 00-.75-.75z" clip-rule="evenodd" />
    </svg>
`;
// 2. 悪しき契約の破棄（炎に包まれた蛇）
const ICON_CONTRACT = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 mx-auto">
        <path fill-rule="evenodd" d="M12 1.5c-4.142 0-7.5 3.358-7.5 7.5S7.858 16.5 12 16.5c2.404 0 4.58-1.127 6-2.915.018-.024.037-.047.056-.07A.75.75 0 0018 13.5v-1.25a.75.75 0 00-1.5 0v1.171c-1.35 1.637-3.374 2.654-5.55 2.654-3.692 0-6.75-2.617-6.75-5.875S8.308 3.125 12 3.125c2.56 0 4.793 1.547 5.86 3.861.12.261.217.535.29.822a.75.75 0 001.488-.363 8.355 8.355 0 00-.334-1.296C17.447 3.5 14.896 1.5 12 1.5zm.75 18a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0v-2.25zM15 19.5a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0v-2.25zM18 19.5a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0v-2.25z" clip-rule="evenodd" />
        <path d="M12 1.5c-4.142 0-7.5 3.358-7.5 7.5S7.858 16.5 12 16.5c2.404 0 4.58-1.127 6-2.915.018-.024.037-.047.056-.07A.75.75 0 0018 13.5v-1.25a.75.75 0 00-1.5 0v1.171c-1.35 1.637-3.374 2.654-5.55 2.654-3.692 0-6.75-2.617-6.75-5.875S8.308 3.125 12 3.125c2.56 0 4.793 1.547 5.86 3.861.12.261.217.535.29.822a.75.75 0 001.488-.363 8.355 8.355 0 00-.334-1.296C17.447 3.5 14.896 1.5 12 1.5z" />
    </svg>
`;
// 3. 古代言語の解析と解読（開かれた古書と目）
const ICON_LANGUAGE = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 mx-auto">
        <path d="M21.75 6.75v10.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5h16.5a1.5 1.5 0 011.5 1.5z" />
        <path d="M12 9a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H12zm2.992 0H14.25a.75.75 0 000 1.5h.742a.75.75 0 000-1.5zM9 9a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H9zM12 12.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
    </svg>
`;
const ICONS = [
    ICON_PURIFICATION,
    ICON_CONTRACT,
    ICON_LANGUAGE,
];
// ----------------------------------------------------
// ユーティリティ関数
// ----------------------------------------------------
// JSONファイルを読み込む（パスは /data/ から）
async function fetchJSON(fileName) {
    const filePath = `/data/${fileName}`;
    try {
        const response = await fetch(filePath);
        if (!response.ok)
            return null;
        return await response.json();
    }
    catch (_a) {
        return null;
    }
}
// ユーティリティ関数: HTML要素にテキストを挿入する
function insertText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        const htmlText = text.replace(/\|/g, '<br>');
        // HTML挿入後にCSSアニメーションが自動的に動作するよう、innerHTMLを使用
        element.innerHTML = htmlText;
    }
    else {
        console.warn(`⚠️ Warning: ID "${id}" の要素が見つかりません。HTML側にIDがあるか確認してください。`);
    }
}
// ----------------------------------------------------
// 1. 静的テキストの挿入処理
// ----------------------------------------------------
async function loadStaticTexts() {
    const data = await fetchJSON('static-texts.json');
    if (!data)
        return;
    // ヘッダー
    insertText('header-exorcist-name', data.header.exorcist_name);
    insertText('header-order-name', data.header.order_name);
    // ナビゲーションの動的生成
    const navContainer = document.getElementById('main-navigation');
    if (navContainer && data.navigation) {
        navContainer.innerHTML = data.navigation.map(item => `
            <a href="${item.href}" class="hover:text-red-300 transition duration-200 whitespace-nowrap">
                ${item.text}
            </a>
        `).join('');
    }
    // ヒーローセクション
    insertText('hero-title-line1', data.hero.title_line1);
    insertText('hero-title-line2', data.hero.title_line2);
    insertText('hero-subtitle', data.hero.subtitle);
    insertText('hero-button-consult', data.hero.button_consult);
    insertText('hero-button-credo', data.hero.button_credo);
    // サービスセクションのタイトル
    insertText('services-sub-title', data.services.sub_title);
    insertText('services-main-title-part1', data.services.main_title_part1);
    insertText('services-main-title-part2', data.services.main_title_part2);
    insertText('services-main-title-part3', data.services.main_title_part3);
    // サービスカードの動的生成
    const servicesContainer = document.getElementById('services-container');
    if (servicesContainer && data.services && data.services.items) {
        servicesContainer.innerHTML = data.services.items.map((item, index) => {
            const iconSvg = ICONS[index % 3];
            // サービスセクションは最初の3つしか使わないため index % 3 で対応可能
            return `
                <div class="bg-neutral-800 border-t-4 border-red-700 p-8 shadow-2xl transition duration-500 hover:bg-neutral-700/70 hover:shadow-red-900/50">
                    <div class="text-red-400 text-4xl mb-4 text-center">
                        ${iconSvg}
                    </div>
                    <h4 class="text-2xl font-serif font-bold mb-4">${item.title}</h4>
                    <p class="text-gray-400 mb-6 font-sans text-sm">${item.desc}</p>
                    <a href="#consultation" class="inline-block text-red-300 font-bold border-b border-red-300 hover:text-white transition duration-200">
                        ${item.link_text}
                    </a>
                </div>
            `;
        }).join('');
    }
    // 経歴と教義セクションのタイトル
    insertText('credo-sub-title', data.credo.sub_title);
    insertText('credo-main-title-part1', data.credo.main_title_part1);
    insertText('credo-main-title-part2', data.credo.main_title_part2);
    insertText('credo-main-title-part3', data.credo.main_title_part3);
    // 経歴と教義の本文の動的生成
    const credoContentArea = document.getElementById('credo-content-area');
    if (credoContentArea && data.credo) {
        credoContentArea.innerHTML = `
            <h4 class="text-2xl font-serif font-bold text-red-300">${data.credo.history_title}</h4>
            <p class="text-gray-300">${data.credo.history_body}</p>

            <h4 class="text-2xl font-serif font-bold text-red-300 border-t pt-6 border-red-900/50">${data.credo.credo_title}</h4>
            <p class="text-gray-300">${data.credo.credo_body}</p>
            
            <a href="#credo" class="inline-block mt-4 text-white bg-red-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-red-800 transition duration-300 transform hover:scale-105">
                ${data.credo.button_text}
            </a>
        `;
    }
    // 解決事例セクションのタイトルとボタン
    insertText('cases-sub-title', data.cases.sub_title);
    insertText('cases-main-title-part1', data.cases.main_title_part1);
    insertText('cases-main-title-part2', data.cases.main_title_part2);
    insertText('cases-main-title-part3', data.cases.main_title_part3);
    insertText('cases-button-text', data.cases.button_text);
    // フッター
    insertText('footer-order-title', data.footer.order_title);
    insertText('footer-exorcist-info', data.footer.exorcist_info);
    insertText('footer-motto', data.footer.motto);
    insertText('footer-credo-link', data.footer.credo_link);
    insertText('footer-emergency-title', data.footer.emergency_title);
    insertText('footer-access-code', data.footer.access_code);
    insertText('footer-hotline', data.footer.hotline);
    insertText('footer-warning', data.footer.warning);
    insertText('footer-location-title', data.footer.location_title);
    insertText('footer-base', data.footer.base);
    insertText('footer-window', data.footer.window);
    insertText('footer-meeting', data.footer.meeting);
    insertText('footer-disclaimer-title', data.footer.disclaimer_title);
    insertText('footer-disclaimer-body', data.footer.disclaimer_body);
    insertText('footer-copyright', data.footer.copyright);
}
// ----------------------------------------------------
// 2. 解決事例の挿入処理 (動的生成)
// ----------------------------------------------------
async function loadCaseFiles() {
    const response = await fetch("/api/cases");
    const cases = await response.json();
    if (!cases)
        return;
    const container = document.getElementById('case-cards-container');
    if (!container) {
        console.warn(`⚠️ Warning: ID "case-cards-container" の要素が見つかりません。HTML要素を確認してください。`);
        return;
    }
    // データを使ってHTMLを動的に生成
    container.innerHTML = cases.map((caseFile, index) => {
        const iconSvg = ICONS[index % 3];
        return `
            <div class="bg-neutral-800 p-6 rounded-lg shadow-xl border-2 border-red-900 transition duration-300 hover:border-red-700">
                <div class="text-red-400 text-4xl mb-4 text-center">
                    ${iconSvg}
                </div>
                <h4 class="text-xl font-serif font-bold mb-3 text-red-300">
                    ${caseFile.title}
                </h4>
                <blockquote class="text-gray-400 italic mb-4 text-sm leading-relaxed border-l-4 border-red-700 pl-4">
                    ${caseFile.quote}
                </blockquote>
                <p class="text-sm font-sans font-bold text-white">
                    - ${caseFile.client_initials} (${caseFile.location})
                </p>
            </div>
        `;
    }).join('');
}
// ----------------------------------------------------
// 3. スムーズスクロール機能
// ----------------------------------------------------
function setupSmoothScroll() {
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.matches('a[href^="#"]'))
            return;
        const id = target.getAttribute('href');
        if (!id || id === '#')
            return;
        const element = document.querySelector(id);
        if (!element)
            return;
        e.preventDefault();
        element.scrollIntoView({ behavior: 'smooth' });
    });
}
// 4. アプリケーションのエントリーポイント
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOMContentLoaded: アプリケーションの開始");
    loadStaticTexts(); // 静的コンテンツの読み込み
    loadCaseFiles(); // 動的コンテンツ（事例）の読み込み
    setupSmoothScroll(); // スムーズスクロール機能の設定
    // ✅ Vercel Function 呼び出し（追加）
    fetch("/api/hello")
        .then(res => res.json())
        .then(data => {
        console.log("✅ API結果:", data);
    })
        .catch(err => {
        console.error("❌ APIエラー:", err);
    });
});
