import { GoldenSetDetail } from "@/components/admin/rag/GoldenSetDetail";

export default async function GoldenSetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <GoldenSetDetail id={id} />
        </div>
    );
}
