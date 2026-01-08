import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Overload",
  applicationName: "Overload",
  icons: {
    icon: "https://i.imgur.com/jROIhp2.png",
    shortcut: "https://i.imgur.com/jROIhp2.png",
    apple: "https://i.imgur.com/jROIhp2.png",
  },
  themeColor: "#070B14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
