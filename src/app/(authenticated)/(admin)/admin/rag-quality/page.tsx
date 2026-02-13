import { redirect } from "next/navigation";

export default function RagQualityRedirect() {
    redirect("/admin/ai?tab=rag-quality");
}
