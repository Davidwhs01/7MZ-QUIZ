import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050508",
};

export async function generateMetadata(): Promise<Metadata> {
  const headers = await import('next/headers').then(m => m.headers());
  const hostname = headers.get('host') || '';
  
  const isPop = hostname.includes('poparena');
  
  const baseUrl = isPop ? 'https://poparena.vercel.app' : 'https://geekarena.vercel.app';
  const title = isPop ? 'Pop Arena — O Quiz de Pop' : 'Geek Arena — O Quiz Definitivo de Rap Geek';
  const description = isPop 
    ? 'Teste seus conhecimentos sobre Pop! Adivinhe as músicas de Melanie Martinez, Mitski e mais.'
    : 'Teste seus conhecimentos sobre as músicas de rap geek e anime! Adivinhe a música pelo áudio.';
  const keywords = isPop 
    ? ["Pop Arena", "Melanie Martinez", "Mitski", "quiz", "pop", "música"]
    : ["Geek Arena", "7 Minutoz", "7MZ", "Enygma", "quiz", "rap geek", "anime", "música nerd"];
  const banner = isPop ? "/pop-banner.jpg" : "/geek-banner.jpg";
  const siteName = isPop ? "Pop Arena" : "Geek Arena";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords,
    icons: {
      icon: isPop ? "/pop-logo.jpg" : "/geek-logo.svg",
      apple: isPop ? "/pop-logo.jpg" : "/geek-logo.svg",
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName,
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: isPop ? "/pop-banner.jpg" : "/geek-banner.jpg",
          width: 1200,
          height: 630,
          alt: `${siteName} - Quiz`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [isPop ? "/pop-banner.jpg" : "/geek-banner.jpg"],
    },
  };
}

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
