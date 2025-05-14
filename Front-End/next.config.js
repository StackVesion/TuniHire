/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Making environment variables available with proper Vercel URLs
  env: {
    // Support both local and production environments
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_COMPANY_API_URL: process.env.NEXT_PUBLIC_COMPANY_API_URL,
    NEXT_PUBLIC_ADMIN_API_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL,
  },
}

module.exports = nextConfig
