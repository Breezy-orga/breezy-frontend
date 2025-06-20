/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Retrait de l'export statique pour permettre les routes dynamiques
  experimental: {
    // Conserver les autres configurations expérimentales si nécessaire
  }
}

module.exports = nextConfig
