import { cn } from '../lib/utils';
import type { Finding } from '../lib/types';
import { SeverityBadge } from './SeverityBadge';

interface FindingCardProps {
  finding: Finding;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function FindingCard({ 
  finding, 
  isSelected = false, 
  onSelect, 
  className 
}: FindingCardProps) {
  const codeMatch = finding.owaspTop10.match(/A(?:0[1-9]|10):2025/);
  const owaspCode = codeMatch ? codeMatch[0] : finding.owaspTop10;
  const owaspTitle = finding.owaspTop10.replace(/^A(?:0[1-9]|10):2025\s*-\s*/, '');

  return (
    <div
      className={cn(
        'border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md bg-card',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' 
          : 'border-border hover:border-primary/50',
        className
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-medium text-sm leading-tight">{finding.title}</h3>
        <div className="flex flex-col items-end gap-2">
          <SeverityBadge severity={finding.severity} />
          <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
            OWASP {owaspCode}
          </span>
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-medium text-xs text-muted-foreground mb-1">Evidence</h4>
          <p className="font-mono text-xs bg-muted/70 p-2 rounded border border-border/70">
            {finding.evidence}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-xs text-muted-foreground mb-1">Rationale</h4>
          <p className="text-muted-foreground">{finding.rationale}</p>
        </div>
        
        <div>
          <h4 className="font-medium text-xs text-muted-foreground mb-1">Recommendation</h4>
          <p className="text-muted-foreground">{finding.recommendation}</p>
        </div>

        <div>
          <h4 className="font-medium text-xs text-muted-foreground mb-1">OWASP Top 10</h4>
          <p className="text-muted-foreground text-xs">
            {owaspCode} - {owaspTitle}
          </p>
        </div>
        
        {finding.lineRange && (
          <div className="text-xs text-muted-foreground">
            Lines {finding.lineRange[0]}-{finding.lineRange[1]}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        {finding.lineRange && (
          <span className="text-xs text-muted-foreground">
            {finding.lineRange[1] - finding.lineRange[0] + 1} line(s)
          </span>
        )}
      </div>
    </div>
  );
}
