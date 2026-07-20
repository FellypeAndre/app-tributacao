import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Libera a segurança do Next.js para permitir testes via Wi-Fi no seu IP local
  allowedDevOrigins: ['192.168.15.128','192.168.100.46',' 10.0.0.30'],
};

export default nextConfig;