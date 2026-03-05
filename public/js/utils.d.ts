export default Utils;
/**
 * Utils クラス
 * 共通のユーティリティ関数をstaticメソッドとして提供
 */
declare class Utils {
    /**
     * HTML内の特殊文字をエスケープしXSS対策
     */
    static escapeHtml(text: any): string;
    /**
     * 日本語形式で日時をフォーマット
     * @param {string} dateString ISO形式の日付文字列
     * @returns {string} YYYY-MM-DD HH:MM形式
     */
    static formatDateJP(dateString: string): string;
    /**
     * DOM要素の表示/非表示を制御
     * @param {string} elementId 要素のID
     * @param {boolean} show 表示するかどうか
     */
    static showElement(elementId: string, show?: boolean): void;
    /**
     * DOM要素にクラスを追加/削除
     * @param {string} elementId 要素のID
     * @param {string} className クラス名
     * @param {boolean} add 追加するか削除するか
     */
    static toggleClass(elementId: string, className: string, add?: boolean): void;
    /**
     * メッセージを一時的に表示
     * @param {string} elementId メッセージ表示要素のID
     * @param {string} message 表示するメッセージ
     * @param {number} duration 表示時間（ミリ秒）
     */
    static showMessage(elementId: string, message: string, duration?: number): void;
    /**
     * 空状態のHTML表示
     * @param {string} icon アイコン（絵文字など）
     * @param {string} message メッセージテキスト
     * @returns {string} HTML文字列
     */
    static getEmptyStateHtml(icon?: string, message?: string): string;
    /**
     * URLクエリパラメータを取得
     * @param {string} param パラメータ名
     * @returns {string|null} パラメータ値
     */
    static getQueryParam(param: string): string | null;
    /**
     * 日付を相対時間で表示（例：「3時間前」）
     * @param {string} dateString ISO形式の日付文字列
     * @returns {string} 相対時間の文字列
     */
    static getRelativeTime(dateString: string): string;
}
