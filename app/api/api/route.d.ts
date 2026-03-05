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
declare class APIClient {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * 基本的なAPI呼び出しメソッド
     */
    private call;
    /**
     * 記事の承認済みコメントを取得
     */
    getComments(articleTitle: string): Promise<Comment[]>;
    /**
     * 全コメントを取得（管理者用）
     */
    getAllComments(password: string): Promise<Comment[]>;
    /**
     * コメントを新規作成
     */
    createComment(articleTitle: string, name: string, message: string): Promise<Comment>;
    /**
     * コメント承認ステータスを更新
     */
    updateCommentApproval(id: number, approved: boolean, password: string): Promise<Comment>;
    /**
     * コメントを削除
     */
    deleteComment(id: number, password: string): Promise<void>;
    /**
     * 全お問い合わせを取得（管理者用）
     */
    getAllContacts(password: string): Promise<Contact[]>;
    /**
     * お問い合わせを新規作成
     */
    createContact(name: string, furigana: string, email: string, message: string): Promise<Contact>;
    /**
     * お問い合わせを削除
     */
    deleteContact(id: number, password: string): Promise<void>;
}
export default APIClient;
