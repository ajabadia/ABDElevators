"use client";

import { ArrowRight, ShieldCheck, Cpu, Database, ChevronRight, Globe, Lock, Zap, GitBranch, Users, CreditCard, Shield } from "lucide-react";
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
  const solT = useTranslations('solutions');
  const secT = useTranslations('security');

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
              <Link href="/login">
                <Button className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold rounded-2xl gap-3 group transition-all">
                  {heroT('cta_main')}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/arquitectura">
                <Button variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 text-white text-lg font-bold rounded-2xl gap-3">
                  <Zap className="text-teal-400" />
                  {heroT('cta_sec')}
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8 animate-in fade-in duration-1000 delay-500">
              <div>
                <p className="text-2xl font-bold text-white">Multi-Tenant</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Aislamiento Total</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">&lt; 500ms</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{statsT('latency')}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">Hardened</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Enterprise Security</p>
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
              link="/features/dual-engine"
            />
            <FeatureCard
              icon={<Database className="text-blue-400" size={32} />}
              title={featT('f2_title')}
              description={featT('f2_desc')}
              link="/features/vector-search"
            />
            <FeatureCard
              icon={<ShieldCheck className="text-emerald-400" size={32} />}
              title={featT('f3_title')}
              description={featT('f3_desc')}
              link="/features/audit-trail"
            />
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="soluciones" className="py-32 bg-slate-900/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-outfit text-white mb-4">{solT('title')}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{solT('subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SolutionCard
              title={solT('s1_title')}
              description={solT('s1_desc')}
              image="/solutions-industrial.png"
            />
            <SolutionCard
              title={solT('s2_title')}
              description={solT('s2_desc')}
              image="/solutions-legal.png"
            />
            <SolutionCard
              title={solT('s3_title')}
              description={solT('s3_desc')}
              image="/solutions-it.png"
            />
          </div>
        </div>
      </section>

      {/* Enterprise Management Section - NEW */}
      <section className="py-32 bg-slate-950 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-6 font-bold uppercase tracking-widest px-4 py-1.5">
              <ShieldCheck size={12} className="mr-2" />
              Enterprise-Grade
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-outfit text-white mb-4">Gestión Empresarial Avanzada</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Herramientas de gobernanza y control diseñadas para organizaciones que exigen lo mejor.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnterpriseFeature
              icon={<GitBranch className="text-teal-400" size={24} />}
              title="Workflows Personalizables"
              description="Estados y transiciones adaptados a tu proceso de negocio específico."
            />
            <EnterpriseFeature
              icon={<Users className="text-blue-400" size={24} />}
              title="Invitaciones Seguras"
              description="Onboarding de usuarios con tokens de un solo uso y expiración automática."
            />
            <EnterpriseFeature
              icon={<CreditCard className="text-amber-400" size={24} />}
              title="Dashboard de Consumo"
              description="Métricas en tiempo real de uso de IA, almacenamiento y búsquedas vectoriales."
            />
            <EnterpriseFeature
              icon={<Shield className="text-emerald-400" size={24} />}
              title="RBAC Granular"
              description="Control de permisos por rol con activación/desactivación de módulos por usuario."
            />
          </div>
        </div>
      </section>

      {/* Security Section - Premium Block */}
      <section id="seguridad" className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-20 backdrop-blur-3xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 font-bold uppercase tracking-widest px-4 py-1.5">
                  <Lock size={12} className="mr-2" />
                  Security First
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black font-outfit text-white mb-8">{secT('title')}</h2>
                <p className="text-slate-400 text-lg mb-12 leading-relaxed">{secT('subtitle')}</p>

                <div className="space-y-8">
                  <SecurityFeature
                    title={secT('f1_title')}
                    description={secT('f1_desc')}
                  />
                  <SecurityFeature
                    title={secT('f2_title')}
                    description={secT('f2_desc')}
                  />
                  <SecurityFeature
                    title={secT('f3_title')}
                    description={secT('f3_desc')}
                  />
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-[2.5rem] border border-white/10 bg-slate-950 p-4 shadow-2xl overflow-hidden">
                  <Image
                    src="/security-dashboard.png"
                    alt="Security Dashboard"
                    width={600}
                    height={400}
                    className="rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 w-full h-auto object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Health Status</p>
                        <p className="text-sm text-emerald-400 font-medium">All systems operational</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-bold">
                      ENCRYPTION: AES-256
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <li><a href="#tecnologia" className="hover:text-teal-400 cursor-pointer transition-colors">Características</a></li>
              <li><a href="#seguridad" className="hover:text-teal-400 cursor-pointer transition-colors">Seguridad</a></li>
              <li className="text-slate-600 cursor-not-allowed">Precios (Próximamente)</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Empresa</h4>
            <ul className="text-slate-500 text-sm space-y-2">
              <li className="text-slate-600 cursor-not-allowed">Sobre Nosotros (Próximamente)</li>
              <li className="text-slate-600 cursor-not-allowed">Contacto (Próximamente)</li>
              <li><a href="/terms" className="hover:text-teal-400 cursor-pointer transition-colors">Legal</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Social</h4>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all opacity-50 cursor-not-allowed" title="Próximamente">
                <Globe size={18} className="text-slate-400" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all opacity-50 cursor-not-allowed" title="Próximamente">
                <Lock size={18} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-8 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-500 text-[10px] uppercase tracking-widest font-bold">
          <p>&copy; 2026 ABD RAG Platform. Todos los derechos reservados.</p>
          <div className="flex gap-12 mt-4 md:mt-0">
            <a href="/privacy" className="hover:text-white cursor-pointer transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white cursor-pointer transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, link }: { icon: React.ReactNode; title: string; description: string; link?: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-2 duration-300">
      <div className="mb-6 p-4 rounded-2xl bg-slate-900 w-fit group-hover:scale-110 transition-transform duration-500 shadow-xl border border-white/5">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4 font-outfit">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      {link ? (
        <Link href={link}>
          <div className="mt-8 flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
            Saber más <ChevronRight size={14} />
          </div>
        </Link>
      ) : (
        <div className="mt-8 flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
          Próximamente <ChevronRight size={14} />
        </div>
      )}
    </div>
  );
}

function SolutionCard({ title, description, image }: { title: string; description: string; image: string }) {
  return (
    <div className="group relative rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900/50 hover:border-teal-500/30 transition-all duration-500">
      <div className="aspect-[16/10] overflow-hidden relative">
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-bold text-white mb-3 font-outfit">{title}</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{description}</p>
        <Button variant="ghost" className="p-0 h-auto text-teal-400 hover:text-white hover:bg-transparent font-bold flex items-center gap-2 group/btn">
          Explorar Solución <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}

function SecurityFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform duration-300" />
      <div>
        <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function EnterpriseFeature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-1 duration-300">
      <div className="mb-4 p-3 rounded-xl bg-slate-900 w-fit group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
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
