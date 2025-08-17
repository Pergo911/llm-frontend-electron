/* eslint-disable no-nested-ternary */
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
import { RefreshCw, Settings } from 'lucide-react';
import { useCallback } from 'react';
import {
  ModelsController,
  ResolvedChat,
  ResolvedFolder,
  ResolvedPrompt,
  SaveFileController,
} from '@/common/types';
import { SidebarToggle } from './sidebar-toggle';
import { Dialog, DialogTrigger } from './ui/dialog';
import { SettingsModal } from './modal-settings';
import NewButton from './new-button';

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // eslint-disable-next-line react/no-unused-prop-types
  chats: ResolvedChat[];
  // eslint-disable-next-line react/no-unused-prop-types
  prompts: ResolvedPrompt[];
  // eslint-disable-next-line react/no-unused-prop-types
  folders: ResolvedFolder[];
  // eslint-disable-next-line react/no-unused-prop-types
  controller: SaveFileController;
  // eslint-disable-next-line react/no-unused-prop-types
  modelsController: ModelsController;
  // When streaming, disable sidebar actions
  isStreaming?: boolean;
}

export const AppSidebar = React.memo(
  ({
    chats,
    prompts,
    folders,
    controller,
    modelsController,
    isStreaming = false,
    ...props
  }: AppSidebarProps) => {
    const [page, setPage] = React.useState<'chat' | 'prompt'>('chat');
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    const handleSettingsOpen = useCallback((v: boolean) => {
      setSettingsOpen(v);
    }, []);

    React.useEffect(() => {
      const handleRefreshShortcut = (e: KeyboardEvent) => {
        if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
          e.preventDefault();
          if (!isStreaming) {
            controller.saveFile.reload();
            modelsController.reload();
          }
        }
      };

      window.addEventListener('keydown', handleRefreshShortcut);
      return () => window.removeEventListener('keydown', handleRefreshShortcut);
    }, [controller.saveFile, modelsController, isStreaming]);

    const handleRefresh = useCallback(() => {
      if (isStreaming) return;
      controller.saveFile.reload();
      modelsController.reload();
    }, [controller.saveFile, modelsController, isStreaming]);

    return (
      <Sidebar {...props}>
        <SidebarGroup className="draggable m-0 p-0 pl-2">
          <SidebarGroupContent className="flex h-[48px] items-center gap-0.5">
            <SidebarTrigger />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarHeader className="m-0 p-0">
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="flex items-center gap-0.5">
              <SidebarToggle callback={setPage} />
              <NewButton
                registerShortcut
                controller={controller}
                folders={folders}
                sidebarPage={page}
                disabled={isStreaming}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarHeader>
        {page === 'chat' ? (
          <ChatsSidebarContent
            chats={chats}
            controller={controller}
            disabled={isStreaming}
          />
        ) : (
          <PromptsSidebarContent
            folders={folders}
            controller={controller}
            disabled={isStreaming}
          />
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="flex-row">
              <SidebarMenuItem className="flex-1">
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <SidebarMenuButton
                      disabled={isStreaming}
                      aria-disabled={isStreaming}
                    >
                      <Settings className="mr-2" />
                      Settings
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <SettingsModal
                    triggerRefresh={handleRefresh}
                    onSetOpen={handleSettingsOpen}
                    open={settingsOpen}
                  />
                </Dialog>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleRefresh}
                  disabled={isStreaming}
                  aria-disabled={isStreaming}
                >
                  <RefreshCw className="h-4 w-4 flex-shrink-0" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </Sidebar>
    );
  },
);
