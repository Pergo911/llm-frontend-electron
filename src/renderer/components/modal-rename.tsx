import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn, isInvalid } from '../utils/utils';

export interface RenameModalRef {
  promptUser: (
    itemType: 'chat' | 'prompt' | 'folder',
    initialValue: string,
  ) => Promise<string | null>;
}

const RenameModal = forwardRef<RenameModalRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const resolveRef = useRef<(value: string | null) => void>();
  const textareaRef = useRef<HTMLInputElement>(null);

  const [textareaValue, setTextareValue] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [invalid, setInvalid] = useState(false);

  useImperativeHandle(ref, () => ({
    promptUser: (
      itemType: 'chat' | 'prompt' | 'folder',
      initialValue: string,
    ) => {
      setTextareValue(initialValue);

      switch (itemType) {
        case 'chat':
          setHeaderText('Edit chat name');
          break;
        case 'prompt':
          setHeaderText('Edit prompt name');
          break;
        case 'folder':
          setHeaderText('Edit folder name');
          break;

        default:
          break;
      }

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      });

      setIsOpen(true);

      return new Promise<string | null>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  const handleDismiss = () => {
    resolveRef.current?.(null);
    setIsOpen(false);
    resolveRef.current = undefined;
  };

  const handleConfirm = () => {
    // If somehow the user manages to click the button while the input is invalid
    if (invalid) return;

    resolveRef.current?.(textareaValue);
    setIsOpen(false);
    resolveRef.current = undefined;
  };

  useEffect(() => {
    return () => {
      // Cleanup if component unmounts with pending promise
      resolveRef.current?.(null);
    };
  }, []);

  useEffect(() => {
    setInvalid(isInvalid(textareaValue));
  }, [textareaValue]);

  // Fixes bug where pointer events are disabled after closing the modal
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        document.body.style.pointerEvents = '';
      });
    }
    document.body.style.pointerEvents = 'auto';
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="w-[350px]">
        <DialogHeader>
          <DialogTitle>{headerText}</DialogTitle>
        </DialogHeader>
        <Input
          spellCheck="false"
          className={cn(invalid && 'border-red-500 focus-visible:ring-red-500')}
          value={textareaValue}
          onChange={(e) => {
            setTextareValue(e.target.value);
          }}
          ref={textareaRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={handleDismiss}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={invalid}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

RenameModal.displayName = 'RenameModal';

export { RenameModal };
