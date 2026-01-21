import Link from 'next/link';
import { LayoutDashboard, FileText, History, Settings, MessageSquare } from 'lucide-react';

const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Documentación', href: '/admin/documentos', icon: FileText },
    { name: 'Auditoría RAG', href: '/admin/auditoria', icon: History },
    { name: 'Logs', href: '/admin/logs', icon: Settings },
    { name: 'Incidencias', href: '/admin/incidencias', icon: MessageSquare },
];

export function AdminSidebar() {
    return (
        <div className="w-64 h-screen bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-tight text-teal-400">ABD Elevators</h1>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Admin Panel</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors group"
                    >
                        <item.icon size={20} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                        <span className="font-medium">{item.name}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                v1.0.0 Professional Edition
            </div>
        </div>
    );
}
