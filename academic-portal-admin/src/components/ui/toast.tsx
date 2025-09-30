"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "./button";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const Toast = ({ id, type, title, description, action, onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
      ${colors[type]} animate-in slide-in-from-right-full duration-300
    `}>
      <div className={`flex-shrink-0 ${iconColors[type]}`}>
        {icons[type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        {description && (
          <div className="text-sm mt-1 opacity-90">{description}</div>
        )}
        {action && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="h-7 px-2 text-xs hover:bg-white/20"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onClose(id)}
        className="flex-shrink-0 h-6 w-6 p-0 hover:bg-white/20"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Global toast function
  useEffect(() => {
    (window as any).showToast = addToast;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

// Helper functions for common toast types
export const toast = {
  success: (title: string, description?: string, action?: Toast["action"]) => {
    (window as any).showToast?.({ type: "success", title, description, action });
  },
  error: (title: string, description?: string, action?: Toast["action"]) => {
    (window as any).showToast?.({ type: "error", title, description, action });
  },
  warning: (title: string, description?: string, action?: Toast["action"]) => {
    (window as any).showToast?.({ type: "warning", title, description, action });
  },
  info: (title: string, description?: string, action?: Toast["action"]) => {
    (window as any).showToast?.({ type: "info", title, description, action });
  },
};