import type { MetadataRoute } from "next";

/**
 * Next.js serve isto automaticamente em /manifest.webmanifest e liga o
 * <link rel="manifest"> sozinho — sem isto, a app só era "instalável" no
 * iOS (via appleWebApp no layout.tsx); no Android/Chrome não aparecia
 * a opção de instalar como app.
 *
 * NOTA: os ícones abaixo assumem que /public/icon.png é um PNG quadrado.
 * Se não for pelo menos 512x512, mais vale gerar um icon-512.png dedicado
 * (e opcionalmente um maskable) para o ícone não sair granulado no Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Overload",
    short_name: "Overload",
    description: "Treino. Performance. Progressão.",
    start_url: "/",
    display: "standalone",
    background_color: "#070B14",
    theme_color: "#070B14",
    orientation: "portrait",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
