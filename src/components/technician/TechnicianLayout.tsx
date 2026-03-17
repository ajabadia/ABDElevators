"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  ClipboardCheck, 
  Search, 
  History, 
  User, 
  Bell, 
  Mic,
  Home,
  LayoutGrid
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TechnicianLayoutProps {
  children: React.ReactNode;
}

export function TechnicianLayout({ children }: TechnicianLayoutProps) {
  const t = useTranslations("technician");
  const pathname = usePathname();

  const navItems = [
    { id: "home", icon: Home, href: "/technician", label: t("nav.home") },
    { id: "work", icon: ClipboardCheck, href: "/technician/work", label: t("nav.work") },
    { id: "search", icon: Search, href: "/technician/search", label: t("nav.search") },
    { id: "history", icon: History, href: "/technician/history", label: t("nav.history") },
    { id: "profile", icon: User, href: "/technician/profile", label: t("nav.profile") },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-sm">
            ABD FIELD
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            {/* User Avatar Placeholder */}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4 scrollbar-hide">
        {children}
      </main>

      {/* Bottom Navigation Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-2 py-2 shrink-0 z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id} 
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 relative group",
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-500"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive ? "bg-indigo-50 dark:bg-indigo-500/10" : ""
              )}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Floating Action Button - Voice Assistant Trigger */}
      <button className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition-transform z-50">
        <Mic className="w-7 h-7" />
      </button>
    </div>
  );
}
