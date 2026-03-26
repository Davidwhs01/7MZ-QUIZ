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
  title: "7MZ Arena — O Quiz Definitivo de Rap Geek",
  description: "Teste seus conhecimentos sobre as músicas do 7 Minutoz! Adivinhe a música pelo áudio, complete a letra e muito mais.",
  keywords: ["7 Minutoz", "7MZ", "quiz", "rap geek", "anime", "música"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
