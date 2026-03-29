import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050508",
};

export const metadata: Metadata = {
  title: "Geek Arena — O Quiz Definitivo de Rap Geek",
  description: "Teste seus conhecimentos sobre as músicas de rap geek e anime! Adivinhe a música pelo áudio, envolvendo artistas como 7 Minutoz, Enygma e mais.",
  keywords: ["Geek Arena", "7 Minutoz", "7MZ", "Enygma", "quiz", "rap geek", "anime", "música nerd"],
  icons: {
    icon: "/geek-logo.png",
    apple: "/geek-logo.png",
  },
};

import { ChannelProvider } from "@/context/ChannelContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <ChannelProvider>
          {children}
        </ChannelProvider>
      </body>
    </html>
  );
}
