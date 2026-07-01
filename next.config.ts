import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // dev サーバへ 127.0.0.1 / localhost 双方からのアクセスを許可（Playwright 用）
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
}

export default nextConfig
