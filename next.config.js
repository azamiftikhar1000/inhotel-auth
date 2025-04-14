/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['identity.apaleo.com', 'app.apaleo.com'],
  },
};

module.exports = nextConfig; 