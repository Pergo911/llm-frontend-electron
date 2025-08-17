import React from 'react';
import { Brain, ChevronDown, ChevronLeft, LoaderCircle } from 'lucide-react';
import { cn } from '../utils/utils';
import { Button } from './ui/button';

interface ReasoningBlockProps {
  isStreaming: boolean;
  children: React.ReactNode;
  className?: string;
}

const ReasoningBlock = ({
  isStreaming,
  children,
  className,
}: ReasoningBlockProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isExpanded) {
    return (
      <div
        className="group flex w-fit items-center justify-center gap-2 rounded-xl bg-background-dim px-4 text-xs text-muted-foreground hover:bg-card-hover focus:bg-card-hover"
        tabIndex={0}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded((prev) => !prev);
          }
        }}
        role="button"
      >
        {isStreaming ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            <span>Reasoning text</span>
          </>
        )}

        <ChevronLeft className="m-2 h-4 w-4 group-hover:text-foreground group-focus:text-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'display-linebreak w-full overflow-hidden rounded-xl bg-background-dim text-xs italic text-muted-foreground',
        className,
      )}
    >
      <div
        className="group flex items-center justify-between bg-background-dim px-4 not-italic leading-tight drop-shadow-xl hover:bg-card-hover focus:bg-card-hover"
        tabIndex={0}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded((prev) => !prev);
          }
        }}
        role="button"
      >
        {isStreaming ? (
          <div className="flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Reasoning text</span>
          </div>
        )}
        <ChevronDown className="m-2 h-4 w-4 group-hover:text-foreground group-focus:text-foreground" />
      </div>
      <div
        className={cn(
          'select-text overflow-y-auto p-6',
          !isExpanded && ['max-h-[50px]', 'flex flex-col justify-end'],
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default ReasoningBlock;
