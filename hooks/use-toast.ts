import { toast as sonnerToast } from "sonner"

type ToastProps = {
    title?: string
    description?: string
    variant?: "default" | "destructive" | "success"
}

export function toast({ title, description, variant = "default" }: ToastProps) {
    if (variant === "destructive") {
        sonnerToast.error(title, {
            description,
        })
    } else if (variant === "success") {
        sonnerToast.success(title, {
            description,
        })
    } else {
        sonnerToast(title, {
            description,
        })
    }
}

toast.success = (title: string, description?: string) => {
    sonnerToast.success(title, { description })
}

toast.error = (title: string, description?: string) => {
    sonnerToast.error(title, { description })
}

toast.info = (title: string, description?: string) => {
    sonnerToast(title, { description })
}
