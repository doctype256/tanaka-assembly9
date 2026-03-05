import { ViteDevServer } from 'vite';
/**
 * Vite 開発サーバー用 API ミドルウェア
 */
export default function apiPlugin(): {
    name: string;
    configResolved(): void;
    configureServer(server: ViteDevServer): Promise<void>;
};
