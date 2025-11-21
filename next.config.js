/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages deployed at subpath /ai/
  basePath: '/ai',
  trailingSlash: true,
}

module.exports = nextConfig
