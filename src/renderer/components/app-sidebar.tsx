import * as React from 'react';

import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import AddRefreshButtonGroup from './add-refresh-buttongroup';
import { useRefresh } from '../hooks/use-refresh';

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
          <SidebarHeader className="m-0 p-0">
            <SidebarGroup>
              <SidebarGroupContent className="flex items-center gap-0.5">
                <SidebarToggle callback={setPage} />
                <AddRefreshButtonGroup />
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
              <SidebarMenu>
                <SidebarMenuItem>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Sidebar>
      );
    },
  ),
);
