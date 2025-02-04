import React from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
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

  return (
    <div
      className={cn(
        'display-linebreak w-full overflow-hidden rounded-xl bg-card text-xs italic text-muted-foreground',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between bg-accent px-4 text-base font-bold not-italic leading-tight text-accent-foreground',
          !isExpanded && 'drop-shadow-xl',
        )}
      >
        {isStreaming ? (
          <span className="animate-pulse">Reasoning...</span>
        ) : (
          'Reasoning text'
        )}
        <Button
          variant="actionButton"
          className="text-muted-foreground hover:text-accent-foreground focus:text-accent-foreground"
          size="icon"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div
        className={cn(
          'overflow-y-auto p-4',
          !isExpanded && ['max-h-[50px]', 'flex flex-col justify-end'],
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default ReasoningBlock;
