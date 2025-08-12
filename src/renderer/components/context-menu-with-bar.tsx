import React from 'react';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from './ui/context-menu';
import { Button } from './ui/button';
import { cn } from '../utils/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface BarAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  render?: () => React.ReactNode; // custom renderer
}

export interface ContextMenuWithBarContentProps {
  barActions?: BarAction[]; // horizontal top bar actions
  children?: React.ReactNode; // standard vertical menu items
  className?: string;
  showSeparatorIfEmpty?: boolean;
}

/**
 * A context menu content wrapper with an optional horizontal bar of icon actions
 * Provide barActions for the top row, followed by regular items.
 */
export const ContextMenuWithBarContent: React.FC<
  ContextMenuWithBarContentProps
> = ({
  barActions = [],
  children,
  className,
  showSeparatorIfEmpty = false,
}) => {
  const hasBar = barActions.length > 0;
  return (
    <ContextMenuContent className={cn('min-w-[180px] p-1', className)}>
      {hasBar && (
        <div className="flex items-stretch gap-1 px-1 py-1">
          {barActions.map((a) => (
            <div key={a.key} className="flex">
              {a.render ? (
                a.render()
              ) : (
                <Tooltip delayDuration={400}>
                  <TooltipTrigger asChild>
                    <ContextMenuItem
                      // Use ContextMenuItem so selecting auto-closes menu
                      onSelect={(e) => {
                        if (a.disabled) {
                          e.preventDefault();
                          return;
                        }
                        a.onClick?.(e as unknown as React.MouseEvent);
                      }}
                      disabled={a.disabled}
                      className={cn(
                        'text-foreground/80 flex h-8 w-8 items-center justify-center rounded-md p-0 hover:text-foreground focus:bg-card-hover',
                        'data-[disabled]:opacity-50',
                      )}
                      // Remove default padding from ContextMenuItem
                    >
                      {a.icon}
                      <span className="sr-only">{a.label}</span>
                    </ContextMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{a.label}</TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      )}
      {(hasBar || showSeparatorIfEmpty) && <ContextMenuSeparator />}
      <div className="py-0.5">{children}</div>
    </ContextMenuContent>
  );
};

export { ContextMenuItem as ContextMenuWithBarItem };
