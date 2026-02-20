import { toast as sonnerToast, ExternalToast } from "sonner"

type ToastVariant = "default" | "destructive" | "info"

type ToastProps = {
    title?: string
    description?: string
    variant?: ToastVariant
    duration?: number
} & ExternalToast

/**
 * Bridge for sonner to maintain compatibility with existing Shadcn-like calls.
 * Refactored for ERA 6 to ensure TypeScript Strict compliance and WCAG consistency.
 */
export const toast = ({ title, description, variant, duration, ...props }: ToastProps) => {
    const options: ExternalToast = {
        description,
        duration,
        ...props,
    }

    switch (variant) {
        case "destructive":
            return sonnerToast.error(title, options)
        case "info":
            return sonnerToast.info(title, options)
        default:
            return sonnerToast.success(title, options)
    }
}

export function useToast() {
    return {
        toast,
        dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    }
}
