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
        'display-linebreak bg-background-dim w-full overflow-hidden rounded-3xl border-2 border-card text-xs italic text-muted-foreground',
        className,
      )}
    >
      <div className="flex items-center justify-between bg-card px-4 text-base font-bold not-italic leading-tight text-card-foreground drop-shadow-xl">
        {isStreaming ? (
          <span className="animate-pulse">Thinking...</span>
        ) : (
          'Reasoning text'
        )}
        <Button
          variant="actionButton"
          className="text-muted-foreground hover:text-card-foreground focus:text-card-foreground"
          size="icon"
          onClick={() => setIsExpanded((prev) => !prev)}
          onMouseUp={(e) => e.currentTarget.blur()}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-transform duration-75',
              isExpanded && '-rotate-90',
            )}
          />
        </Button>
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
