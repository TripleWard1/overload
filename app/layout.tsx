import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

// ✅ Isto é o que define de facto a variável --font-inter usada em todo o page.tsx.
// Sem isto, var(--font-inter) nunca resolvia para nada e a app caía sempre no
// fallback system-ui (a fonte "premium" nunca era realmente aplicada).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Overload",
  applicationName: "Overload",
  themeColor: "#070B14",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    title: "Overload",
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
  <body className={`min-h-screen bg-[#070B14] text-white ${inter.variable}`}>{children}</body>
</html>

  );
}
