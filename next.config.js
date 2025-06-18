/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_DOCKER_API_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig