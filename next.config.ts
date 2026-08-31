import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Sequelize y mysql2 corren solo en el servidor y no deben pasar por el bundler
  serverExternalPackages: ['sequelize', 'mysql2'],
};

export default nextConfig;
