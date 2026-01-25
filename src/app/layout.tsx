import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ABD RAG Plataform - Intelligent Technical Analysis",
    template: "%s | ABD RAG Plataform"
  },
  description: "Advanced RAG platform for technical documentation analysis, regulatory compliance, and industrial audit trail.",
  keywords: ["RAG", "AI", "Technical Analysis", "Industrial Audit", "Gemini 2.0", "Technical Documentation"],
  authors: [{ name: "ABD RAG Plataform Team" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://rag.abd.com",
    title: "ABD RAG Plataform - IA para Ingeniería",
    description: "Sintonizando la inteligencia con el mantenimiento preventivo y la gestión documental.",
    siteName: "ABD RAG Plataform",
  },
  twitter: {
    card: "summary_large_image",
    title: "ABD RAG Plataform - Sistema IA",
    description: "Plataforma inteligente de análisis de documentos y normativa técnica mediante RAG.",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/context/SidebarContext";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import BrandingProvider from "@/components/BrandingProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider session={session}>
              <BrandingProvider>
                <SidebarProvider>
                  {children}
                </SidebarProvider>
              </BrandingProvider>
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
