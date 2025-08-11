import React, { useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuPortal,
  ContextMenuSubContent,
} from './ui/context-menu';
import { Button } from './ui/button';
import { cn } from '../utils/utils';

/**
 * Generic popover delete confirmation used throughout the app.
 * External state (open/onOpenChange) is allowed so triggers can react (e.g. Tailwind classes).
 */
export interface DeleteConfirmPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode; // Usually a Button
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string; // extra classes for PopoverContent
  /** When true a Cancel button is rendered */
  showCancel?: boolean;
}

export function DeleteConfirmPopover({
  open,
  onOpenChange,
  trigger,
  onConfirm,
  title = 'Delete?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  className,
  showCancel = true,
}: DeleteConfirmPopoverProps) {
  const shouldUnfocus = useRef(false);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        className={cn(
          'border-[0.5px] border-border bg-background-dim p-4 text-xs drop-shadow-md',
          className,
        )}
        onCloseAutoFocus={(e) => {
          if (shouldUnfocus.current) {
            e.preventDefault();
            shouldUnfocus.current = false;
          }
        }}
      >
        <div>
          <div className="text-lg font-bold">{title}</div>
          {description && (
            <div className="mt-1 text-muted-foreground">{description}</div>
          )}
        </div>
        <div className="h-4" />
        <div className="flex w-full justify-end gap-2">
          {showCancel && (
            <Button
              variant="outline"
              onMouseDown={() => {
                shouldUnfocus.current = true;
              }}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Generic context menu sub-item for delete confirmation.
 */
export interface DeleteConfirmContextSubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerChildren: React.ReactNode; // contents (icon + text) for the sub trigger
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  className?: string; // extra classes for sub content
}

export function DeleteConfirmContextSub({
  open,
  onOpenChange,
  triggerChildren,
  onConfirm,
  title = 'Delete?',
  description,
  confirmLabel = 'Confirm',
  className,
}: DeleteConfirmContextSubProps) {
  // Only allow opening when user explicitly clicks the trigger.
  const allowOpenRef = React.useRef(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      if (!allowOpenRef.current) {
        // Ignore hover / focus induced open
        return;
      }
      // consume the one allowed opening
      allowOpenRef.current = false;
      onOpenChange(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleClick = () => {
    allowOpenRef.current = true;
    onOpenChange(true);
  };

  return (
    <ContextMenuSub open={open} onOpenChange={handleOpenChange}>
      <ContextMenuSubTrigger
        className={cn(
          'text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground data-[state=open]:bg-destructive data-[state=open]:text-destructive-foreground',
        )}
        onClick={handleClick}
        // Prevent Radix from pre-opening on pointer enter by stopping pointermove propagation
        onPointerMove={(e) => {
          // If already open let events pass through
          if (!open) e.stopPropagation();
        }}
      >
        {triggerChildren}
      </ContextMenuSubTrigger>
      <ContextMenuPortal>
        <ContextMenuSubContent className={cn('w-72 text-xs', className)}>
          <div>
            <div className="text-lg font-bold">{title}</div>
            {description && (
              <div className="mt-1 text-muted-foreground">{description}</div>
            )}
          </div>
          <div className="h-4" />
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </ContextMenuSubContent>
      </ContextMenuPortal>
    </ContextMenuSub>
  );
}
