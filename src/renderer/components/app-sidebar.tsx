import * as React from 'react';

import {
  Sidebar,
  SidebarGroup,
  SidebarRail,
} from '@/renderer/components/ui/sidebar';
import {
  ChatsSidebarContent,
  PromptsSidebarContent,
} from '@/renderer/components/sidebar-content';
import { SidebarToggle } from './sidebar-toggle';

// This is sample data.
const chatData: ChatsSidebarContent = [
  { title: 'Example chat 1', id: '0', isActive: false },
  { title: 'Example chat 2', id: '1', isActive: false },
];

const promptData: PromptsSidebarContent = [
  {
    folderName: 'Background Descriptions',
    isSystemFolder: false,
    items: [
      { title: 'Prompt 1', id: '0', isActive: false, type: 'user' },
      { title: 'Prompt 2', id: '1', isActive: false, type: 'user' },
    ],
  },
  {
    folderName: 'Instructions',
    isSystemFolder: false,
    items: [
      { title: 'Prompt 3', id: '2', isActive: false, type: 'user' },
      { title: 'Prompt 4', id: '3', isActive: false, type: 'user' },
    ],
  },
  {
    folderName: 'System Prompts',
    isSystemFolder: true,
    items: [
      { title: 'Prompt 5', id: '4', isActive: false, type: 'system' },
      { title: 'Prompt 6', id: '5', isActive: false, type: 'system' },
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
        <SidebarRail />
      </Sidebar>
    );
  },
);
