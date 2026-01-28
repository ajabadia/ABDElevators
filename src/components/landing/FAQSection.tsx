"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "./SectionHeading";

const FAQS = [
    {
        question: "¿Qué pasa si supero el límite de documentos?",
        answer: "No interrumpiremos tu servicio. Recibirás una alerta al llegar al 90% y 100%. Si superas el límite, se aplicará un cargo por 'overage' de 10€/1k documentos adicionales, o podrás actualizar tu plan instantáneamente."
    },
    {
        question: "¿Cómo funciona el aislamiento de datos multi-tenant?",
        answer: "Cada organización tiene su propio espacio de nombres vectorial y colecciones de base de datos lógicamente separadas. En los planes Enterprise, ofrecemos aislamiento físico (VPC dedicada) y claves de cifrado gestionadas por el cliente (CMK)."
    },
    {
        question: "¿Puedo cambiar de plan en cualquier momento?",
        answer: "Sí. Las actualizaciones (upgrades) son inmediatas y se prorratean. Las bajadas de plan (downgrades) se aplican al final del ciclo de facturación actual."
    },
    {
        question: "¿Ofrecen descuentos para startups o ONGs?",
        answer: "Sí, tenemos el programa 'ABD for Good' y 'ABD for Startups'. Contáctanos para recibir hasta un 50% de descuento durante el primer año."
    }
];

export function FAQSection() {
    return (
        <section className="py-24 bg-slate-900/30 relative">
            <div className="container mx-auto px-6 max-w-4xl">
                <SectionHeading
                    title="Preguntas Frecuentes"
                    subtitle="Todo lo que necesitas saber antes de empezar."
                />

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {FAQS.map((faq, idx) => (
                        <AccordionItem
                            key={idx}
                            value={`item-${idx}`}
                            className="bg-slate-900/50 border border-white/5 rounded-2xl px-6 data-[state=open]:border-teal-500/30 transition-all duration-300"
                        >
                            <AccordionTrigger className="text-lg font-bold text-slate-200 hover:text-white hover:no-underline py-6">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 text-base leading-relaxed pb-6">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
