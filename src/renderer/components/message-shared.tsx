import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { cn } from '../utils/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface InfoRow {
  label: string;
  value: React.ReactNode;
  tooltip?: string;
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
          onMouseUp: (e: React.MouseEvent) => {
            shouldUnfocus.current = true;
            (e.currentTarget as HTMLElement).blur();
          },
        })}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className={cn(
          'flex w-fit flex-col gap-1.5 border-[0.5px] border-border bg-background-dim p-2 text-xs drop-shadow-md',
          className,
        )}
        onCloseAutoFocus={(e) => {
          if (shouldUnfocus.current) {
            e.preventDefault();
            shouldUnfocus.current = false;
          }
        }}
      >
        {rows.map((r) => {
          const content = (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="w-2" />
              <span>{r.value}</span>
            </div>
          );

          return r.tooltip ? (
            <Tooltip key={r.label}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent>{r.tooltip}</TooltipContent>
            </Tooltip>
          ) : (
            React.cloneElement(content, { key: r.label })
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export const ACTION_BUTTON_FADE_CLASSES = cn(
  'opacity-0 transition-opacity',
  'group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100',
);
