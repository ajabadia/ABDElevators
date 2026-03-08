import { redirect } from 'next/navigation';

export default function OpsReportsRedirect() {
    redirect('/admin/reports?tab=exports');
}
