import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions aceitam até 1MB por padrão. A Biblioteca da IA recebe LIVROS
    // inteiros (texto de PDF) que passam disso — por isso o "Adicionar referência"
    // falhava silenciosamente. Ação só de admin, então é seguro elevar.
    serverActions: { bodySizeLimit: "16mb" },
  },
};

export default nextConfig;
