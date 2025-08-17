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

export interface DeleteModalRef {
  promptUser: () => Promise<boolean>;
}

const DeleteModal = forwardRef<DeleteModalRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const resolveRef = useRef<(value: boolean) => void>();

  useImperativeHandle(ref, () => ({
    promptUser: () => {
      setIsOpen(true);

      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  const handleDismiss = () => {
    resolveRef.current?.(false);
    setIsOpen(false);
    resolveRef.current = undefined;
  };

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setIsOpen(false);
    resolveRef.current = undefined;
  };

  useEffect(() => {
    return () => {
      // Cleanup if component unmounts with pending promise
      resolveRef.current?.(false);
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && handleDismiss()}
      modal
    >
      <DialogContent className="w-[350px]">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This item will be permanently removed.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleDismiss}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} variant="destructive">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

DeleteModal.displayName = 'DeleteModal';

export { DeleteModal };
