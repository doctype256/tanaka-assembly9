// lib/utils.ts
class Utils {
  /**
   * HTML内の特殊文字をエスケープしXSS対策
   * @param text エスケープする文字列
   * @returns エスケープ後の文字列
   */
  static escapeHtml(text: string | null): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 日本語形式で日時をフォーマット
   * @param dateString ISO形式の日付文字列
   * @returns YYYY-MM-DD HH:MM形式
   */
  static formatDateJP(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * DOM要素の表示/非表示を制御
   * @param elementId 要素のID
   * @param show 表示するかどうか
   */
  static showElement(elementId: string, show: boolean = true): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * DOM要素にクラスを追加/削除
   * @param elementId 要素のID
   * @param className クラス名
   * @param add 追加するか削除するか
   */
  static toggleClass(elementId: string, className: string, add: boolean = true): void {
    const element = document.getElementById(elementId);
    if (element) {
      if (add) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    }
  }

  /**
   * メッセージを一時的に表示
   * @param elementId メッセージ表示要素のID
   * @param message 表示するメッセージ
   * @param duration 表示時間（ミリ秒）
   */
  static showMessage(elementId: string, message: string, duration: number = 3000): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.add('show');
      if (duration > 0) {
        setTimeout(() => {
          element.classList.remove('show');
        }, duration);
      }
    }
  }

  /**
   * 空状態のHTML表示
   * @param icon アイコン（絵文字など）
   * @param message メッセージテキスト
   * @returns HTML文字列
   */
  static getEmptyStateHtml(icon: string = '📭', message: string = 'データはありません'): string {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${this.escapeHtml(icon)}</div>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * URLクエリパラメータを取得
   * @param param パラメータ名
   * @returns パラメータ値、存在しない場合はnull
   */
  static getQueryParam(param: string): string | null {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
  }

  /**
   * 日付を相対時間で表示（例：「3時間前」）
   * @param dateString ISO形式の日付文字列
   * @returns 相対時間の文字列
   */
  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return this.formatDateJP(dateString);
  }
}

export default Utils;
