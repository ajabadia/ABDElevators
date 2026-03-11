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
import { ROICalculator } from "@/components/landing/ROICalculator";

/**
 * Landing Page - Versión Profesional 3.0 (RSC Optimized)
 * Optimizada para conversión y claridad de mensaje.
 * Cumple con estándares Enterprise & Compliance.
 * Refactored to Server Component for improved LCP and bundle size.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200 relative overflow-hidden">
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col">
        <PublicNavbar />

        {/* Hero con mensaje claro de valor */}
        <HeroSection />

        {/* Tecnología simplificada (4 features clave) */}
        <FeatureGrid />

        {/* Casos de uso por sector */}
        <SolutionsSection />

        {/* Enterprise & Compliance unificado */}
        <EnterpriseSection />

        {/* ROI Calculator */}
        <ROICalculator />

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
    </div>
  );
}
