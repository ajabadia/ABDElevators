import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ContentCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    noPadding?: boolean;
}

export function ContentCard({
    children,
    className,
    title,
    description,
    icon,
    noPadding = false,
    ...props
}: ContentCardProps) {
    return (
        <Card
            className={cn(
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden",
                className
            )}
            {...props}
        >
            {(title || icon) && (
                <CardHeader className="border-b border-slate-100 dark:border-slate-900 px-6 py-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        {icon && <span className="text-teal-500 shrink-0">{icon}</span>}
                        {title}
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className={cn("p-6", noPadding && "p-0")}>
                {children}
            </CardContent>
        </Card>
    );
}

// Re-export subcomponents for flexibility if needed, but ContentCard is the main wrapper wrapper
export { CardHeader, CardTitle, CardDescription, CardFooter };
