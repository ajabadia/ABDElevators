import { redirect } from "next/navigation";

export default function SpacesRedirect() {
    redirect("/admin/knowledge?tab=spaces");
}
