import * as React from 'react';

import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/renderer/components/ui/sidebar';
import {
  ChatsSidebarContent,
  PromptsSidebarContent,
} from '@/renderer/components/sidebar-content';
import { ChatEntry, PromptEntry } from '@/common/types';
import { Loader2, Plus, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { SidebarToggle } from './sidebar-toggle';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { SettingsModal } from './modal-settings';
import { Button } from './ui/button';
import { useRefresh } from '../hooks/use-refresh';
import NewButton from './new-button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// Define the ref interface
export interface RefreshRef {
  refresh: () => void;
}

export const AppSidebar = React.memo(
  React.forwardRef<RefreshRef, React.ComponentProps<typeof Sidebar>>(
    (props, ref) => {
      const [page, setPage] = React.useState<'chat' | 'prompt'>('chat');
      const [chatData, setChatData] = React.useState<ChatEntry[]>([]);
      const [promptData, setPromptData] = React.useState<PromptEntry[]>([]);
      const [settingsOpen, setSettingsOpen] = React.useState(false);
      const [loading, setLoading] = React.useState(true);

      const refresh = useRefresh();

      React.useEffect(() => {
        const loadEntries = async () => {
          const { chatEntries, promptEntries, error } =
            await window.electron.fileOperations.getEntries();
          setChatData(chatEntries);
          setPromptData(promptEntries);
          setLoading(false);

          if (error) {
            toast.error(`Error loading entries: ${error}`);
          }
        };

        if (loading) {
          loadEntries();
        }
      }, [loading]);

      const handleRefresh = useCallback(() => {
        setLoading(true);
      }, []);

      React.useImperativeHandle(ref, () => ({
        refresh: handleRefresh,
      }));

      const handleSettingsOpen = useCallback((v: boolean) => {
        setSettingsOpen(v);
      }, []);

      return (
        <Sidebar {...props}>
          <SidebarGroup className="m-0 p-0 pl-2">
            <SidebarGroupContent className="flex h-[48px] items-center justify-between gap-0.5">
              <SidebarTrigger />
              <NewButton registerShortcut />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarHeader className="m-0 p-0">
            <SidebarGroup className="py-0">
              <SidebarGroupContent>
                <SidebarToggle callback={setPage} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarHeader>

          {page === 'chat' ? (
            <ChatsSidebarContent data={chatData} />
          ) : (
            <PromptsSidebarContent data={promptData} />
          )}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="flex-row">
                <SidebarMenuItem className="flex-1">
                  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DialogTrigger asChild>
                      <SidebarMenuButton>
                        <Settings className="mr-2" />
                        Settings
                      </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <SettingsModal
                        triggerRefresh={refresh}
                        onSetOpen={handleSettingsOpen}
                      />
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton onClick={refresh}>
                        <RefreshCw className="h-4 w-4 flex-shrink-0" />
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Refresh all</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Sidebar>
      );
    },
  ),
);
