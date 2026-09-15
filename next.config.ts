import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Le dépôt contient plusieurs lockfiles : sans racine explicite, Next remonte au dossier
  // parent et Turbopack panique ("needs to be on project filesystem"). Cette app est sa
  // propre racine de workspace.
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/fr/ventes-en-cours',
        destination: '/fr/vehicules',
        permanent: true,
      },
      {
        source: '/en/current-sales',
        destination: '/en/vehicles',
        permanent: true,
      },
      {
        source: '/fr/vendre-avec-nous',
        destination: '/fr/vendre',
        permanent: true,
      },
      {
        source: '/en/sell-with-us',
        destination: '/en/sell',
        permanent: true,
      }
    ];
  },
};

export default nextConfig;
