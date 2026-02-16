import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface HubSection {
    titleKey: string;
    descriptionKey: string;
    href: string;
    icon: LucideIcon;
    color: string; // Tailwind border class, e.g., "border-l-blue-500"
}

interface HubDashboardProps {
    translationNamespace: string;
    sections: HubSection[];
}

export function HubDashboardTemplate({ translationNamespace, sections }: HubDashboardProps) {
    const t = useTranslations(translationNamespace);

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => (
                    <Link key={section.href} href={section.href} className="block group">
                        <Card className={`h-full hover:shadow-lg transition-all cursor-pointer border-l-4 ${section.color} group-hover:scale-[1.02]`}>
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <section.icon className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-xl tracking-tight">
                                        {t(section.titleKey as any)}
                                    </CardTitle>
                                </div>
                                <CardDescription className="leading-relaxed">
                                    {t(section.descriptionKey as any)}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageContainer>
    );
}
