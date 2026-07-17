import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Libera a segurança do Next.js para permitir testes via Wi-Fi no seu IP local
  allowedDevOrigins: ['192.168.15.128'],
};

export default nextConfig;