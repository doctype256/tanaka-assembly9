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
  constructor(api) {
    this.api = api;
    this.allComments = [];
    this.filteredComments = [];
  }

  /**
   * コメント一覧を取得
   */
  async fetchAll(password) {
    this.allComments = await this.api.getAllComments(password);
    this.filteredComments = this.allComments;
    return this.allComments;
  }

  /**
   * コメントを描画
   */
  renderComments(container) {
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
  async toggleApproval(id, approved, password) {
    await this.api.updateCommentApproval(id, approved, password);
    const comment = this.allComments.find(c => c.id === id);
    if (comment) comment.approved = approved;
    this.filteredComments = this.allComments.filter(c => c.id !== id || c);
  }

  /**
   * コメントを削除
   */
  async delete(id, password) {
    await this.api.deleteComment(id, password);
    this.allComments = this.allComments.filter(c => c.id !== id);
    this.filteredComments = this.allComments;
  }

  /**
   * コメントをフィルタリング
   */
  filter(articleTitle) {
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
  getStats() {
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
  constructor(api) {
    this.api = api;
    this.allContacts = [];
    this.filteredContacts = [];
  }

  /**
   * お問い合わせ一覧を取得
   */
  async fetchAll(password) {
    this.allContacts = await this.api.getAllContacts(password);
    this.filteredContacts = this.allContacts;
    return this.allContacts;
  }

  /**
   * お問い合わせを描画
   */
  renderContacts(container) {
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
  async delete(id, password) {
    await this.api.deleteContact(id, password);
    this.allContacts = this.allContacts.filter(c => c.id !== id);
    this.filteredContacts = this.allContacts;
  }

  /**
   * お問い合わせをフィルタリング
   */
  filter(email) {
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
  getStats() {
    return {
      total: this.allContacts.length,
    };
  }
}

/**
 * AdminManager クラス
 */
class AdminManager {
  constructor() {
    this.api = new APIClient();
    this.comments = new CommentManager(this.api);
    this.contacts = new ContactListManager(this.api);
    this.adminPassword = undefined;
  }

  /**
   * 初期化
   */
  initialize() {
    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
  // ログインフォーム
  document.getElementById('login-input').addEventListener('submit', (e) => this.handleLogin(e));
  document.getElementById('logout-button').addEventListener('click', () => this.handleLogout());

  // コメントフィルター
  document.getElementById('filter-button').addEventListener('click', () => this.filterComments());
  document.getElementById('clear-filter').addEventListener('click', () => this.clearCommentFilter());
  document.getElementById('filter-article').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') this.filterComments();
  });

  // ✅ パスワード変更フォーム
  const changePasswordForm = document.getElementById('change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', this.handleChangePassword.bind(this));
  }



    // お問い合わせフィルター
    document.getElementById('filter-contact-button').addEventListener('click', () => this.filterContacts());
    document.getElementById('clear-contact-filter').addEventListener('click', () => this.clearContactFilter());
    document.getElementById('filter-contact-email').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.filterContacts();
    });
  }

  /**
   * ログイン処理
   */
  async handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    try {
      await this.comments.fetchAll(password);
      await this.contacts.fetchAll(password);
      this.adminPassword = password;
      this.renderAllData();
      Utils.showElement('login-form', false);
      Utils.showElement('admin-content', true);
    } catch (err) {
      console.error('ログイン失敗:', err);
      Utils.showMessage('login-error', 'パスワードが間違っています', 0);
    }
  }

  /**
   * ログアウト処理
   */
  handleLogout() {
    this.adminPassword = undefined;
    Utils.showElement('login-form', true);
    Utils.showElement('admin-content', false);
  }

  /**
   * すべてのデータを描画
   */
  renderAllData() {
    const commentsContainer = document.getElementById('comments-container');
    const contactsContainer = document.getElementById('contacts-container');
    this.comments.renderComments(commentsContainer);
    this.contacts.renderContacts(contactsContainer);
  }

  /**
   * コメントフィルター
   */
  filterComments() {
    const articleTitle = document.getElementById('filter-article').value;
    this.comments.filter(articleTitle);
    this.comments.renderComments(document.getElementById('comments-container'));
  }

  /**
   * コメントフィルターをクリア
   */
  clearCommentFilter() {
    document.getElementById('filter-article').value = '';
    this.comments.filter('');
    this.comments.renderComments(document.getElementById('comments-container'));
  }

  /**
   * お問い合わせフィルター
   */
  filterContacts() {
    const email = document.getElementById('filter-contact-email').value;
    this.contacts.filter(email);
    this.contacts.renderContacts(document.getElementById('contacts-container'));
  }

  /**
   * お問い合わせフィルターをクリア
   */
  clearContactFilter() {
    document.getElementById('filter-contact-email').value = '';
    this.contacts.filter('');
    this.contacts.renderContacts(document.getElementById('contacts-container'));
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  const manager = new AdminManager();
  manager.initialize();
  window.adminManager = manager; // グローバルにアクセス可能にする
});
