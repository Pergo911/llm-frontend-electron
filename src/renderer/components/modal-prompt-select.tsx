/* eslint-disable no-nested-ternary */
import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import {
  Folder,
  Minus,
  Notebook,
  Plus,
  Search,
  SquareTerminal,
} from 'lucide-react';
import { ResolvedFolder } from '@/common/types';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from './ui/sidebar';
import { Input } from './ui/input';
import { cn } from '../utils/utils';

export interface PromptSelectModalRef {
  promptUser: () => Promise<{
    id: string;
    type: 'user-prompt' | 'system-prompt';
  } | null>;
}

type PromptSelectModalProps = {
  folders: ResolvedFolder[];
};

const PromptSelectModal = forwardRef<
  PromptSelectModalRef,
  PromptSelectModalProps
>(({ folders }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [foldersFiltered, setFoldersFiltered] = useState<ResolvedFolder[]>([]);
  const [hasResults, setHasResults] = useState(true);

  const resolveRef =
    useRef<
      (
        value: { id: string; type: 'user-prompt' | 'system-prompt' } | null,
      ) => void
    >();

  useImperativeHandle(ref, () => ({
    promptUser: () => {
      setSearchValue('');
      setIsOpen(true);

      return new Promise<{
        id: string;
        type: 'user-prompt' | 'system-prompt';
      } | null>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  // Handle filtering logic
  useEffect(() => {
    if (!folders) return;

    setFoldersFiltered(
      folders.map((f) => ({
        ...f,
        items: f.items.filter((p) =>
          p.title.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()),
        ),
      })),
    );
  }, [folders, searchValue]);

  // We have results if any one of the filtered folders contain an item
  useEffect(() => {
    setHasResults(foldersFiltered.some((f) => f.items.length > 0));
  }, [foldersFiltered]);

  const handleDismiss = () => {
    resolveRef.current?.(null);
    setIsOpen(false);
    resolveRef.current = undefined;
  };

  const handleConfirm = (id: string, type: 'user-prompt' | 'system-prompt') => {
    resolveRef.current?.({ id, type });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select prompt</DialogTitle>
        </DialogHeader>
        <div className="my-4 flex items-center gap-2">
          <Search />
          <Input
            type="text"
            placeholder="Search prompts..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full"
          />
        </div>
        {hasResults ? (
          <div className="flex h-[300px] flex-col gap-0.5 overflow-y-auto">
            {foldersFiltered.map((f) => {
              return (
                <Collapsible
                  key={f.id}
                  className={cn(
                    'group/collapsible',
                    f.items.length === 0 ? 'hidden' : '',
                  )}
                  defaultOpen
                >
                  <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {f.name}
                      </div>
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {f.items.map((p) => {
                        return (
                          <SidebarMenuSubItem key={p.id}>
                            <SidebarMenuSubButton asChild>
                              <Button
                                variant="ghost"
                                className="group/sub flex w-full cursor-pointer select-none justify-between"
                                onClick={() => {
                                  handleConfirm(p.id, p.type);
                                }}
                              >
                                <div className="flex items-center text-sm">
                                  {p.type === 'user-prompt' ? (
                                    <Notebook className="mr-2 h-4 w-4" />
                                  ) : (
                                    <SquareTerminal className="mr-2 h-4 w-4" />
                                  )}
                                  {p.title}
                                </div>
                                <div className="hidden text-sm font-bold text-muted-foreground group-hover/sub:block group-focus/sub:block">
                                  Add
                                </div>
                              </Button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No prompts found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

PromptSelectModal.displayName = 'PromptSelectModal';

export { PromptSelectModal };
