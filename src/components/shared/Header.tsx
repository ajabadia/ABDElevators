import { Bell, User, Search } from 'lucide-react';

export function Header() {
    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar pedidos, componentes o manuales..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-slate-200 mx-1"></div>
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">Tech User</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Departamento Técnico</p>
                    </div>
                    <div className="w-10 h-10 bg-teal-100 border border-teal-200 text-teal-700 rounded-full flex items-center justify-center font-bold shadow-inner">
                        TU
                    </div>
                </div>
            </div>
        </header>
    );
}
