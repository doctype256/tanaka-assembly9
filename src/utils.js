/**
 * Utils クラス
 * 共通のユーティリティ関数をstaticメソッドとして提供
 */
class Utils {
  /**
   * HTML内の特殊文字をエスケープしXSS対策
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 日本語形式で日時をフォーマット
   * @param {string} dateString ISO形式の日付文字列
   * @returns {string} YYYY-MM-DD HH:MM形式
   */
  static formatDateJP(dateString) {
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
   * @param {string} elementId 要素のID
   * @param {boolean} show 表示するかどうか
   */
  static showElement(elementId, show = true) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * DOM要素にクラスを追加/削除
   * @param {string} elementId 要素のID
   * @param {string} className クラス名
   * @param {boolean} add 追加するか削除するか
   */
  static toggleClass(elementId, className, add = true) {
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
   * @param {string} elementId メッセージ表示要素のID
   * @param {string} message 表示するメッセージ
   * @param {number} duration 表示時間（ミリ秒）
   */
  static showMessage(elementId, message, duration = 3000) {
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
   * @param {string} icon アイコン（絵文字など）
   * @param {string} message メッセージテキスト
   * @returns {string} HTML文字列
   */
  static getEmptyStateHtml(icon = '📭', message = 'データはありません') {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${this.escapeHtml(icon)}</div>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * URLクエリパラメータを取得
   * @param {string} param パラメータ名
   * @returns {string|null} パラメータ値
   */
  static getQueryParam(param) {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param);
  }

  /**
   * 日付を相対時間で表示（例：「3時間前」）
   * @param {string} dateString ISO形式の日付文字列
   * @returns {string} 相対時間の文字列
   */
  static getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
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
