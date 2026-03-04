import React from 'react';

interface FormattedTextProps {
    text: string;
    className?: string;
}

/**
 * 🛡️ SAFE FORMATTED TEXT
 * Replaces dangerouslySetInnerHTML for basic markup like **bold**, *italic*, or "quotes".
 */
export function FormattedText({ text, className }: FormattedTextProps) {
    if (!text) return null;

    // 1. Handle **bold**
    // 2. Handle *italic* (or _italic_)
    // 3. Handle &quot;...&quot; or "..." for specialized styling if needed

    // Split by ** as a simple first pass
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return (
        <div className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
                }

                // Handle &quot; for audit-trail/federated styles
                const subParts = part.split(/(&quot;.*?&quot;)/g);
                return subParts.map((sub, j) => {
                    if (sub.startsWith('&quot;') && sub.endsWith('&quot;')) {
                        return <i key={`${i}-${j}`} className="text-slate-300 italic">"{sub.slice(6, -6)}"</i>;
                    }
                    return sub;
                });
            })}
        </div>
    );
}
