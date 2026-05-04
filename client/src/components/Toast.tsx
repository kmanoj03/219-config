import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Toast as ToastType } from '../lib/types';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'bg-white border-green-500 text-gray-900 shadow-lg dark:bg-gray-800 dark:border-green-400 dark:text-gray-100',
  error: 'bg-white border-red-500 text-gray-900 shadow-lg dark:bg-gray-800 dark:border-red-400 dark:text-gray-100',
  warning: 'bg-white border-yellow-500 text-gray-900 shadow-lg dark:bg-gray-800 dark:border-yellow-400 dark:text-gray-100',
  info: 'bg-white border-blue-500 text-gray-900 shadow-lg dark:bg-gray-800 dark:border-blue-400 dark:text-gray-100',
};

const iconColorMap = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  info: 'text-blue-500 dark:text-blue-400',
};

export function Toast({ toast, onRemove }: ToastProps) {
  const Icon = iconMap[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300',
        colorMap[toast.type]
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconColorMap[toast.type])} />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{toast.title}</h4>
        {toast.description && (
          <p className="text-sm opacity-90 mt-1">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-sm font-medium underline mt-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
