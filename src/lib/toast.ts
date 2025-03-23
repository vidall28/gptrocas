
import { toast as sonnerToast } from 'sonner';

// Re-export toast functionality
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.message(message),
  // The warning method doesn't exist in sonner, use the info method instead
  warning: (message: string) => sonnerToast.message(message)
};
