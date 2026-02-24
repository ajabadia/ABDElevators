import { redirect } from 'next/navigation';

export default function MyDocumentsRedirect() {
    redirect('/admin/knowledge/my-docs');
}
