import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface CodeViewerProps {
  value: string;
  language?: string;
  highlightRange?: [number, number];
  className?: string;
}

export function CodeViewer({ 
  value, 
  language = 'text', 
  highlightRange, 
  className 
}: CodeViewerProps) {
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (highlightRange && codeRef.current) {
      const [start, end] = highlightRange;
      const lines = codeRef.current.querySelectorAll('.line');
      
      // Remove previous highlights
      lines.forEach(line => {
        line.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
      });
      
      // Add highlight to specified range
      for (let i = start - 1; i < end && i < lines.length; i++) {
        lines[i]?.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
      }
      
      // Scroll to highlighted area
      const firstHighlightedLine = lines[start - 1];
      if (firstHighlightedLine) {
        firstHighlightedLine.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [highlightRange]);

  const lines = value.split('\n');

  return (
    <div className={cn('relative border border-border rounded-xl overflow-hidden bg-card', className)}>
      <div className="bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        {language.toUpperCase()}
      </div>
      <pre
        ref={codeRef}
        className="bg-background p-4 overflow-auto max-h-[70vh] text-sm font-mono"
      >
        <code>
          {lines.map((line, index) => (
            <div key={index} className="line flex">
              <span className="text-muted-foreground select-none mr-4 w-8 text-right">
                {index + 1}
              </span>
              <span className="flex-1">{line || ' '}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
