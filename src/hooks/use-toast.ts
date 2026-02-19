import { toast as sonnerToast } from "sonner"

type ToastProps = {
    title?: string
    description?: string
    variant?: "default" | "destructive"
    action?: any
}

/**
 * Bridge for sonner to maintain compatibility with existing Shadcn-like calls.
 */
export const toast = ({ title, description, variant, ...props }: ToastProps) => {
    const options = {
        description,
        ...props,
    }

    if (variant === "destructive") {
        return sonnerToast.error(title, options)
    }

    return sonnerToast.success(title, options)
}

export function useToast() {
    return {
        toast,
        dismiss: (id?: string) => sonnerToast.dismiss(id),
    }
}
