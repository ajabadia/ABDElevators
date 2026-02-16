import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /** Defines the vertical spacing between children. Default is 'space-y-6' */
    spacing?: "tight" | "normal" | "loose" | "none";
}

export function PageContainer({
    children,
    className,
    spacing = "normal",
    ...props
}: PageContainerProps) {
    const spacingClasses = {
        tight: "space-y-4",
        normal: "space-y-6",
        loose: "space-y-8",
        none: ""
    };

    return (
        <div
            className={cn(
                "w-full animate-in fade-in duration-500",
                spacingClasses[spacing],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
