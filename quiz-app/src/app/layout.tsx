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
  metadataBase: new URL('https://geekarena.vercel.app'),
  title: "Geek Arena — O Quiz Definitivo de Rap Geek",
  description: "Teste seus conhecimentos sobre as músicas de rap geek e anime! Adivinhe a música pelo áudio, envolvendo artistas como 7 Minutoz, Enygma e mais.",
  keywords: ["Geek Arena", "7 Minutoz", "7MZ", "Enygma", "quiz", "rap geek", "anime", "música nerd"],
  icons: {
    icon: "/geek-logo.svg",
    apple: "/geek-logo.svg",
  },
  openGraph: {
    title: "Geek Arena — O Quiz Definitivo de Rap Geek",
    description: "Teste seus conhecimentos sobre as músicas de rap geek e anime! Adivinhe a música pelo áudio.",
    url: "https://geekarena.vercel.app",
    siteName: "Geek Arena",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/geek-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Geek Arena - Quiz de Rap Geek",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Geek Arena — O Quiz Definitivo de Rap Geek",
    description: "Teste seus conhecimentos sobre as músicas de rap geek e anime!",
    images: ["/geek-banner.jpg"],
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
