import React from 'react';

export function StructuredData() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "ABD RAG Platform",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Cloud-based",
        "url": "https://rag.abd.com",
        "description": "Plataforma inteligente de análisis de documentos técnicos, cumplimiento normativo y trazabilidad industrial mediante IA generativa y RAG.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "description": "Free Tier available for pilots"
        },
        "publisher": {
            "@type": "Organization",
            "name": "ABD Elevators",
            "url": "https://abdelevators.com",
            "logo": "https://rag.abd.com/logo-abd.png"
        },
        "featureList": [
            "Technical RAG Analysis",
            "Multi-tenant Isolation",
            "Automated Compliance Checks",
            "Industrial Audit Trail"
        ],
        "softwareVersion": "2.26",
        "inLanguage": ["es", "en", "fr", "de"]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
