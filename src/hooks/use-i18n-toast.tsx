"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, AlertCircle, Info, Bell, Loader2 } from "lucide-react"

export type ToastVariant = "success" | "error" | "info" | "warning" | "loading"

export function useI18nToast() {
    const t = useTranslations("common.notifications")

    const showToast = (
        key: string,
        variant: ToastVariant = "info",
        values?: Record<string, any>
    ) => {
        const icons = {
            success: <CheckCircle2 className="text-emerald-500 w-4 h-4" />,
            error: <AlertCircle className="text-red-500 w-4 h-4" />,
            info: <Info className="text-blue-500 w-4 h-4" />,
            warning: <Bell className="text-amber-500 w-4 h-4" />,
            loading: <Loader2 className="text-teal-500 w-4 h-4 animate-spin" />
        }

        const toastFn = variant === "loading" ? toast.loading : variant === "error" ? toast.error : variant === "success" ? toast.success : toast

        return toastFn(t(`${variant}.title`), {
            description: t(key, values),
            icon: icons[variant],
            className: "group bg-background/80 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl",
            descriptionClassName: "text-muted-foreground font-medium text-[10px]",
            action: {
                label: t("dismiss") || "Cerrar",
                onClick: () => { }
            }
        })
    }

    return {
        success: (key: string, values?: Record<string, any>) => showToast(key, "success", values),
        error: (key: string, values?: Record<string, any>) => showToast(key, "error", values),
        info: (key: string, values?: Record<string, any>) => showToast(key, "info", values),
        warning: (key: string, values?: Record<string, any>) => showToast(key, "warning", values),
        loading: (key: string, values?: Record<string, any>) => showToast(key, "loading", values),
        dismiss: toast.dismiss
    }
}
