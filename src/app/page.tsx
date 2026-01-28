"use client";

import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { EnterpriseSection } from "@/components/landing/EnterpriseSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { CTASection } from "@/components/landing/CTASection";

/**
 * Landing Page Redesign - Vision 2.0
 * Focus: Rich Aesthetics, Premium Design, Accessibility (WCAG 2.1), i18n
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
      <PublicNavbar />
      <HeroSection />
      <FeatureGrid />
      <SolutionsSection />
      <EnterpriseSection />
      <SecuritySection />
      <CTASection />
      <PublicFooter />
    </div>
  );
}
