/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Making non-NEXT_PUBLIC_ environment variables available on the client
  env: {
    // Expose these variables to the browser
    NEXT_PUBLIC_COMPANY_API_URL: process.env.NEXT_COMPANY_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_ADMIN_API_URL: process.env.NEXT_ADMIN_API_URL || 'http://localhost:3002',
  },
}

module.exports = nextConfig
