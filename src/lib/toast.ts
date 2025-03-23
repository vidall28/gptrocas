
import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  duration?: number;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => sonnerToast.success(message, options),
  error: (message: string, options?: ToastOptions) => sonnerToast.error(message, options),
  info: (message: string, options?: ToastOptions) => sonnerToast.info(message, options),
  message: (message: string, options?: ToastOptions) => sonnerToast(message, options), // Corrected from warning to message
  loading: (message: string, options?: ToastOptions) => sonnerToast.loading(message, options),
  dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
};
