import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HelpButton } from "@/components/ui/help-button";

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
    /** Optional URL to navigate back to */
    backHref?: string;
    /** Optional context ID for contextual help */
    helpId?: string;
    className?: string;
}

export function PageHeader({
    title,
    highlight,
    subtitle,
    actions,
    icon,
    children,
    backHref,
    helpId,
    className
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", className)}>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    {backHref && (
                        <Link
                            href={backHref}
                            className="p-2 hover:bg-muted rounded-full transition-colors group mr-1"
                            title="Volver"
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                        </Link>
                    )}
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            {icon ? (
                                <div className="shrink-0">{icon}</div>
                            ) : (
                                <span className="bg-primary w-1.5 h-8 rounded-full shrink-0" />
                            )}
                            {title}
                            {highlight && <span className="text-primary ml-1">{highlight}</span>}
                        </h1>
                        {helpId && (
                            <div className="shrink-0 -mb-1">
                                <HelpButton contextId={helpId} />
                            </div>
                        )}
                    </div>
                </div>
                {subtitle && (
                    <p className={cn("text-slate-500 dark:text-slate-400 pl-8 md:pl-0", (backHref || icon) && "ml-9 md:ml-0")}>
                        {subtitle}
                    </p>
                )}
                {children && (
                    <div className={cn("pt-2 pl-8 md:pl-0", (backHref || icon) && "ml-9 md:ml-0")}>
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

