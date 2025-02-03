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

    // Store current scroll position
    const { scrollTop } = textareaRef.current;

    const taStyle = textareaRef.current.style;
    taStyle.height = 'auto';
    taStyle.height = `${textareaRef.current.scrollHeight}px`;

    // Restore scroll position
    textareaRef.current.scrollTop = scrollTop;
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit message</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[300px] overflow-y-auto rounded-xl bg-card text-card-foreground">
          <Textarea
            className="resize-none border-none shadow-none focus:outline-none focus-visible:ring-0"
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
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={() => handleDismiss()}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={() => handleConfirm()}>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

EditMessageModal.displayName = 'EditMessageModal';

export { EditMessageModal };
