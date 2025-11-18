/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署在子路径 /ai/
  basePath: '/ai',
}

module.exports = nextConfig
