import React from 'react';
import {
  Copy,
  Scissors,
  ClipboardPaste,
  Check,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import {
  ContextMenuWithBarContent,
  ContextMenuWithBarItem,
} from './context-menu-with-bar';

type Variant = 'normal' | 'edit-modal';

export interface TextareaWithContextMenuProps
  extends React.ComponentProps<'textarea'> {
  value: string;
  onValueChange?: (next: string) => void; // used for programmatic cut/paste
  variant?: Variant;
  onConfirm?: () => void; // edit-modal placeholder (optional to wire later)
  onConfirmRegen?: () => void; // edit-modal placeholder (optional to wire later)
}

/**
 * Textarea with a context menu. In 'normal' variant it renders vertical Cut/Copy/Paste.
 * In 'edit-modal' variant it renders a top bar with clipboard actions and two placeholder rows.
 */
export const TextareaWithContextMenu = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithContextMenuProps
>(
  (
    {
      value,
      onValueChange,
      variant = 'normal',
      onConfirm,
      onConfirmRegen,
      ...textareaProps
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    React.useImperativeHandle(
      ref,
      () => innerRef.current as HTMLTextAreaElement,
    );

    const [hasSelection, setHasSelection] = React.useState(false);
    const [hasClipboardText, setHasClipboardText] = React.useState(false);

    const refreshSelection = React.useCallback(() => {
      const ta = innerRef.current;
      if (!ta) {
        setHasSelection(false);
        return;
      }
      const sel = ta.selectionEnd - ta.selectionStart;
      setHasSelection(sel > 0);
    }, []);

    const refreshClipboard = React.useCallback(async () => {
      try {
        const clip = await navigator.clipboard.readText();
        setHasClipboardText(clip.length > 0);
      } catch {
        // If denied, assume unavailable
        setHasClipboardText(false);
      }
    }, []);

    const handleCopy = React.useCallback(() => {
      const ta = innerRef.current;
      if (!ta) return;
      ta.focus();
      try {
        const ok = document.execCommand('copy');
        if (!ok) {
          // Fallback: manual copy
          const { selectionStart, selectionEnd } = ta;
          if (selectionEnd > selectionStart) {
            const selected = ta.value.substring(selectionStart, selectionEnd);
            navigator.clipboard.writeText(selected);
          }
        }
      } catch {
        // ignore
      }
    }, []);

    const handleCut = React.useCallback(() => {
      const ta = innerRef.current;
      if (!ta) return;
      ta.focus();
      try {
        const ok = document.execCommand('cut');
        if (!ok) {
          // Fallback to manual only if permitted
          const { selectionStart, selectionEnd } = ta;
          if (selectionEnd > selectionStart) {
            const selected = ta.value.substring(selectionStart, selectionEnd);
            navigator.clipboard.writeText(selected);
            if (onValueChange) {
              const before = value.substring(0, selectionStart);
              const after = value.substring(selectionEnd);
              const next = before + after;
              onValueChange(next);
              requestAnimationFrame(() => {
                if (innerRef.current) {
                  innerRef.current.selectionStart = selectionStart;
                  innerRef.current.selectionEnd = selectionStart;
                }
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }, [onValueChange, value]);

    const handlePaste = React.useCallback(async () => {
      const ta = innerRef.current;
      if (!ta) return;
      ta.focus();
      try {
        const ok = document.execCommand('paste');
        if (!ok) {
          // Fallback: try clipboard and insertText to keep undo stack when possible
          try {
            const clip = await navigator.clipboard.readText();
            const inserted = document.execCommand('insertText', false, clip);
            if (!inserted && onValueChange) {
              const { selectionStart, selectionEnd } = ta;
              const before = value.substring(0, selectionStart);
              const after = value.substring(selectionEnd);
              const next = before + clip + after;
              const caretPos = selectionStart + clip.length;
              onValueChange(next);
              requestAnimationFrame(() => {
                if (innerRef.current) {
                  innerRef.current.selectionStart = caretPos;
                  innerRef.current.selectionEnd = caretPos;
                }
              });
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }, [onValueChange, value]);

    const onOpenChange = React.useCallback(
      (open: boolean) => {
        if (open) {
          refreshSelection();
          refreshClipboard();
        }
      },
      [refreshClipboard, refreshSelection],
    );

    const commonMenuItems = (
      <>
        <ContextMenuItem disabled={!hasSelection} onSelect={handleCopy}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection || !onValueChange}
          onSelect={handleCut}
        >
          <Scissors className="mr-2 h-4 w-4" /> Cut
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasClipboardText || !onValueChange}
          onSelect={handlePaste}
        >
          <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
        </ContextMenuItem>
      </>
    );

    const barActions = [
      {
        key: 'copy',
        label: 'Copy',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => handleCopy(),
        disabled: !hasSelection,
      },
      {
        key: 'cut',
        label: 'Cut',
        icon: <Scissors className="h-4 w-4" />,
        onClick: () => handleCut(),
        disabled: !hasSelection || !onValueChange,
      },
      {
        key: 'paste',
        label: 'Paste',
        icon: <ClipboardPaste className="h-4 w-4" />,
        onClick: () => handlePaste(),
        disabled: !hasClipboardText || !onValueChange,
      },
    ];

    return (
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger asChild>
          <Textarea
            {...textareaProps}
            value={value}
            ref={innerRef}
            onMouseUp={() => refreshSelection()}
            onKeyUp={() => refreshSelection()}
          />
        </ContextMenuTrigger>
        {variant === 'normal' ? (
          <ContextMenuContent>{commonMenuItems}</ContextMenuContent>
        ) : (
          <ContextMenuWithBarContent barActions={barActions}>
            {/* Placeholder items the user can wire up later */}
            <ContextMenuWithBarItem disabled={!onConfirm} onClick={onConfirm}>
              <Check className="mr-2 h-4 w-4" />
              Confirm
            </ContextMenuWithBarItem>
            <ContextMenuWithBarItem
              disabled={!onConfirmRegen}
              onClick={onConfirmRegen}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Confirm & Regenerate
            </ContextMenuWithBarItem>
          </ContextMenuWithBarContent>
        )}
      </ContextMenu>
    );
  },
);

TextareaWithContextMenu.displayName = 'TextareaWithContextMenu';

export default TextareaWithContextMenu;
