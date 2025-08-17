import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { cn } from '../utils/utils';

export interface InfoRow {
  label: string;
  value: React.ReactNode;
}

interface InfoPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode; // Button/icon
  rows: InfoRow[];
  className?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  open,
  onOpenChange,
  trigger,
  rows,
  className,
}) => {
  const shouldUnfocus = React.useRef(false);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {React.cloneElement(trigger as React.ReactElement, {
          onMouseLeave: () => onOpenChange(false),
          onMouseUp: (e: React.MouseEvent) => {
            shouldUnfocus.current = true;
            (e.currentTarget as HTMLElement).blur();
          },
        })}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className={cn(
          'w-fit border-[0.5px] border-border bg-background-dim p-2 text-xs drop-shadow-md',
          className,
        )}
        onCloseAutoFocus={(e) => {
          if (shouldUnfocus.current) {
            e.preventDefault();
            shouldUnfocus.current = false;
          }
        }}
      >
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="w-2" />
            <span>{r.value}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};

interface PrevNextControlsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  variant?: 'ghost' | 'actionButton';
  size?: 'icon' | 'default';
  disabled?: boolean; // optional global disable
  className?: string;
}

export const PrevNextControls: React.FC<PrevNextControlsProps> = ({
  current,
  total,
  onPrev,
  onNext,
  variant = 'actionButton',
  size = 'icon',
  disabled,
  className,
}) => {
  return (
    <div className={cn('flex select-none items-center', className)}>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || current === 0}
        onClick={onPrev}
      >
        {/* ChevronLeft icon will be injected by parent to keep icon tree-shake consistent if needed */}
        <span className="sr-only">Previous</span>
      </Button>
      <span className="mx-2 text-xs text-muted-foreground">
        {current + 1} / {total}
      </span>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || current === total - 1}
        onClick={onNext}
      >
        <span className="sr-only">Next</span>
      </Button>
    </div>
  );
};

export const ACTION_BUTTON_FADE_CLASSES = cn(
  'opacity-0 transition-opacity',
  'group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100',
);
