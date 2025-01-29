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
import { PromptEntry } from '@/common/types';
import {
  Folder,
  Minus,
  Notebook,
  Plus,
  Search,
  SquareTerminal,
} from 'lucide-react';
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
  promptUser: () => Promise<{ id: string; type: 'user' | 'system' } | null>;
}

const PromptSelectModal = forwardRef<PromptSelectModalRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptEntries, setPromptEntries] = useState<PromptEntry[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [filteredPromptEntries, setFilteredPromptEntries] = useState<
    PromptEntry[]
  >([]);

  const resolveRef =
    useRef<(value: { id: string; type: 'user' | 'system' } | null) => void>();

  const getEntries = async () => {
    const { promptEntries, error } =
      await window.electron.fileOperations.getEntries();

    if (error) {
      setError(error);
      return;
    }

    setPromptEntries(promptEntries);
  };

  useImperativeHandle(ref, () => ({
    promptUser: () => {
      getEntries();

      setIsOpen(true);

      return new Promise<{ id: string; type: 'user' | 'system' } | null>(
        (resolve) => {
          resolveRef.current = resolve;
        },
      );
    },
  }));

  const handleDismiss = () => {
    resolveRef.current?.(null);
    setIsOpen(false);
    resolveRef.current = undefined;
  };

  const handleConfirm = (id: string, type: 'user' | 'system') => {
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

  useEffect(() => {
    setFilteredPromptEntries(
      promptEntries.map((f) => ({
        ...f,
        items: f.items.filter((p) =>
          p.title.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()),
        ),
      })),
    );
  }, [promptEntries, searchValue]);

  const hasResults = filteredPromptEntries.some((f) => f.items.length > 0);

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
        {error ? (
          <div>Error: {error}</div>
        ) : promptEntries && !hasResults ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No prompts found
          </div>
        ) : (
          <div className="flex h-[300px] flex-col gap-0.5 overflow-y-auto">
            {filteredPromptEntries.map((f) => {
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
                        {f.title}
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
                            <SidebarMenuSubButton
                              onClick={() => {
                                handleConfirm(p.id, p.type);
                              }}
                              className="group/sub flex cursor-pointer select-none justify-between"
                            >
                              <div className="flex items-center text-sm">
                                {p.type === 'user' ? (
                                  <Notebook className="mr-2 h-4 w-4" />
                                ) : (
                                  <SquareTerminal className="mr-2 h-4 w-4" />
                                )}
                                {p.title}
                              </div>
                              <div className="hidden text-sm font-bold text-muted-foreground group-hover/sub:block">
                                Add
                              </div>
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
        )}
      </DialogContent>
    </Dialog>
  );
});

PromptSelectModal.displayName = 'PromptSelectModal';

export { PromptSelectModal };
