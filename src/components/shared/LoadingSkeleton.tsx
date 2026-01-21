export function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
                ))}
            </div>
            <div className="h-64 bg-slate-200 rounded-lg mt-6"></div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
        </div>
    );
}

export function TableSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
            ))}
        </div>
    );
}
