import * as React from 'react';

import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/renderer/components/ui/sidebar';
import {
  ChatsSidebarContent,
  PromptsSidebarContent,
} from '@/renderer/components/sidebar-content';
import { ChatEntry, PromptEntry } from '@/common/types';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { SidebarToggle } from './sidebar-toggle';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { SettingsModal } from './modal-settings';

export const AppSidebar = React.memo(
  ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
    const [page, setPage] = React.useState<'chat' | 'prompt'>('chat');
    const [chatData, setChatData] = React.useState<ChatEntry[]>([]);
    const [promptData, setPromptData] = React.useState<PromptEntry[]>([]);
    const [loading, setLoading] = React.useState(true);

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

    return (
      <Sidebar {...props}>
        <SidebarGroup>
          <SidebarToggle callback={setPage} />
        </SidebarGroup>
        {page === 'chat' ? (
          <ChatsSidebarContent data={chatData} />
        ) : (
          <PromptsSidebarContent data={promptData} />
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Dialog>
                  <DialogTrigger asChild>
                    <SidebarMenuButton>
                      <Settings className="mr-2" />
                      Settings
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <SettingsModal triggerRefresh={handleRefresh} />
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </Sidebar>
    );
  },
);
