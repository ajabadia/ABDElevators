import SwaggerUIClient from '@/components/help/SwaggerUIClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'API Reference | ABD RAG Platform',
    description: 'Interactive technical documentation for the ABD RAG Platform API.',
};

export default function ApiHelpPage() {
    return <SwaggerUIClient />;
}
