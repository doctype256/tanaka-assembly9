// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 型エラーを無視してビルドを進める
  },
  // 他の設定もここに追加できます
};

export default nextConfig;
