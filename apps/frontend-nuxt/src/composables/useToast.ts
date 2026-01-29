import { toast as sonnerToast } from 'vue-sonner'

export const useToast = () => {
  const toast = {
    success: (message: string) => sonnerToast.success(message),
    error: (message: string) => sonnerToast.error(message),
    info: (message: string) => sonnerToast(message),
    warning: (message: string) => sonnerToast.warning(message),
  }

  return toast
}
