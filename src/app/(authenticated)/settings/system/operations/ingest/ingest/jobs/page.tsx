import { redirect } from 'next/navigation';

export default function IngestJobsRedirect() {
    redirect('/admin/operations/ingest');
}
