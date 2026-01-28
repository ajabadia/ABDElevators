"use client";

import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { VisionSection } from "@/components/landing/VisionSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { CTASection } from "@/components/landing/CTASection";

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            <main className="pt-20">
                <VisionSection />
                <ContactSection />
                <CTASection />
            </main>

            <PublicFooter />
        </div>
    );
}
