export default class APIClient {
  async getAllComments(password: string) {
    const res = await fetch(`/api/comments?password=${encodeURIComponent(password)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  }

  async updateCommentApproval(id: number, approved: boolean, password: string) {
    const res = await fetch('/api/comments/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved, password }),
    });
    if (!res.ok) throw new Error('Failed to update approval');
    return res.json();
  }

  async deleteComment(id: number, password: string) {
    const res = await fetch('/api/comments/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  }

  async getAllContacts(password: string) {
    const res = await fetch(`/api/contacts?password=${encodeURIComponent(password)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
  }

  async deleteContact(id: number, password: string) {
    const res = await fetch('/api/contacts/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });
    if (!res.ok) throw new Error('Failed to delete contact');
    return res.json();
  }

  /**
   * お問い合わせ送信（←これが必要）
   */
  async createContact(name: string, furigana: string, email: string, message: string) {
    const res = await fetch('/api/contact-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, furigana, email, message }),
    });

    if (!res.ok) throw new Error('Failed to create contact');
    return res.json();
  }
}
