import "./globals.css";
import "./env.client"; // ✅ adiciona esta linha
import type { Metadata } from "next";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
