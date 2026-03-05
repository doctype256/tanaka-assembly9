import { defineConfig } from 'vite';
import apiPlugin from './vite-plugin-api.ts';
export default defineConfig({
    plugins: [apiPlugin()],
    // プロダクション環境でのビルド設定
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        }
    },
    // 開発サーバーの設定
    server: {
        port: 5173,
        open: false
    }
});
