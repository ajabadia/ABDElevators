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

import { Outfit } from "next/font/google";
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ABD RAG Plataform - Intelligent Technical Analysis",
    template: "%s | ABD RAG Plataform"
  },
  description: "Advanced RAG platform for technical documentation analysis, regulatory compliance, and industrial audit trail.",
  keywords: ["RAG", "AI", "Technical Analysis", "Industrial Audit", "Gemini 2.5 Flash", "Technical Documentation"],
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
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/context/SidebarContext";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { BrandingProvider } from "@/providers/BrandingProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

import { StructuredData } from "@/components/seo/StructuredData";
import { Toaster } from "sonner";

import { UxModeProvider } from "@/components/ux-mode-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const locale = await getLocale();
  const messages = await getMessages();

  // Phase 299: Hydrate UX mode from DB-persisted preferences
  const userUxMode = (session?.user as any)?.preferences?.uxMode;
  const initialExpertMode = userUxMode === 'expert';

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StructuredData />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider session={session}>
              <BrandingProvider>
                <SidebarProvider>
                  <UxModeProvider initialMode={userUxMode === 'expert' ? 'expert' : 'simple'}>
                    <Toaster position="top-right" richColors closeButton expand={false} duration={5000} />
                    {children}
                  </UxModeProvider>
                </SidebarProvider>
              </BrandingProvider>
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
