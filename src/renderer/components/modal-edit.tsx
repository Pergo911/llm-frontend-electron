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
import { Textarea } from './ui/textarea';

export interface EditMessageModalRef {
  promptUser: (initialValue: string) => Promise<string | null>;
}

const EditMessageModal = forwardRef<EditMessageModalRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const resolveRef = useRef<(value: string | null) => void>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [textareaValue, setTextareValue] = useState('');

  const autoHeight = () => {
    if (textareaRef.current === null) return;
    const taStyle = textareaRef.current.style;
    taStyle.height = 'auto';
    taStyle.height = `${textareaRef.current.scrollHeight}px`;
  };

  useImperativeHandle(ref, () => ({
    promptUser: (initialValue: string) => {
      setTextareValue(initialValue);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          // Focus textarea
          textareaRef.current.focus();

          // Caret at end of text
          textareaRef.current.setSelectionRange(
            initialValue.length,
            initialValue.length,
          );

          // Set initial height
          autoHeight();
        }
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
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit message</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[300px] overflow-y-auto rounded-3xl bg-card text-card-foreground">
          <Textarea
            className="min-h-0 resize-none border-none px-4 py-2 shadow-none focus:outline-none focus-visible:ring-0"
            spellCheck="false"
            value={textareaValue}
            onChange={(e) => {
              setTextareValue(e.target.value);
              autoHeight();
            }}
            ref={textareaRef}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
            rows={1}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleDismiss}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

EditMessageModal.displayName = 'EditMessageModal';

export { EditMessageModal };
