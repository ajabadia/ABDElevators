import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function CTASection() {
    const t = useTranslations('cta');
    return (
        <section className="py-24 px-6 relative">
            {/* Background glow behind CTA */}
            <div className="absolute  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80% ] h-[80%] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto max-w-6xl rounded-[3rem] bg-gradient-to-br from-teal-600 to-teal-800 p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 font-outfit tracking-tight">{t('title')}</h2>
                    <p className="text-teal-100 text-xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                        {t('subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button className="h-16 px-10 bg-white text-teal-900 hover:bg-slate-100 hover:text-teal-950 text-xl font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-300">
                            {t('demo')}
                        </Button>
                        <Button variant="ghost" className="h-16 px-10 text-white hover:bg-white/10 hover:text-white text-xl font-bold rounded-2xl border border-white/20 hover:border-white/40 hover:-translate-y-1 transition-all duration-300">
                            {t('sales')}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
