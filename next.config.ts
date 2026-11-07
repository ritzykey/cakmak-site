import type { NextConfig } from "next";

// GitHub Pages sitesi /cakmak-site alt yolunda yayınlanır.
// Yerelde boş kalır; iş akışı PAGES_BASE_PATH ile ayarlar.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
