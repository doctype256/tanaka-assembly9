// app/api/api/route.ts
interface Comment {
  id: number;
  article_title: string;
  name: string;
  message: string;
  approved: boolean;
}

interface Contact {
  id: number;
  name: string;
  furigana: string;
  email: string;
  message: string;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * 基本的なAPI呼び出しメソッド
   */
  private async call<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
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
      return data as T;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // ============ コメント関連メソッド ============

  /**
   * 記事の承認済みコメントを取得
   */
  async getComments(articleTitle: string): Promise<Comment[]> {
    return this.call<Comment[]>(`/comments?article_title=${encodeURIComponent(articleTitle)}`);
  }

  /**
   * 全コメントを取得（管理者用）
   */
  async getAllComments(password: string): Promise<Comment[]> {
    return this.call<Comment[]>(`/comments?all=true&password=${encodeURIComponent(password)}`);
  }

  /**
   * コメントを新規作成
   */
  async createComment(articleTitle: string, name: string, message: string): Promise<Comment> {
    return this.call<Comment>('/comments', {
      method: 'POST',
      body: { article_title: articleTitle, name, message },
    });
  }

  /**
   * コメント承認ステータスを更新
   */
  async updateCommentApproval(id: number, approved: boolean, password: string): Promise<Comment> {
    return this.call<Comment>('/comments', {
      method: 'PATCH',
      body: { id, approved, password },
    });
  }

  /**
   * コメントを削除
   */
  async deleteComment(id: number, password: string): Promise<void> {
    return this.call<void>('/comments', {
      method: 'DELETE',
      body: { id, password },
    });
  }

  // ============ お問い合わせ関連メソッド ============

  /**
   * 全お問い合わせを取得（管理者用）
   */
  async getAllContacts(password: string): Promise<Contact[]> {
    return this.call<Contact[]>(`/contacts?password=${encodeURIComponent(password)}`);
  }

  /**
   * お問い合わせを新規作成
   */
  async createContact(name: string, furigana: string, email: string, message: string): Promise<Contact> {
    return this.call<Contact>('/contacts', {
      method: 'POST',
      body: { name, furigana, email, message },
    });
  }

  /**
   * お問い合わせを削除
   */
  async deleteContact(id: number, password: string): Promise<void> {
    return this.call<void>('/contacts', {
      method: 'DELETE',
      body: { id, password },
    });
  }
}

export default APIClient;
