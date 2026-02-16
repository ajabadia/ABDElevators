import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    /** The part of the title that should be highlighted in Teal */
    highlight?: string;
    subtitle?: string;
    /** Optional action buttons to render on the right side */
    actions?: React.ReactNode;
    /** Optional icon to render on the left side of the title */
    icon?: React.ReactNode;
    /** Optional children to render below the title/subtitle (extra header content) */
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    highlight,
    subtitle,
    actions,
    icon,
    children,
    className
}: PageHeaderProps) {
    // If highlight is provided, we try to find it in the title to wrap it.
    // However, the current pattern usually constructs the title manually.
    // Let's support a simple mode: Title + Highlight Word.

    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", className)}>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    {icon ? (
                        <div className="shrink-0">{icon}</div>
                    ) : (
                        <span className="bg-primary w-1.5 h-8 rounded-full shrink-0" />
                    )}
                    {title}
                    {highlight && <span className="text-primary ml-1">{highlight}</span>}
                </h1>
                {subtitle && (
                    <p className="text-slate-500 dark:text-slate-400 pl-8 md:pl-0">
                        {subtitle}
                    </p>
                )}
                {children && (
                    <div className="pt-2 pl-8 md:pl-0">
                        {children}
                    </div>
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
