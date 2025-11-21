import { toast as toastHelper } from '@/components/ui/toast';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: ToastAction;
}

export function useToast() {
  return {
    toast: (options: ToastOptions) => {
      const { title, description, variant = 'default', action } = options;
      
      if (variant === 'destructive') {
        toastHelper.error(title, description, action);
      } else {
        toastHelper.success(title, description, action);
      }
    }
  };
}
