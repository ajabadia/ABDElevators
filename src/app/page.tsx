"use client";

import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { EnterpriseSection } from "@/components/landing/EnterpriseSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactSection } from "@/components/landing/ContactSection";
import { FAQSection } from "@/components/landing/FAQSection";

/**
 * Landing Page - Versión Profesional 3.0
 * Optimizada para conversión y claridad de mensaje.
 * Cumple con estándares Enterprise & Compliance.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
      <PublicNavbar />

      {/* Hero con mensaje claro de valor */}
      <HeroSection />

      {/* Tecnología simplificada (4 features clave) */}
      <FeatureGrid />

      {/* Casos de uso por sector */}
      <SolutionsSection />

      {/* Enterprise & Compliance unificado */}
      <EnterpriseSection />

      {/* Pricing visible y transparente */}
      <PricingSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA final */}
      <CTASection />

      {/* Contacto */}
      <ContactSection />

      <PublicFooter />
    </div>
  );
}
