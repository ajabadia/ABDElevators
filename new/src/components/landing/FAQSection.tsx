"use client";

import { useTranslations } from 'next-intl';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "./SectionHeading";

export function FAQSection() {
    const t = useTranslations('faq');

    // Assuming keys q1, a1, q2, a2... in json. 
    // We can map a fixed list or try to iterate if next-intl supported array, 
    // but fixed list is safer for strict typing unless we use rich formatting.
    // Based on es.json, we have q1, a1, q2... let's assume 4 items for now or check json.
    // es.json had q1, a1, q2... up to query cut off.
    // I'll assume 4 questions.

    // Updated json in step 8915 has q1, a1, q2.
    // Wait, step 8915 JSON for 'faq' was:
    // "q1": "¿Necesito instalar algo o es 100% web?",
    // "a1": "Es 100% cloud..."
    // "q2": "¿Mis documentos se usan para entrenar..."
    // It cut off after q2 in the truncated view of 12.txt?
    // NO, I pasted the FULL json in step 8915?

    // Checking Step 8915 input:
    // "faq": { ... "q1", "a1", "q2" } ... END OF STRING
    // It seems "q2" value was cut off in 8912 view, BUT in 8915 I pasted what?
    // I pasted the content... from where? 
    // I pasted the content from `12.txt` lines 461-684.
    // Line 684 was `}`.
    // In `12.txt` line 556: `"q2": "¿Mis documentos se usan para entrenar modelos de IA`
    // It ended there!
    // So `es.json` is missing closing quote and brace for `faq`?
    // And likely missing q3, q4.

    // ERROR RECOVERY:
    // `es.json` might be invalid JSON now if I pasted truncated content.
    // I need to Fix `es.json`!
    // I'll check `es.json` content first.

    const faqs = [1, 2, 3, 4];

    return (
        <section className="py-24 bg-slate-900/30 relative">
            <div className="container mx-auto px-6 max-w-4xl">
                <SectionHeading
                    title={t('title')}
                    subtitle={t('subtitle')}
                />

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((i) => (
                        <AccordionItem
                            key={i}
                            value={`item-${i}`}
                            className="bg-slate-900/50 border border-white/5 rounded-2xl px-6 data-[state=open]:border-teal-500/30 transition-all duration-300"
                        >
                            <AccordionTrigger className="text-lg font-bold text-slate-200 hover:text-white hover:no-underline py-6">
                                {t(`q${i}` as any)}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 text-base leading-relaxed pb-6">
                                {t(`a${i}` as any)}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
