/**
 * AdminManager クラス
 * 管理画面全体を管理するクラス
 */

import APIClient from './api.js';
import Utils from './utils.js';

/**
 * コメント管理クラス
 */
class CommentManager {
  api: APIClient;
  allComments: any[];
  filteredComments: any[];

  constructor(api: APIClient) {
    this.api = api;
    this.allComments = [];
    this.filteredComments = [];
  }

  /**
   * コメント一覧を取得
   */
  async fetchAll(password: string): Promise<any[]> {
    this.allComments = await this.api.getAllComments(password);
    this.filteredComments = this.allComments;
    return this.allComments;
  }

  /**
   * コメントを描画
   */
  renderComments(container: HTMLElement): void {
    if (this.filteredComments.length === 0) {
      container.innerHTML = Utils.getEmptyStateHtml('💬', 'コメントはありません');
      return;
    }

    const html = `
      <table class="comments-table">
        <thead>
          <tr>
            <th>記事タイトル</th>
            <th>投稿者</th>
            <th>コメント</th>
            <th>日時</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredComments.map(comment => `
            <tr>
              <td>${Utils.escapeHtml(comment.article_title)}</td>
              <td>${Utils.escapeHtml(comment.name)}</td>
              <td class="comment-message">${Utils.escapeHtml(comment.message)}</td>
              <td>${Utils.formatDateJP(comment.created_at)}</td>
              <td>
                <span class="approval-status ${comment.approved ? 'approved' : 'pending'}">
                  ${comment.approved ? '承認済み' : '保留中'}
                </span>
              </td>
              <td>
                <button 
                  class="${comment.approved ? 'unapprove-button' : 'approve-button'}" 
                  onclick="window.adminManager.toggleCommentApproval(${comment.id}, ${!comment.approved})">
                  ${comment.approved ? '不承認にする' : '承認する'}
                </button>
                <button class="delete-button" onclick="window.adminManager.deleteCommentHandler(${comment.id})">
                  削除
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  }

  /**
   * コメント承認ステータスを切り替え
   */
  async toggleApproval(id: number, approved: boolean, password: string): Promise<void> {
    await this.api.updateCommentApproval(id, approved, password);
    const comment = this.allComments.find(c => c.id === id);
    if (comment) comment.approved = approved;
    this.filteredComments = this.allComments.filter(c => c.id !== id || c);
  }

  /**
   * コメントを削除
   */
  async delete(id: number, password: string): Promise<void> {
    await this.api.deleteComment(id, password);
    this.allComments = this.allComments.filter(c => c.id !== id);
    this.filteredComments = this.allComments;
  }

  /**
   * コメントをフィルタリング
   */
  filter(articleTitle: string): void {
    if (!articleTitle) {
      this.filteredComments = this.allComments;
    } else {
      this.filteredComments = this.allComments.filter(c =>
        c.article_title.toLowerCase().includes(articleTitle.toLowerCase())
      );
    }
  }

  /**
   * 統計情報を取得
   */
  getStats(): { total: number; articles: number } {
    const uniqueArticles = new Set(this.allComments.map(c => c.article_title));
    return {
      total: this.allComments.length,
      articles: uniqueArticles.size,
    };
  }
}

/**
 * お問い合わせ管理クラス
 */
class ContactListManager {
  api: APIClient;
  allContacts: any[];
  filteredContacts: any[];

  constructor(api: APIClient) {
    this.api = api;
    this.allContacts = [];
    this.filteredContacts = [];
  }

  /**
   * お問い合わせ一覧を取得
   */
  async fetchAll(password: string): Promise<any[]> {
    this.allContacts = await this.api.getAllContacts(password);
    this.filteredContacts = this.allContacts;
    return this.allContacts;
  }

  /**
   * お問い合わせを描画
   */
  renderContacts(container: HTMLElement): void {
    if (this.filteredContacts.length === 0) {
      container.innerHTML = Utils.getEmptyStateHtml('📧', 'お問い合わせはありません');
      return;
    }

    const html = `
      <table class="comments-table">
        <thead>
          <tr>
            <th>お名前</th>
            <th>フリガナ</th>
            <th>メールアドレス</th>
            <th>お問い合わせ内容</th>
            <th>日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredContacts.map(contact => `
            <tr>
              <td>${Utils.escapeHtml(contact.name)}</td>
              <td>${Utils.escapeHtml(contact.furigana)}</td>
              <td>${Utils.escapeHtml(contact.email)}</td>
              <td class="comment-message">${Utils.escapeHtml(contact.message)}</td>
              <td>${Utils.formatDateJP(contact.created_at)}</td>
              <td>
                <button class="delete-button" onclick="window.adminManager.deleteContactHandler(${contact.id})">
                  削除
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  }

  /**
   * お問い合わせを削除
   */
  async delete(id: number, password: string): Promise<void> {
    await this.api.deleteContact(id, password);
    this.allContacts = this.allContacts.filter(c => c.id !== id);
    this.filteredContacts = this.allContacts;
  }

  /**
   * お問い合わせをフィルタリング
   */
  filter(email: string): void {
    if (!email) {
      this.filteredContacts = this.allContacts;
    } else {
      this.filteredContacts = this.allContacts.filter(c =>
        c.email.toLowerCase().includes(email.toLowerCase())
      );
    }
  }

  /**
   * 統計情報を取得
   */
  getStats(): { total: number } {
    return {
      total: this.allContacts.length,
    };
  }
}

/**
 * ご相談ポスト管理クラス
 */
class PostManager {
  api: APIClient;
  allPosts: any[];

  constructor(api: APIClient) {
    this.api = api;
    this.allPosts = [];
  }

  /**
   * ポスト一覧を取得
   */
  async fetchAll(password: string): Promise<any[]> {
    const response = await fetch('/api/posts?all=true&password=' + encodeURIComponent(password));
    if (!response.ok) throw new Error('Failed to fetch posts');
    this.allPosts = await response.json();
    return this.allPosts;
  }

  /**
   * ポストを描画
   */
  renderPosts(container: HTMLElement): void {
    if (this.allPosts.length === 0) {
      container.innerHTML = Utils.getEmptyStateHtml('📝', 'ポストはありません');
      return;
    }

    const html = `
      <div style="display: flex; flex-direction: column; gap: 15px;">
        ${this.allPosts.map(post => `
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: #f9f9f9;">
            <div style="margin-bottom: 10px;">
              <strong>相談者:</strong> ${post.name || '（未入力）'} | <strong>件名:</strong> ${post.subject || '（未入力）'}<br/>
              <strong>投稿日:</strong> ${new Date(post.created_at).toLocaleString('ja-JP')}<br/>
              <strong>ステータス:</strong> ${post.approved ? '<span style="color: green;">✓ 承認済み</span>' : '<span style="color: red;">✗ 未承認</span>'}
            </div>
            <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 3px;">
              <strong>相談内容:</strong><br/>
              ${post.content}
            </div>
            <div style="margin-bottom: 10px;">
              <label style="display: block; margin-bottom: 5px;"><strong>返信内容:</strong></label>
              <textarea 
                id="reply-${post.id}" 
                placeholder="返信内容を入力してください"
                style="width: 100%; min-height: 100px; padding: 8px; border: 1px solid #ccc; border-radius: 3px; font-family: inherit;"
              >${post.reply || ''}</textarea>
            </div>
            <div style="display: flex; gap: 10px;">
              <button 
                class="login-button" 
                style="flex: 1;"
                onclick="window.adminManager.savePostReplyAndApprove(${post.id})">
                返信を保存して承認
              </button>
              <button 
                class="login-button" 
                style="flex: 1; background-color: #666;"
                onclick="window.adminManager.savePostReply(${post.id})">
                返信を保存
              </button>
              <button class="delete-button" onclick="window.adminManager.deletePostHandler(${post.id})">削除</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.innerHTML = html;
  }

  /**
   * 承認ステータスを切り替え
   */
  async toggleApproval(id: number, approved: number, password: string): Promise<void> {
    const response = await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved, password })
    });
    if (!response.ok) throw new Error('Failed to update post');
  }

  /**
   * ポストに返信を保存
   */
  async saveReply(id: number, reply: string, password: string): Promise<void> {
    const response = await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reply, password })
    });
    if (!response.ok) throw new Error('Failed to save reply');
  }

  /**
   * ポストに返信を保存して承認
   */
  async saveReplyAndApprove(id: number, reply: string, password: string): Promise<void> {
    const response = await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reply, approved: 1, password })
    });
    if (!response.ok) throw new Error('Failed to save reply and approve post');
  }

  /**
   * ポストを削除
   */
  async delete(id: number, password: string): Promise<void> {
    const response = await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    if (!response.ok) throw new Error('Failed to delete post');
  }

  /**
   * 統計情報を取得
   */
  getStats(): { total: number; unapproved: number } {
    const unapproved = this.allPosts.filter(p => !p.approved).length;
    return {
      total: this.allPosts.length,
      unapproved: unapproved,
    };
  }
}

/**
 * プロフィール管理クラス
 */
class ProfileManager {
  api: APIClient;
  profile: any;
  originalProfile: any; // 編集前のデータを保持

  constructor(api: APIClient) {
    this.api = api;
    this.profile = null;
    this.originalProfile = null;
  }

  /**
   * プロフィール情報を取得
   */
  async fetch(password: string): Promise<any> {
    try {
      const response = await fetch(`/api/profile?password=${encodeURIComponent(password)}`);
      if (!response.ok) {
        console.error('[ProfileManager] fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch profile');
      }
      this.profile = await response.json();
      // 編集前のデータを深くコピーして保持
      this.originalProfile = JSON.parse(JSON.stringify(this.profile));
      console.log('[ProfileManager] Profile fetched:', this.profile);
      return this.profile;
    } catch (err) {
      console.error('[ProfileManager] fetch error:', err);
      throw err;
    }
  }

  /**
   * プロフィール情報を保存
   */
  async save(profileData: any, password: string): Promise<void> {
    console.log('[ProfileManager] Saving to API:', profileData);
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profileData, password })
    });
    if (!response.ok) throw new Error('Failed to save profile');
    // 保存成功後、編集前のデータを更新
    this.profile = JSON.parse(JSON.stringify(profileData));
    this.originalProfile = JSON.parse(JSON.stringify(profileData));
    console.log('[ProfileManager] Save response OK');
  }

  /**
   * フォームにデータを読み込む
   */
  loadForm(): void {
    if (!this.profile) return;
    
    (document.getElementById('profile-name') as HTMLInputElement).value = this.profile.Name || '';
    (document.getElementById('profile-birthday') as HTMLInputElement).value = this.profile.birthday || '';
    (document.getElementById('profile-from') as HTMLInputElement).value = this.profile.From || '';
    (document.getElementById('profile-family') as HTMLInputElement).value = this.profile.Family || '';
    (document.getElementById('profile-job') as HTMLInputElement).value = this.profile.Job || '';
    (document.getElementById('profile-hobby') as HTMLInputElement).value = this.profile.hobby || '';
    
    // 既存画像がある場合、プレビューを表示
    const imgUrl = this.profile.IMG_URL || '';
    console.log('[ProfileManager.loadForm] Current IMG_URL:', imgUrl);
    const previewImg = document.getElementById('profile-preview-img') as HTMLImageElement;
    const placeholder = document.getElementById('profile-preview-placeholder') as HTMLElement;
    
    if (imgUrl && imgUrl.trim()) {
      if (previewImg) {
        previewImg.src = imgUrl;
        previewImg.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
    } else {
      if (previewImg) previewImg.style.display = 'none';
      if (placeholder) placeholder.style.display = 'block';
    }
    
    // 現在の IMG_URL を hidden フィールドに保存
    (document.getElementById('profile-img-url') as HTMLInputElement).value = imgUrl;
    
    // 写真ファイル入力は初期値を設定しない（ユーザーが新規選択）
    const fileInput = document.getElementById('profile-img-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      console.log('[ProfileManager.loadForm] File input cleared');
    }
  }

  /**
   * フォームからデータを取得
   */
  getFormData(): any {
    return {
      Name: (document.getElementById('profile-name') as HTMLInputElement).value,
      IMG_URL: (document.getElementById('profile-img-url') as HTMLInputElement).value,
      birthday: (document.getElementById('profile-birthday') as HTMLInputElement).value,
      From: (document.getElementById('profile-from') as HTMLInputElement).value,
      Family: (document.getElementById('profile-family') as HTMLInputElement).value,
      Job: (document.getElementById('profile-job') as HTMLInputElement).value,
      hobby: (document.getElementById('profile-hobby') as HTMLInputElement).value,
    };
  }
}

/**
 * 経歴管理クラス
 */
class CareerManager {
  api: APIClient;
  careers: any[];

  constructor(api: APIClient) {
    this.api = api;
    this.careers = [];
  }

  /**
   * 経歴一覧を取得
   */
  async fetch(password: string): Promise<any[]> {
    const response = await fetch(`/api/career?password=${encodeURIComponent(password)}`);
    if (!response.ok) throw new Error('Failed to fetch careers');
    this.careers = await response.json();
    return this.careers;
  }

  /**
   * 経歴を追加
   */
  async add(year: string, month: string, content: string, password: string): Promise<void> {
    const response = await fetch('/api/career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, Content: content, password })
    });
    if (!response.ok) throw new Error('Failed to add career');
  }

  /**
   * 経歴を削除
   */
  async delete(id: number, password: string): Promise<void> {
    const response = await fetch('/api/career', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    if (!response.ok) throw new Error('Failed to delete career');
  }

  /**
   * 経歴一覧を表示
   */
  render(container: HTMLElement): void {
    if (this.careers.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #999;">経歴が登録されていません</p>';
      return;
    }

    const html = `
      <table class="comments-table">
        <thead>
          <tr>
            <th>年</th>
            <th>月</th>
            <th>内容</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.careers.map(career => `
            <tr>
              <td>${career.year}</td>
              <td>${career.month}</td>
              <td>${career.Content}</td>
              <td>
                <button class="delete-button" onclick="window.adminManager.deleteCareerHandler(${career.id})">削除</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  }
}

/**
 * 管理者ページメインクラス
 */
class AdminManager {
  api: APIClient;
  comments: CommentManager;
  contacts: ContactListManager;
  posts: PostManager;
  profile: ProfileManager;
  career: CareerManager;
  pdf: PDFManager;
  activityReports: ActivityReportManager;
  adminPassword: string | null;

  constructor() {
    this.api = new APIClient();
    this.comments = new CommentManager(this.api);
    this.contacts = new ContactListManager(this.api);
    this.posts = new PostManager(this.api);
    this.profile = new ProfileManager(this.api);
    this.career = new CareerManager(this.api);
    this.pdf = new PDFManager(this.api);
    this.activityReports = new ActivityReportManager(this.api);
    this.adminPassword = null;
  }

  /**
   * 初期化
   */
  initialize(): void {
    this.setupEventListeners();
    this.initializeTabs();
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners(): void {
    // ログインフォーム
    (document.getElementById('login-input') as HTMLFormElement).addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('logout-button')!.addEventListener('click', () => this.handleLogout());

    // コメントフィルター
    document.getElementById('filter-button')!.addEventListener('click', () => this.filterComments());
    document.getElementById('clear-filter')!.addEventListener('click', () => this.clearCommentFilter());
    (document.getElementById('filter-article') as HTMLInputElement).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.filterComments();
    });

    // お問い合わせフィルター
    document.getElementById('filter-contact-button')!.addEventListener('click', () => this.filterContacts());
    document.getElementById('clear-contact-filter')!.addEventListener('click', () => this.clearContactFilter());
    (document.getElementById('filter-contact-email') as HTMLInputElement).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.filterContacts();
    });

    // プロフィール編集フォーム
    (document.getElementById('profile-form') as HTMLFormElement).addEventListener('submit', (e) => this.handleProfileSave(e));
    
    // プロフィール画像ファイル選択時のイベント
    const fileInput = document.getElementById('profile-img-file') as HTMLInputElement;
    console.log('[Setup] fileInput element found:', !!fileInput);
    if (fileInput) {
      console.log('[Setup] Attaching change event listener to profile-img-file');
      fileInput.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        console.log('[FileInput] Change event fired');
        console.log('[FileInput] files property:', input.files);
        console.log('[FileInput] files length:', input.files?.length);
        if (input.files && input.files[0]) {
          const file = input.files[0];
          console.log('[FileInput] File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
          // ファイル選択時にプレビューを表示（ローカルデータURL）
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target!.result as string;
            console.log('[FileInput] FileReader loaded, dataUrl length:', dataUrl.length);
            this.updateImagePreview(dataUrl);
            console.log('[FileInput] Preview updated with local file');
          };
          reader.onerror = () => {
            console.error('[FileInput] FileReader error');
          };
          console.log('[FileInput] Calling readAsDataURL');
          reader.readAsDataURL(file);
        } else {
          console.log('[FileInput] No file selected - files[0] is undefined');
        }
      });
      console.log('[Setup] Change event listener attached successfully');
    } else {
      console.error('[Setup] profile-img-file element NOT FOUND');
    }

    // 経歴追加フォーム
    (document.getElementById('career-form') as HTMLFormElement).addEventListener('submit', (e) => this.handleCareerAdd(e));

    // PDF追加フォーム
    (document.getElementById('pdf-form') as HTMLFormElement).addEventListener('submit', (e) => this.handlePDFAdd(e));

    // 活動報告フォーム
    const activityReportForm = document.getElementById('activity-report-form') as HTMLFormElement;
    if (activityReportForm) {
      activityReportForm.addEventListener('submit', (e) => this.handleActivityReportAdd(e));
    }

    // 活動報告画像ファイル選択時のイベント
    const activityImageInput = document.getElementById('activity-report-image') as HTMLInputElement;
    if (activityImageInput) {
      activityImageInput.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
          const file = input.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target!.result as string;
            this.updateActivityReportImagePreview(dataUrl);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  /**
   * タブ切り替え処理
   */
  initializeTabs(): void {
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tabName = (button as HTMLElement).dataset.tab;

        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName!)!.classList.add('active');
      });
    });

    // 最初のタブをアクティブに
    (document.querySelector('.tab-button') as HTMLElement).classList.add('active');
    document.getElementById('comments-tab')!.classList.add('active');
  }

  /**
   * ログイン処理
   */
  async handleLogin(e: Event): Promise<void> {
    e.preventDefault();
    console.log('[Admin] ログイン処理が開始されました');
    const password = (document.getElementById('password') as HTMLInputElement).value;
    console.log('[Admin] パスワード入力値:', password ? `あり（${password.length}文字）` : 'なし');

    try {
      console.log('[Admin] API リクエストを送信中...');
      
      // 必須のデータセットをフェッチ
      const [comments, contacts, profile, career, pdf, activityReports] = await Promise.all([
        this.comments.fetchAll(password),
        this.contacts.fetchAll(password),
        this.profile.fetch(password),
        this.career.fetch(password),
        this.pdf.fetchAll(password),
        this.activityReports.fetch(password),
      ]);

      // posts はオプション（テーブルが存在しない場合もある）
      try {
        await this.posts.fetchAll(password);
        console.log('[Admin] posts データ取得成功');
      } catch (postsErr) {
        console.warn('[Admin] posts データ取得失敗（テーブルが存在しない可能性）:', postsErr);
        this.posts.allPosts = [];
      }

      console.log('[Admin] ログイン成功！');
      this.adminPassword = password;

      console.log('[Admin] Login successful!');
      Utils.showElement('login-form', false);
      Utils.showElement('admin-content', true);

      this.renderAllData();
      this.profile.loadForm();
      this.career.render(document.getElementById('career-list-container')!);
      this.pdf.render(document.getElementById('pdf-list-container')!);
      this.activityReports.render(document.getElementById('activity-reports-list-container')!);
    } catch (err) {
      console.error('[Admin] ログイン失敗:', (err as Error).message);
      console.error('[Admin] エラー詳細:', err);
      Utils.showMessage('login-error', 'パスワードが間違っています', 0);
    }
  }

  /**
   * ログアウト処理
   */
  handleLogout(): void {
    this.adminPassword = null;
    this.comments = new CommentManager(this.api);
    this.contacts = new ContactListManager(this.api);
    this.posts = new PostManager(this.api);
    this.profile = new ProfileManager(this.api);
    this.career = new CareerManager(this.api);
    this.activityReports = new ActivityReportManager(this.api);

    (document.getElementById('password') as HTMLInputElement).value = '';
    Utils.showElement('login-form', true);
    Utils.showElement('admin-content', false);
  }

  /**
   * すべてのデータを描画
   */
  renderAllData(): void {
    const commentsContainer = document.getElementById('comments-container')!;
    const contactsContainer = document.getElementById('contacts-container')!;
    const postsContainer = document.getElementById('posts-container')!;

    this.comments.renderComments(commentsContainer);
    this.contacts.renderContacts(contactsContainer);
    this.posts.renderPosts(postsContainer);
    this.updateStats();
  }

  /**
   * 統計情報を更新
   */
  updateStats(): void {
    const commentStats = this.comments.getStats();
    const contactStats = this.contacts.getStats();
    const postStats = this.posts.getStats();

    (document.getElementById('total-comments') as HTMLElement).textContent = commentStats.total.toString();
    (document.getElementById('article-count') as HTMLElement).textContent = commentStats.articles.toString();
    (document.getElementById('total-contacts') as HTMLElement).textContent = contactStats.total.toString();
    (document.getElementById('total-posts') as HTMLElement).textContent = postStats.total.toString();
    (document.getElementById('unapproved-posts') as HTMLElement).textContent = postStats.unapproved.toString();
  }

  /**
   * コメントをフィルタリング
   */
  filterComments(): void {
    const articleTitle = (document.getElementById('filter-article') as HTMLInputElement).value;
    this.comments.filter(articleTitle);
    this.comments.renderComments(document.getElementById('comments-container')!);
  }

  /**
   * コメントフィルターをクリア
   */
  clearCommentFilter(): void {
    (document.getElementById('filter-article') as HTMLInputElement).value = '';
    this.comments.filter('');
    this.comments.renderComments(document.getElementById('comments-container')!);
  }

  /**
   * お問い合わせをフィルタリング
   */
  filterContacts(): void {
    const email = (document.getElementById('filter-contact-email') as HTMLInputElement).value;
    this.contacts.filter(email);
    this.contacts.renderContacts(document.getElementById('contacts-container')!);
  }

  /**
   * お問い合わせフィルターをクリア
   */
  clearContactFilter(): void {
    (document.getElementById('filter-contact-email') as HTMLInputElement).value = '';
    this.contacts.filter('');
    this.contacts.renderContacts(document.getElementById('contacts-container')!);
  }

  /**
   * コメント承認ステータスを切り替え（公開メソッド）
   */
  async toggleCommentApproval(id: number, approved: boolean): Promise<void> {
    if (!this.adminPassword) return;

    try {
      await this.comments.toggleApproval(id, approved, this.adminPassword);
      this.comments.renderComments(document.getElementById('comments-container')!);
      Utils.showMessage('success-message', approved ? '承認しました' : '不承認にしました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message', 'ステータス更新に失敗しました', 3000);
    }
  }

  /**
   * コメント削除ハンドラー（公開メソッド）
   */
  async deleteCommentHandler(id: number): Promise<void> {
    if (!confirm('このコメントを削除しますか？')) return;
    if (!this.adminPassword) return;

    try {
      await this.comments.delete(id, this.adminPassword);
      this.comments.renderComments(document.getElementById('comments-container')!);
      this.updateStats();
      Utils.showMessage('success-message', '削除しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message', '削除に失敗しました', 3000);
    }
  }

  /**
   * お問い合わせ削除ハンドラー（公開メソッド）
   */
  async deleteContactHandler(id: number): Promise<void> {
    if (!confirm('このお問い合わせを削除しますか？')) return;
    if (!this.adminPassword) return;

    try {
      await this.contacts.delete(id, this.adminPassword);
      this.contacts.renderContacts(document.getElementById('contacts-container')!);
      this.updateStats();
      Utils.showMessage('success-message-contact', '削除しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-contact', '削除に失敗しました', 3000);
    }
  }

  /**
   * ポスト承認ステータスを切り替え（公開メソッド）
   */
  async togglePostApproval(id: number, approved: number): Promise<void> {
    if (!this.adminPassword) return;

    try {
      await this.posts.toggleApproval(id, approved, this.adminPassword);
      await this.posts.fetchAll(this.adminPassword);
      this.posts.renderPosts(document.getElementById('posts-container')!);
      this.updateStats();
      Utils.showMessage('success-message-posts', approved ? '承認しました' : '不承認にしました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-posts', 'ステータス更新に失敗しました', 3000);
    }
  }

  /**
   * ポスト返信保存ハンドラー（公開メソッド）
   */
  async savePostReply(id: number): Promise<void> {
    if (!this.adminPassword) return;

    try {
      const replyText = (document.getElementById(`reply-${id}`) as HTMLTextAreaElement).value;
      if (!replyText || !replyText.trim()) {
        Utils.showMessage('error-message-posts', '返信内容を入力してください', 3000);
        return;
      }

      await this.posts.saveReply(id, replyText, this.adminPassword);
      await this.posts.fetchAll(this.adminPassword);
      this.posts.renderPosts(document.getElementById('posts-container')!);
      Utils.showMessage('success-message-posts', '返信を保存しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-posts', '保存に失敗しました', 3000);
    }
  }

  /**
   * ポスト返信保存して承認ハンドラー（公開メソッド）
   */
  async savePostReplyAndApprove(id: number): Promise<void> {
    if (!this.adminPassword) return;

    try {
      const replyText = (document.getElementById(`reply-${id}`) as HTMLTextAreaElement).value;
      if (!replyText || !replyText.trim()) {
        Utils.showMessage('error-message-posts', '返信内容を入力してください', 3000);
        return;
      }

      await this.posts.saveReplyAndApprove(id, replyText, this.adminPassword);
      await this.posts.fetchAll(this.adminPassword);
      this.posts.renderPosts(document.getElementById('posts-container')!);
      this.updateStats();
      Utils.showMessage('success-message-posts', '返信を保存して承認しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-posts', '保存に失敗しました', 3000);
    }
  }

  /**
   * ポスト削除ハンドラー（公開メソッド）
   */
  async deletePostHandler(id: number): Promise<void> {
    if (!confirm('このポストを削除しますか？')) return;
    if (!this.adminPassword) return;

    try {
      await this.posts.delete(id, this.adminPassword);
      await this.posts.fetchAll(this.adminPassword);
      this.posts.renderPosts(document.getElementById('posts-container')!);
      this.updateStats();
      Utils.showMessage('success-message-posts', '削除しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-posts', '削除に失敗しました', 3000);
    }
  }

  /**
   * 画像プレビューを更新
   */
  updateImagePreview(imgUrl: string): void {
    const previewImg = document.getElementById('profile-preview-img') as HTMLImageElement;
    const placeholder = document.getElementById('profile-preview-placeholder') as HTMLElement;
    
    if (imgUrl && imgUrl.trim()) {
      previewImg.src = imgUrl;
      previewImg.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    } else {
      previewImg.style.display = 'none';
      if (placeholder) placeholder.style.display = 'block';
    }
  }

  /**
   * プロフィール保存ハンドラー
   */
  async handleProfileSave(e: Event): Promise<void> {
    console.log('[handleProfileSave] CALLED - Form submission detected');
    e.preventDefault();
    if (!this.adminPassword) {
      console.error('[handleProfileSave] No admin password');
      return;
    }

    try {
      // ファイル入力を確認
      const fileInput = document.getElementById('profile-img-file') as HTMLInputElement;
      console.log('[handleProfileSave] fileInput element:', fileInput);
      console.log('[handleProfileSave] fileInput.files:', fileInput?.files);
      console.log('[handleProfileSave] fileInput.files[0]:', fileInput?.files?.[0]);
      
      let imgUrl = (document.getElementById('profile-img-url') as HTMLInputElement).value;

      console.log('[handleProfileSave] Starting...', { 
        hasFile: !!fileInput?.files?.[0], 
        fileName: fileInput?.files?.[0]?.name,
        fileSize: fileInput?.files?.[0]?.size,
        currentUrl: imgUrl,
        adminPassword: !!this.adminPassword
      });

      // 新しいファイルが選択されている場合はアップロード
      if (fileInput?.files && fileInput.files[0]) {
        console.log('[handleProfileSave] ✓ File IS selected!', fileInput.files[0].name);
        console.log('[handleProfileSave] File selected:', fileInput.files[0].name, 'size:', fileInput.files[0].size);
        Utils.showMessage('success-message-profile', '写真をアップロード中...', 0);
        console.log('[handleProfileSave] Calling uploadImageToCloudinary...');
        try {
          console.log('[handleProfileSave] Calling uploadImageToCloudinary with file:', fileInput.files[0].name, 'folder: profiles');
          imgUrl = await this.uploadImageToCloudinary(fileInput.files[0], 'profiles');
          console.log('[handleProfileSave] Upload complete! Result:', imgUrl);
          (document.getElementById('profile-img-url') as HTMLInputElement).value = imgUrl;
          // プレビューを更新
          this.updateImagePreview(imgUrl);
        } catch (uploadErr) {
          console.error('[handleProfileSave] Upload error:', uploadErr);
          const errorMsg = (uploadErr as Error).message;
          console.error('[handleProfileSave] Error message:', errorMsg);
          alert(`✗ アップロード失敗：${errorMsg}`);
          Utils.showMessage('error-message-profile', 'ファイルのアップロードに失敗しました: ' + errorMsg, 3000);
          return;
        }
      } else {
        console.log('[handleProfileSave] ✗ NO FILE selected - using existing URL:', imgUrl);
      }

      // 必須フィールドの確認
      const name = (document.getElementById('profile-name') as HTMLInputElement).value;
      const birthday = (document.getElementById('profile-birthday') as HTMLInputElement).value;
      const from = (document.getElementById('profile-from') as HTMLInputElement).value;
      const family = (document.getElementById('profile-family') as HTMLInputElement).value;
      const job = (document.getElementById('profile-job') as HTMLInputElement).value;
      const hobby = (document.getElementById('profile-hobby') as HTMLInputElement).value;

      console.log('[ProfileSave] Form data:', { name, imgUrl, birthday, from, family, job, hobby });

      // 空白フィールドは既存データで埋める
      const finalData = {
        Name: name || (this.profile.profile?.Name || ''),
        IMG_URL: imgUrl || (this.profile.profile?.IMG_URL || ''),
        birthday: birthday || (this.profile.profile?.birthday || ''),
        From: from || (this.profile.profile?.From || ''),
        Family: family || (this.profile.profile?.Family || ''),
        Job: job || (this.profile.profile?.Job || ''),
        hobby: hobby || (this.profile.profile?.hobby || ''),
      };

      console.log('[ProfileSave] Original profile data:', this.profile.profile);
      console.log('[ProfileSave] Final merged data:', finalData);

      // 最終的に必須項目がすべて揃っているか確認
      if (!finalData.Name || !finalData.birthday || !finalData.From || !finalData.Family || !finalData.Job || !finalData.hobby) {
        Utils.showMessage('error-message-profile', '必須項目（氏名、生年月日、出身地、家族構成、前職、趣味）が不足しています', 3000);
        console.error('[ProfileSave] Missing required fields after merging with original data');
        return;
      }

      // 画像URLがない場合は既存のものを使用するか、デフォルト値を使用
      if (!finalData.IMG_URL) {
        finalData.IMG_URL = 'assets/自己紹介.png'; // デフォルト画像
        console.log('[ProfileSave] No image URL, using default image:', finalData.IMG_URL);
      }

      console.log('[ProfileSave] Final data before saving:', finalData);

      const profileData = {
        Name: finalData.Name,
        IMG_URL: finalData.IMG_URL,
        birthday: finalData.birthday,
        From: finalData.From,
        Family: finalData.Family,
        Job: finalData.Job,
        hobby: finalData.hobby,
      };

      console.log('[ProfileSave] Saving to API:', profileData);
      await this.profile.save(profileData, this.adminPassword);
      console.log('[ProfileSave] Save successful');
      Utils.showMessage('success-message-profile', 'プロフィール情報を保存しました', 3000);
    } catch (err) {
      console.error('[ProfileSave] Error:', err);
      Utils.showMessage('error-message-profile', '保存に失敗しました: ' + (err as Error).message, 3000);
    }
  }

  /**
   * 経歴追加ハンドラー
   */
  async handleCareerAdd(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.adminPassword) return;

    try {
      const year = (document.getElementById('career-year') as HTMLInputElement).value;
      const month = (document.getElementById('career-month') as HTMLInputElement).value;
      const content = (document.getElementById('career-content') as HTMLInputElement).value;

      await this.career.add(year, month, content, this.adminPassword);
      
      // フォームをクリア
      (document.getElementById('career-form') as HTMLFormElement).reset();

      // 経歴リストを更新
      await this.career.fetch(this.adminPassword);
      this.career.render(document.getElementById('career-list-container')!);

      Utils.showMessage('success-message-career', '経歴を追加しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-career', '追加に失敗しました', 3000);
    }
  }

  /**
   * 経歴削除ハンドラー
   */
  async deleteCareerHandler(id: number): Promise<void> {
    if (!confirm('この経歴を削除しますか？')) return;
    if (!this.adminPassword) return;

    try {
      await this.career.delete(id, this.adminPassword);
      
      // 経歴リストを更新
      await this.career.fetch(this.adminPassword);
      this.career.render(document.getElementById('career-list-container')!);

      Utils.showMessage('success-message-career', '削除しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-career', '削除に失敗しました', 3000);
    }
  }

  /**
   * PDF追加ハンドラー
   */
  async handlePDFAdd(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.adminPassword) return;

    try {
      const title = (document.getElementById('pdf-title') as HTMLInputElement).value;
      const description = (document.getElementById('pdf-description') as HTMLInputElement).value;
      const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
      
      if (!title || !fileInput.files || !fileInput.files[0]) {
        Utils.showMessage('error-message-pdf', '必須項目を入力してください', 3000);
        return;
      }

      const file = fileInput.files[0];
      console.log('[PDF Upload] File selected:', { name: file.name, size: file.size, type: file.type });
      
      // ファイルを Base64 にエンコード
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target!.result as string;
          console.log('[PDF Upload] Base64 encoded, size:', base64Data.length);
          
          // Cloudinaryにアップロード
          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_data: base64Data,
              filename: `pdf_${Date.now()}_${file.name}`,
              folder: 'pdfs',
              password: this.adminPassword
            })
          });

          console.log('[PDF Upload] Response status:', uploadResponse.status);

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            console.error('[PDF Upload] Error response:', error);
            throw new Error(error.error || 'Upload failed');
          }

          const uploadResult = await uploadResponse.json();
          console.log('[PDF Upload] Success:', uploadResult);

          // APIにメタデータを保存
          const response = await fetch('/api/pdfs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              description,
              file_path: uploadResult.url,
              file_name: file.name,
              cloudinary_id: uploadResult.public_id,
              password: this.adminPassword
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('[PDF Save] Error response:', error);
            throw new Error(error.error || 'Save failed');
          }

          // フォームをクリア
          (document.getElementById('pdf-form') as HTMLFormElement).reset();
          
          Utils.showMessage('success-message-pdf', 'PDFファイルをアップロードしました', 3000);
        } catch (err) {
          console.error('Upload error:', err);
          Utils.showMessage('error-message-pdf', 'アップロードに失敗しました: ' + (err as Error).message, 3000);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-pdf', 'エラーが発生しました', 3000);
    }
  }

  /**
   * 画像をCloudinaryにアップロード（汎用）
   */
  async uploadImageToCloudinary(file: File, folder: string = 'uploads'): Promise<string> {
    console.log('[uploadImageToCloudinary] Starting with file:', file.name, ', folder:', folder);
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        try {
          const base64Data = event.target!.result as string;
          console.log('[uploadImageToCloudinary] Base64 data created, length:', base64Data.length);
          
          const uploadPayload = {
            file_data: base64Data,
            filename: `${Date.now()}_${file.name}`,
            folder: folder,
            password: this.adminPassword
          };
          
          console.log('[uploadImageToCloudinary] Payload prepared:', { 
            filename: uploadPayload.filename, 
            folder: uploadPayload.folder,
            fileDataLength: uploadPayload.file_data.length 
          });
          
          console.log('[uploadImageToCloudinary] Sending POST to /api/upload-image');
          console.log('[uploadImageToCloudinary] Payload size:', JSON.stringify(uploadPayload).length);
          
          const fetchPromise = fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadPayload)
          });
          
          console.log('[uploadImageToCloudinary] Fetch promise created');
          
          const response = await fetchPromise;

          console.log('[uploadImageToCloudinary] Fetch completed, response:', response);
          console.log('[uploadImageToCloudinary] Response received, status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[uploadImageToCloudinary] Error response text:', errorText);
            try {
              const error = JSON.parse(errorText);
              throw new Error(error.error || 'Upload failed');
            } catch {
              throw new Error('Upload failed: ' + errorText.substring(0, 100));
            }
          }

          const result = await response.json();
          console.log('[uploadImageToCloudinary] Success! Result:', result);
          resolve(result.url);
        } catch (err) {
          console.error('[uploadImageToCloudinary] Error:', err);
          console.error('[uploadImageToCloudinary] Error name:', (err as Error).name);
          console.error('[uploadImageToCloudinary] Error message:', (err as Error).message);
          console.error('[uploadImageToCloudinary] Error stack:', (err as Error).stack);
          reject(err);
        }
      };
      reader.onerror = () => {
        console.error('[uploadImageToCloudinary] FileReader error');
        reject(new Error('FileReader error'));
      };
      console.log('[uploadImageToCloudinary] Calling readAsDataURL');
      reader.readAsDataURL(file);
    });
  }


  /**
   * PDF削除ハンドラー
   */
  async deletePDFHandler(id: number): Promise<void> {
    if (!confirm('このPDFを削除してもよろしいですか？')) {
      return;
    }

    try {
      await this.pdf.delete(id, this.adminPassword!);
      Utils.showMessage('success-message-pdf', 'PDFファイルを削除しました', 3000);
      this.pdf.render(document.getElementById('pdf-list-container')!);
    } catch (err) {
      console.error('Delete error:', err);
      Utils.showMessage('error-message-pdf', 'PDFの削除に失敗しました: ' + (err as Error).message, 3000);
    }
  }

  /**
   * 活動報告画像プレビュー更新
   */
  updateActivityReportImagePreview(dataUrl: string): void {
    const imgElement = document.getElementById('activity-report-preview-img') as HTMLImageElement;
    const placeholderElement = document.getElementById('activity-report-preview-placeholder') as HTMLElement;
    const urlInput = document.getElementById('activity-report-img-url') as HTMLInputElement;

    if (imgElement && placeholderElement && urlInput) {
      imgElement.src = dataUrl;
      imgElement.style.display = 'block';
      placeholderElement.style.display = 'none';
      urlInput.value = dataUrl; // プレビュー用に一時的に保存
    }
  }

  /**
   * 活動報告追加ハンドラー
   */
  async handleActivityReportAdd(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.adminPassword) return;

    try {
      const title = (document.getElementById('activity-report-title') as HTMLInputElement).value;
      const date = (document.getElementById('activity-report-date') as HTMLInputElement).value;
      const content = (document.getElementById('activity-report-content') as HTMLTextAreaElement).value;
      const imageFile = (document.getElementById('activity-report-image') as HTMLInputElement).files?.[0];

      if (!title || !date || !content) {
        Utils.showMessage('error-message-activity-reports', '必須項目（タイトル、日付、内容）を入力してください', 3000);
        return;
      }

      let imageUrl = '';
      if (imageFile) {
        try {
          imageUrl = await this.uploadImageToCloudinary(imageFile, 'activity-reports');
        } catch (err) {
          Utils.showMessage('error-message-activity-reports', '画像のアップロードに失敗しました', 3000);
          return;
        }
      }

      await this.activityReports.add(title, content, date, imageUrl, this.adminPassword);

      // フォームをクリア
      (document.getElementById('activity-report-form') as HTMLFormElement).reset();
      const previewImg = document.getElementById('activity-report-preview-img') as HTMLImageElement;
      const placeholder = document.getElementById('activity-report-preview-placeholder') as HTMLElement;
      if (previewImg) previewImg.style.display = 'none';
      if (placeholder) placeholder.style.display = 'block';

      // リストを更新
      await this.activityReports.fetch(this.adminPassword);
      this.activityReports.render(document.getElementById('activity-reports-list-container')!);

      Utils.showMessage('success-message-activity-reports', '活動報告を追加しました', 3000);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-activity-reports', '追加に失敗しました: ' + (err as Error).message, 3000);
    }
  }

  /**
   * 活動報告削除ハンドラー
   */
  async deleteActivityReportHandler(id: number): Promise<void> {
    if (!confirm('この活動報告を削除しますか？')) return;
    if (!this.adminPassword) return;

    try {
      await this.activityReports.delete(id, this.adminPassword);
      Utils.showMessage('success-message-activity-reports', '活動報告を削除しました', 3000);

      // リストを更新
      await this.activityReports.fetch(this.adminPassword);
      this.activityReports.render(document.getElementById('activity-reports-list-container')!);
    } catch (err) {
      console.error('Error:', err);
      Utils.showMessage('error-message-activity-reports', '削除に失敗しました', 3000);
    }
  }

  /**
   * 活動報告編集ハンドラー
   */
  async editActivityReportHandler(id: number): Promise<void> {
    if (!this.adminPassword) return;

    const report = this.activityReports.reports.find(r => r.id === id);
    if (!report) {
      Utils.showMessage('error-message-activity-reports', 'レポートが見つかりません', 3000);
      return;
    }

    // フォームに値を埋める
    (document.getElementById('activity-report-title') as HTMLInputElement).value = report.title;
    (document.getElementById('activity-report-date') as HTMLInputElement).value = report.date;
    (document.getElementById('activity-report-content') as HTMLTextAreaElement).value = report.content;
    (document.getElementById('activity-report-img-url') as HTMLInputElement).value = report.image_url || '';

    // プレビュー画像を表示
    if (report.image_url) {
      const imgElement = document.getElementById('activity-report-preview-img') as HTMLImageElement;
      const placeholderElement = document.getElementById('activity-report-preview-placeholder') as HTMLElement;
      if (imgElement && placeholderElement) {
        imgElement.src = report.image_url;
        imgElement.style.display = 'block';
        placeholderElement.style.display = 'none';
      }
    }

    // ウィンドウをスクロール
    document.getElementById('activity-reports-tab')?.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * PDF管理クラス
 */
class PDFManager {
  api: APIClient;
  pdfs: any[];

  constructor(api: APIClient) {
    this.api = api;
    this.pdfs = [];
  }

  /**
   * PDF一覧を取得
   */
  async fetch(password: string): Promise<any[]> {
    try {
      const response = await fetch('/api/pdfs');
      this.pdfs = await response.json();
      return this.pdfs;
    } catch (error) {
      console.error('Failed to fetch PDFs:', error);
      return [];
    }
  }

  /**
   * PDF一覧を取得（ログイン用）
   */
  async fetchAll(password: string): Promise<any[]> {
    return this.fetch(password);
  }

  /**
   * PDFを削除
   */
  async delete(id: number, password: string): Promise<void> {
    const response = await fetch('/api/pdfs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    if (!response.ok) throw new Error('Failed to delete PDF');
  }

  /**
   * PDFリストを描画
   */
  render(container: HTMLElement): void {
    if (this.pdfs.length === 0) {
      container.innerHTML = '<p>登録されたPDFファイルはありません</p>';
      return;
    }

    const html = `
      <table class="comments-table" style="margin-top: 20px;">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>ファイル名</th>
            <th>アップロード日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.pdfs.map(pdf => `
            <tr>
              <td>${pdf.title}</td>
              <td>${pdf.file_name}</td>
              <td>${new Date(pdf.created_at).toLocaleDateString('ja-JP')}</td>
              <td>
                <button class="delete-button" onclick="window.adminManager.deletePDFHandler(${pdf.id})">削除</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  }
}

/**
 * 活動報告管理クラス
 */
class ActivityReportManager {
  api: APIClient;
  reports: any[];

  constructor(api: APIClient) {
    this.api = api;
    this.reports = [];
  }

  /**
   * 活動報告一覧を取得
   */
  async fetch(password: string): Promise<any[]> {
    const response = await fetch(`/api/activity-reports?password=${encodeURIComponent(password)}`);
    if (!response.ok) throw new Error('Failed to fetch activity reports');
    this.reports = await response.json();
    return this.reports;
  }

  /**
   * 活動報告を追加
   */
  async add(title: string, content: string, date: string, image_url?: string, password?: string): Promise<void> {
    const response = await fetch('/api/activity-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, date, image_url, password })
    });
    if (!response.ok) throw new Error('Failed to add activity report');
  }

  /**
   * 活動報告を更新
   */
  async update(id: number, title: string, content: string, date: string, image_url?: string, password?: string): Promise<void> {
    const response = await fetch('/api/activity-reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, content, date, image_url, password })
    });
    if (!response.ok) throw new Error('Failed to update activity report');
  }

  /**
   * 活動報告を削除
   */
  async delete(id: number, password: string): Promise<void> {
    const response = await fetch('/api/activity-reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    if (!response.ok) throw new Error('Failed to delete activity report');
  }

  /**
   * 活動報告一覧を表示
   */
  render(container: HTMLElement): void {
    if (this.reports.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #999;">活動報告はまだ登録されていません</p>';
      return;
    }

    const html = `
      <table class="comments-table">
        <thead>
          <tr>
            <th>日付</th>
            <th>タイトル</th>
            <th>内容</th>
            <th>画像</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.reports.map(report => `
            <tr>
              <td>${report.date}</td>
              <td>${Utils.escapeHtml(report.title)}</td>
              <td class="comment-message">${Utils.escapeHtml(report.content.substring(0, 50))}...</td>
              <td>${report.image_url ? '<a href="' + report.image_url + '" target="_blank">表示</a>' : 'なし'}</td>
              <td>
                <button class="edit-button" onclick="window.adminManager.editActivityReportHandler(${report.id})">
                  編集
                </button>
                <button class="delete-button" onclick="window.adminManager.deleteActivityReportHandler(${report.id})">
                  削除
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Main] DOMContentLoaded event fired');
  const manager = new AdminManager();
  console.log('[Main] AdminManager instance created');
  manager.initialize();
  console.log('[Main] AdminManager.initialize() called');
  (window as any).adminManager = manager; // グローバルにアクセス可能にする
  console.log('[Main] Initialization complete');
});

