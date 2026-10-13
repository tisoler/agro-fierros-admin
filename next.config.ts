import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Sequelize y mysql2 corren solo en el servidor y no deben pasar por el bundler
  serverExternalPackages: ['sequelize', 'mysql2', 'sharp', '@aws-sdk/client-s3'],
  experimental: {
    // Las fotos ya procesadas (webp) viajan en el formulario
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
