import { getSession } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { TechnicianLayout } from "@/components/technician/TechnicianLayout";
import { 
  ClipboardCheck, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  AlertTriangle,
  Zap,
  Clock,
  Wrench
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Technician Hub | ABD Field",
  description: "Field service dashboard for technical professionals.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default async function TechnicianPage() {
  const session = await getSession();
  const t = await getTranslations("technician");

  // Mock data for the field worker
  const activeTask = {
    id: "TASK-7821",
    type: "PREVENTIVE",
    location: "Torre Pelli, Sevilla",
    status: "IN_PROGRESS",
    startTime: "09:30",
    priority: "HIGH"
  };

  const schedulePreview = [
    { id: "1", time: "11:00", type: "REPAIR", title: "Arca II Sync Error", location: "Edificio Viapol" },
    { id: "2", time: "13:30", type: "INSPECCIÓN", title: "Trimestral Ascensor B", location: "Hotel Alfonso XIII" },
  ];

  return (
    <TechnicianLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("welcome")}, {session?.user?.name?.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>Sevilla, Sector Sur</span>
          </div>
        </div>

        {/* Active Task Card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {t("active_status")}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">#{activeTask.id}</span>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
            {activeTask.type}: {activeTask.location}
          </h2>
          
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 mb-6">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>{t("since")} {activeTask.startTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Wrench className="w-4 h-4 text-emerald-500" />
              <span>Arca II Controller</span>
            </div>
          </div>

          <Link 
            href={`/technician/work/${activeTask.id}`}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-colors shadow-lg shadow-indigo-600/20"
          >
            {t("continue_work")}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-3xl p-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800/30 rounded-2xl flex items-center justify-center mb-3">
              <ClipboardCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">12</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t("stats.completed")}</div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 rounded-3xl p-4">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-800/30 rounded-2xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">2</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t("stats.critical")}</div>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("next_tasks")}</h3>
            <Link href="/technician/calendar" className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {t("view_calendar")}
            </Link>
          </div>

          <div className="space-y-3">
            {schedulePreview.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 active:scale-[0.98] transition-all">
                <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.time}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{item.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 dark:text-white font-bold truncate">{item.title}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs truncate">{item.location}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </TechnicianLayout>
  );
}
