import { redirect } from "next/navigation";

export default function KnowledgeAssetsRedirect() {
    redirect("/admin/knowledge?tab=assets");
}
