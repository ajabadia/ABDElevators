"use client";

import React from "react";
import { OnboardingWizardContainer } from "@/components/onboarding/onboarding-wizard-container";

export default function OnboardingPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(var(--primary-rgb),0.05)_0%,transparent_30%),radial-gradient(circle_at_80%_80%,rgba(var(--primary-rgb),0.05)_0%,transparent_30%)]" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />

      <OnboardingWizardContainer />
    </main>
  );
}
