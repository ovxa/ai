/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 通常部署在子路径，如 /repo-name
  // 如果部署在根路径，可以注释掉 basePath
  // basePath: '/ai',
}

module.exports = nextConfig
