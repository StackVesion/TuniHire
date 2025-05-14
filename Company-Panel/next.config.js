/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_51QWkPJDv0oob45G01PMTvx9lcyajJmZr3BMaAIcelUkpieW3lqUqeHIIdmU6XvRnGNaBigsAtNQc5TSU1UXha1Ok00TitnR0bE',
  }
}

module.exports = nextConfig
