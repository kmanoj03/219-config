import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Severity } from '../lib/types';
import { severityColorMap } from '../lib/types';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const iconMap = {
  LOW: Info,
  MEDIUM: AlertTriangle,
  HIGH: AlertCircle,
  CRITICAL: XCircle,
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const Icon = iconMap[severity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        severityColorMap[severity],
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {severity}
    </span>
  );
}
