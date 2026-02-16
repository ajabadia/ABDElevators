import { redirect } from 'next/navigation';

export default function LogsRedirect() {
    redirect('/admin/operations/logs');
}
