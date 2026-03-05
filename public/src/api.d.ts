export default APIClient;
/**
 * APIClient クラス
 * 全てのAPI通信を管理するクラス
 */
declare class APIClient {
    constructor(baseUrl?: string);
    baseUrl: string;
    /**
     * 基本的なAPI呼び出しメソッド
     */
    call(endpoint: any, options?: {}): Promise<any>;
    /**
     * 記事の承認済みコメントを取得
     */
    getComments(articleTitle: any): Promise<any>;
    /**
     * 全コメントを取得（管理者用）
     */
    getAllComments(password: any): Promise<any>;
    /**
     * コメントを新規作成
     */
    createComment(articleTitle: any, name: any, message: any): Promise<any>;
    /**
     * コメント承認ステータスを更新
     */
    updateCommentApproval(id: any, approved: any, password: any): Promise<any>;
    /**
     * コメントを削除
     */
    deleteComment(id: any, password: any): Promise<any>;
    /**
     * 全お問い合わせを取得（管理者用）
     */
    getAllContacts(password: any): Promise<any>;
    /**
     * お問い合わせを新規作成
     */
    createContact(name: any, furigana: any, email: any, message: any): Promise<any>;
    /**
     * お問い合わせを削除
     */
    deleteContact(id: any, password: any): Promise<any>;
}
