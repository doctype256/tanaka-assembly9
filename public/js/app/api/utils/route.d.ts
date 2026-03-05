declare class Utils {
    /**
     * HTML内の特殊文字をエスケープしXSS対策
     * @param text エスケープする文字列
     * @returns エスケープ後の文字列
     */
    static escapeHtml(text: string | null): string;
    /**
     * 日本語形式で日時をフォーマット
     * @param dateString ISO形式の日付文字列
     * @returns YYYY-MM-DD HH:MM形式
     */
    static formatDateJP(dateString: string): string;
    /**
     * DOM要素の表示/非表示を制御
     * @param elementId 要素のID
     * @param show 表示するかどうか
     */
    static showElement(elementId: string, show?: boolean): void;
    /**
     * DOM要素にクラスを追加/削除
     * @param elementId 要素のID
     * @param className クラス名
     * @param add 追加するか削除するか
     */
    static toggleClass(elementId: string, className: string, add?: boolean): void;
    /**
     * メッセージを一時的に表示
     * @param elementId メッセージ表示要素のID
     * @param message 表示するメッセージ
     * @param duration 表示時間（ミリ秒）
     */
    static showMessage(elementId: string, message: string, duration?: number): void;
    /**
     * 空状態のHTML表示
     * @param icon アイコン（絵文字など）
     * @param message メッセージテキスト
     * @returns HTML文字列
     */
    static getEmptyStateHtml(icon?: string, message?: string): string;
    /**
     * URLクエリパラメータを取得
     * @param param パラメータ名
     * @returns パラメータ値、存在しない場合はnull
     */
    static getQueryParam(param: string): string | null;
    /**
     * 日付を相対時間で表示（例：「3時間前」）
     * @param dateString ISO形式の日付文字列
     * @returns 相対時間の文字列
     */
    static getRelativeTime(dateString: string): string;
}
export default Utils;
