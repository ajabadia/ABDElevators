import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TicketListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-20 rounded-xl" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-3/4 rounded-xl" />
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-4 w-32 rounded-lg" />
                        <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TicketDetailSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-7 w-24 rounded-xl" />
                        <Skeleton className="h-7 w-20 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-40 rounded-full" />
                </div>
                <Skeleton className="h-10 w-2/3 rounded-2xl mb-4" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                    <Skeleton className="h-6 w-24 rounded-xl" />
                </div>
            </div>

            {/* Conversation */}
            <div className="space-y-8 py-8 border-l-2 border-slate-100 dark:border-slate-800 ml-5 pl-10">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("relative", i === 2 ? "flex flex-col items-end" : "")}>
                        <div className="absolute -left-[51px] top-0 w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-lg ring-4 ring-white dark:ring-slate-950" />
                        <div className={cn("space-y-2 w-full", i === 2 ? "max-w-[80%] items-end flex flex-col" : "max-w-[80%]")}>
                            <Skeleton className="h-3 w-32 rounded-lg" />
                            <Skeleton className={cn("h-24 w-full rounded-3xl")} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AdminTicketListSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-50 dark:border-slate-800/50 space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-20 rounded-lg" />
                            <Skeleton className="h-4 w-12 rounded-lg" />
                        </div>
                        <Skeleton className="h-6 w-3/4 rounded-lg" />
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <Skeleton className="h-4 w-24 mb-4 rounded-lg" />
                    <Skeleton className="h-10 w-16 rounded-xl" />
                </div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10 px-2">
                <div className="space-y-3">
                    <Skeleton className="h-14 w-96 rounded-2xl" />
                    <Skeleton className="h-4 w-[500px] rounded-xl" />
                </div>
                <Skeleton className="h-10 w-40 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-[2.5rem]" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="lg:col-span-2 h-[450px] rounded-[2.5rem]" />
                <Skeleton className="h-[450px] rounded-[2.5rem]" />
            </div>
            <Skeleton className="h-[500px] rounded-[2.5rem]" />
        </div>
    );
}
