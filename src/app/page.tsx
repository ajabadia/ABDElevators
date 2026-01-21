import { ArrowRight, ShieldCheck, Cpu, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900">
      {/* Navbar Simple */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
        <div className="text-2xl font-black tracking-tighter text-slate-900 font-outfit">
          ABD<span className="text-teal-600">Elevators</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest text-slate-500">
          <a href="#" className="hover:text-teal-600 transition-colors">Soluciones</a>
          <a href="#" className="hover:text-teal-600 transition-colors">Tecnología</a>
          <a href="#" className="hover:text-teal-600 transition-colors">Contacto</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" className="border-slate-300 hover:bg-slate-50 font-bold">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/pedidos">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full px-6">
              Acceso Técnicos
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-b from-slate-50 to-white">
        <Badge className="mb-6 bg-teal-100 text-teal-700 hover:bg-teal-100 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
          Próxima Generación RAG
        </Badge>
        <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight mb-8 font-outfit leading-[1.1]">
          Sintonizando la <span className="text-teal-600 italic">inteligencia</span> con el mantenimiento preventivo.
        </h1>
        <p className="max-w-2xl text-lg text-slate-500 mb-12 leading-relaxed">
          Plataforma de análisis técnico avanzado para la industria del transporte vertical.
          Auditamos pedidos, extraemos modelos y consultamos manuales corporativos en milisegundos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/pedidos">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg px-10 h-14 rounded-xl shadow-xl shadow-teal-600/20 gap-2">
              Empezar Ahora <ArrowRight size={20} />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-slate-200 text-slate-600 font-bold text-lg px-10 h-14 rounded-xl">
            Ver Demo
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-32 max-w-6xl w-full">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Cpu size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">IA Gemini 2.0</h3>
            <p className="text-slate-500 text-sm">Extracción precisa de componentes y modelos técnicos en segundos.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Database size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Corpus RAG</h3>
            <p className="text-slate-500 text-sm">Base de conocimiento vectorizada con manuales oficiales de ingeniería.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Audit-Ready</h3>
            <p className="text-slate-500 text-sm">Trazabilidad completa de cada decisión asistida por inteligencia artificial.</p>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm font-medium">
        &copy; 2026 ABDElevators. Todos los derechos reservados.
      </footer>
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
