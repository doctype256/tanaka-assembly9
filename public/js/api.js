/**
 * APIClient クラス
 * 全てのAPI通信を管理するクラス
 */
class APIClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * 基本的なAPI呼び出しメソッド
   */
  async call(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }

    try {
      console.log(`[API] Calling ${url}`);
      const response = await fetch(url, { ...options, headers });
      console.log(`[API] Response status: ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log(`[API] Response data:`, data);
      return data;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // ============ コメント関連メソッド ============

  /**
   * 記事の承認済みコメントを取得
   */
  async getComments(articleTitle) {
    return this.call(`/comments?article_title=${encodeURIComponent(articleTitle)}`);
  }

  /**
   * 全コメントを取得（管理者用）
   */
  async getAllComments(password) {
    return this.call(`/comments?all=true&password=${encodeURIComponent(password)}`);
  }

  /**
   * コメントを新規作成
   */
  async createComment(articleTitle, name, message) {
    return this.call('/comments', {
      method: 'POST',
      body: { article_title: articleTitle, name, message },
    });
  }

  /**
   * コメント承認ステータスを更新
   */
  async updateCommentApproval(id, approved, password) {
    return this.call('/comments', {
      method: 'PATCH',
      body: { id, approved, password },
    });
  }

  /**
   * コメントを削除
   */
  async deleteComment(id, password) {
    return this.call('/comments', {
      method: 'DELETE',
      body: { id, password },
    });
  }

  // ============ お問い合わせ関連メソッド ============

  /**
   * 全お問い合わせを取得（管理者用）
   */
  async getAllContacts(password) {
    return this.call(`/contacts?password=${encodeURIComponent(password)}`);
  }

  /**
   * お問い合わせを新規作成
   */
  async createContact(name, furigana, email, message) {
    return this.call('/contacts', {
      method: 'POST',
      body: { name, furigana, email, message },
    });
  }

  /**
   * お問い合わせを削除
   */
  async deleteContact(id, password) {
    return this.call('/contacts', {
      method: 'DELETE',
      body: { id, password },
    });
  }
}

export default APIClient;
