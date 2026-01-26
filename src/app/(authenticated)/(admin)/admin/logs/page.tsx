import { LogExplorer } from "@/components/admin/logs/LogExplorer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Logs de Sistema | Admin",
    description: "Visor de logs técnico para administración centralizada",
};

export default function LogsPage() {
    return (
        <div className="container mx-auto py-6">
            <LogExplorer />
        </div>
    );
}
