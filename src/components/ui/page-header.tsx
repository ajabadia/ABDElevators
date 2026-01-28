import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    /** The part of the title that should be highlighted in Teal */
    highlight?: string;
    subtitle?: string;
    /** Optional action buttons to render on the right side */
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    highlight,
    subtitle,
    actions,
    className
}: PageHeaderProps) {
    // If highlight is provided, we try to find it in the title to wrap it.
    // However, the current pattern usually constructs the title manually.
    // Let's support a simple mode: Title + Highlight Word.

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="bg-teal-600 w-1.5 h-8 rounded-full shrink-0" />
                    {title}
                    {highlight && <span className="text-teal-600">{highlight}</span>}
                </h1>
                {subtitle && (
                    <p className="text-slate-500 dark:text-slate-400 mt-1 pl-3.5 md:pl-0">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
