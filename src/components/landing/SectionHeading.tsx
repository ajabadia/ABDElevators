import { Badge } from "@/components/ui/badge";

interface SectionHeadingProps {
    badge?: string;
    title: string;
    subtitle?: string;
    description?: string;
    align?: 'left' | 'center';
    className?: string;
}

export function SectionHeading({ badge, title, subtitle, description, align = 'center', className = "" }: SectionHeadingProps) {
    const text = subtitle || description;
    return (
        <div className={`mb-16 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
            {badge && (
                <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-6 font-bold uppercase tracking-widest px-4 py-1.5 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                    {badge}
                </Badge>
            )}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-outfit text-white mb-6 tracking-tight leading-[1.1]">
                {title}
            </h2>
            {text && (
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mx-auto font-light">
                    {text}
                </p>
            )}
        </div>
    );
}
