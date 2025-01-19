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
import { SidebarToggle } from './sidebar-toggle';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { SettingsModal } from './settings-modal';

// This is sample data.
const chatData: ChatEntry[] = [
  { title: 'Example chat 1', id: '0' },
  { title: 'Example chat 2', id: '1' },
];

const promptData: PromptEntry[] = [
  {
    title: 'Background Descriptions',
    id: '0',
    items: [
      { title: 'Prompt 1', id: '0', type: 'user' },
      { title: 'Prompt 2', id: '1', type: 'user' },
    ],
  },
  {
    title: 'Instructions',
    id: '1',
    items: [
      { title: 'Prompt 3', id: '2', type: 'user' },
      { title: 'Prompt 4', id: '3', type: 'user' },
    ],
  },
  {
    title: 'System Prompts',
    id: '2',
    items: [
      { title: 'Prompt 5', id: '4', type: 'system' },
      { title: 'Prompt 6', id: '5', type: 'system' },
    ],
  },
];

export const AppSidebar = React.memo(
  ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
    const [page, setPage] = React.useState<'chat' | 'prompt'>('chat');

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
                    <SettingsModal />
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarRail />
      </Sidebar>
    );
  },
);
