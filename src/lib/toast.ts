
import { toast as sonnerToast } from 'sonner';

// Re-export toast functionality
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.message(message),
  warning: (message: string) => sonnerToast.error(message)
};
