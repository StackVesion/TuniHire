/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_51QWkPJDv0oob45G01PMTvx9lcyajJmZr3BMaAIcelUkpieW3lqUqeHIIdmU6XvRnGNaBigsAtNQc5TSU1UXha1Ok00TitnR0bE',
    // Support both development and production environments
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FRONT_API_URL: process.env.NEXT_PUBLIC_FRONT_API_URL,
    NEXT_PUBLIC_ADMIN_API_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL
  }
}

module.exports = nextConfig
