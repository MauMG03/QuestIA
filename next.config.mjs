/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 👈 Esta línea desactiva ESLint durante el build
  },
};

export default nextConfig;