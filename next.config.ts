import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Azure App Service 等へ最小構成でデプロイするため standalone 出力にする
  output: 'standalone',
  // dev サーバへ 127.0.0.1 / localhost 双方からのアクセスを許可（Playwright 用）
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
}

export default nextConfig
