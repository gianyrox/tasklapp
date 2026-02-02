/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig 