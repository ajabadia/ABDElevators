"use client";

import { ArrowRight, ShieldCheck, Cpu, Database, ChevronRight, Globe, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";

/**
 * Landing Page Redesign - Vision 2.0
 * Focus: Rich Aesthetics, Premium Design, Accessibility (WCAG 2.1), i18n
 */
export default function Home() {
  const navT = useTranslations('nav');
  const heroT = useTranslations('hero');
  const statsT = useTranslations('stats');
  const featT = useTranslations('features');

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
      {/* Navbar Premium con Glassmorphism */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center font-black text-white">A</div>
          <div className="text-xl font-black tracking-tighter text-white font-outfit">
            ABD<span className="text-teal-500"> RAG</span>
          </div>
        </Link>
        <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <a href="#soluciones" className="hover:text-teal-400 transition-colors">{navT('solutions')}</a>
          <a href="#tecnologia" className="hover:text-teal-400 transition-colors">{navT('technology')}</a>
          <a href="#seguridad" className="hover:text-teal-400 transition-colors">{navT('security')}</a>
        </div>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 font-bold text-sm">
              {navT('login')}
            </Button>
          </Link>
          <Button className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 shadow-lg shadow-teal-600/20">
            {navT('demo')}
          </Button>
        </div>
      </nav>

      {/* Hero Section - Estética High-Tech */}
      <section aria-labelledby="hero-heading" className="relative pt-32 pb-20 overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Background Decor (Efectos de luz) */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-teal-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full" />

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="z-10 text-left">
            <Badge className="mb-6 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-500">
              {heroT('badge')}
            </Badge>
            <h1 id="hero-heading" className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 font-outfit leading-[0.95] text-white animate-in fade-in slide-in-from-bottom-8 duration-700">
              {heroT('title')}
            </h1>
            <p className="max-w-xl text-lg text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
              {heroT('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <Button className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold rounded-2xl gap-3 group transition-all">
                {heroT('cta_main')}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 text-white text-lg font-bold rounded-2xl gap-3">
                <Zap className="text-teal-400" />
                {heroT('cta_sec')}
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8 animate-in fade-in duration-1000 delay-500">
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{statsT('accuracy')}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">&lt; 500ms</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{statsT('latency')}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">SOC2</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{statsT('compliant')}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 animate-in zoom-in duration-1000 delay-300">
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/hero-rag.png"
                alt="Visualización de la inteligencia central de ABD RAG Platform"
                width={800}
                height={800}
                className="rounded-2xl shadow-inner relative z-10"
                priority
              />
            </div>
            {/* Floating elements para dar profundidad */}
            <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce duration-[3000ms]">
              <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
                <Database size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{statsT('corpus_indexed')}</p>
                <p className="text-sm font-bold text-white">45.2k Documentos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="tecnologia" className="py-32 bg-slate-950 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-outfit text-white mb-4">{featT('title')}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{featT('subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Cpu className="text-teal-400" size={32} />}
              title={featT('f1_title')}
              description={featT('f1_desc')}
            />
            <FeatureCard
              icon={<Database className="text-blue-400" size={32} />}
              title={featT('f2_title')}
              description={featT('f2_desc')}
            />
            <FeatureCard
              icon={<ShieldCheck className="text-emerald-400" size={32} />}
              title={featT('f3_title')}
              description={featT('f3_desc')}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl rounded-[3rem] bg-gradient-to-br from-teal-600 to-teal-800 p-12 md:p-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 font-outfit">¿Listo para el siguiente nivel de eficiencia?</h2>
            <p className="text-teal-100 text-xl mb-12 max-w-3xl mx-auto font-medium">
              Únete a las empresas que ya están reduciendo sus tiempos de respuesta técnica en un 85%.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="h-16 px-10 bg-white text-teal-900 hover:bg-slate-100 text-xl font-black rounded-2xl shadow-xl">
                Solicitar Demo Custom
              </Button>
              <Button variant="ghost" className="h-16 px-10 text-white hover:bg-white/10 text-xl font-bold rounded-2xl border border-white/20">
                Hablar con Ventas
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center font-black text-white">A</div>
              <div className="text-xl font-black tracking-tighter text-white font-outfit">ABD RAG</div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Plataforma líder en inteligencia documental industrial y multi-tenant.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Producto</h4>
            <ul className="text-slate-500 text-sm space-y-2">
              <li className="hover:text-teal-400 cursor-pointer transition-colors">Características</li>
              <li className="hover:text-teal-400 cursor-pointer transition-colors">Seguridad</li>
              <li className="hover:text-teal-400 cursor-pointer transition-colors">Precios</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Empresa</h4>
            <ul className="text-slate-500 text-sm space-y-2">
              <li className="hover:text-teal-400 cursor-pointer transition-colors">Sobre Nosotros</li>
              <li className="hover:text-teal-400 cursor-pointer transition-colors">Contacto</li>
              <li className="hover:text-teal-400 cursor-pointer transition-colors">Legal</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Social</h4>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all">
                <Globe size={18} className="text-slate-400" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all">
                <Lock size={18} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-8 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-600 text-[10px] uppercase tracking-widest font-bold">
          <p>&copy; 2026 ABD RAG Plataform. Todos los derechos reservados.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-2 duration-300">
      <div className="mb-6 p-4 rounded-2xl bg-slate-900 w-fit group-hover:scale-110 transition-transform duration-500 shadow-xl border border-white/5">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4 font-outfit">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      <div className="mt-8 flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
        Saber más <ChevronRight size={14} />
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
