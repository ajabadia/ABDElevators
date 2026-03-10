import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-[300px]" />
                    <Skeleton className="h-4 w-[500px]" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
                <Card className="lg:col-span-1 border-muted/40">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-muted/40 relative overflow-hidden bg-muted/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full p-12">
                            {/* Simulate a neural network/graph layout */}
                            <div className="absolute top-1/4 left-1/4 scale-150 opacity-20"><Skeleton className="h-12 w-12 rounded-full" /></div>
                            <div className="absolute top-1/2 left-1/2 scale-150 opacity-20"><Skeleton className="h-16 w-16 rounded-full" /></div>
                            <div className="absolute bottom-1/4 right-1/4 scale-150 opacity-20"><Skeleton className="h-10 w-10 rounded-full" /></div>
                            <div className="absolute top-1/3 right-1/3 scale-150 opacity-20"><Skeleton className="h-8 w-8 rounded-full" /></div>
                            <div className="absolute bottom-1/3 left-1/3 scale-150 opacity-20"><Skeleton className="h-14 w-14 rounded-full" /></div>
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-4 p-4 space-y-2 w-64 bg-background/80 backdrop-blur-sm rounded-lg border">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </Card>
            </div>
        </div>
    );
}
