import { AppSidebar } from "@/components/shared/AppSidebar";
import { Header } from "@/components/shared/Header";
import { BrandingProvider } from "@/providers/BrandingProvider";

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <BrandingProvider>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
                <AppSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-8">
                        {children}
                    </main>
                </div>
            </div>
        </BrandingProvider>
    );
}
