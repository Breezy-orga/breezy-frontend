/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['localhost'], // Ajouter les domaines d'images autorisés
  },
  
  // Configuration du proxy pour les requêtes API
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    console.log('Configuration du proxy pour l\'API:', apiUrl);
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  
  // Configuration des en-têtes CORS
  async headers() {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://breezy-app.vercel.app',
      // Ajouter d'autres origines autorisées si nécessaire
    ];
    
    return [
      {
        // Appliquer ces en-têtes à toutes les routes API
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : allowedOrigins.join(',') 
          },
          { 
            key: 'Access-Control-Allow-Methods', 
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' 
          },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' 
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  
  // Configuration expérimentale
  experimental: {
    serverActions: true,
  },
  
  // Désactiver le cache pour le développement
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Activer le rechargement rapide (Fast Refresh)
  fastRefresh: true,
  
  // Améliorer la gestion des erreurs
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        dgram: false,
      };
    }
    return config;
  },
};

// Afficher la configuration en mode développement
if (process.env.NODE_ENV === 'development') {
  console.log('Configuration Next.js en mode développement');
  console.log('URL de l\'API:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
}

module.exports = nextConfig;
