/* eslint-disable no-use-before-define */
/* eslint-disable no-nested-ternary */
import React, { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Brain,
  ChevronDown,
  ChevronsUpDown,
  Folder,
  Home,
  MessageCircle,
  Notebook,
  SlidersHorizontal,
  SquareTerminal,
  TriangleAlert,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from './ui/sidebar';
import { Button } from './ui/button';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

const HomeBreadcrumb = () => {
  return (
    <BreadcrumbList>
      <BreadcrumbItem>
        <Home className="h-4 w-4" />
        Home
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const ChatBreadcrumb = ({ chatData }: { chatData: string | undefined }) => {
  return (
    <BreadcrumbList>
      <BreadcrumbItem className="min-w-0 max-w-36 lg:max-w-80">
        <MessageCircle className="h-4 w-4 shrink-0" />
        <span className="truncate">{chatData}</span>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const PromptBreadcrumb = ({
  promptData,
}: {
  promptData:
    | { folder: string; name: string; type: 'user' | 'system' }
    | undefined;
}) => {
  return (
    <BreadcrumbList className="">
      <BreadcrumbItem className="min-w-0 max-w-36">
        <Folder className="h-4 w-4 shrink-0" />
        <span className="truncate">{promptData?.folder ?? ''}</span>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="" />
      <BreadcrumbItem className="min-w-0 max-w-40">
        {promptData?.type === 'user' ? (
          <Notebook className="h-4 w-4 shrink-0" />
        ) : (
          <SquareTerminal className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{promptData?.name ?? ''}</span>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const ErrorOrLoadingBreadcrumb = ({ error }: { error: string | null }) => {
  return (
    <BreadcrumbList>
      <BreadcrumbItem>
        {error ? (
          <div className="min-w-0 max-w-40">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        ) : (
          <div className="animate-pulse">Loading...</div>
        )}
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const ModelSelector = () => {
  return (
    <Button
      aria-label="Select model"
      title="Select model"
      className="group/button non-draggable"
      variant="ghost"
      size="sm"
    >
      <Brain />
      <ChevronDown className="text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground" />
    </Button>
  );
};

function GenSettings() {
  return (
    <Button
      aria-label="Generation settings"
      title="Generation settings"
      className="group/button non-draggable"
      variant="ghost"
      size="sm"
    >
      <SlidersHorizontal />
      <ChevronDown className="ml-auto text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground" />
    </Button>
  );
}

export default function TitleBar() {
  const navigation = useNavigate();
  const location = useLocation();
  const [breadcrumbType, setBreadCrumbType] = React.useState<
    'home' | 'chat' | 'prompt' | null
  >(null);
  const [chatData, setChatData] = React.useState<string | undefined>();
  const [promptData, setPromptData] = React.useState<
    | {
        folder: string;
        name: string;
        type: 'user' | 'system';
      }
    | undefined
  >();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const locList = location.pathname.split('/').filter((x) => x !== '');

      if (locList.length === 0) {
        setBreadCrumbType('home');
        return;
      }

      if (locList.length === 2 && locList[0] === 'c') {
        const { chat, error } =
          await window.electron.fileOperations.getChatById(locList[1]);

        if (error || !chat) {
          setError(error || 'Chat not found');
          return;
        }

        setBreadCrumbType('chat');
        setChatData(chat.title);
        return;
      }

      if (locList.length === 2 && locList[0] === 'p') {
        const { prompt, folder, error } =
          await window.electron.fileOperations.getPromptById(locList[1]);

        if (error || !prompt || !folder) {
          setError(error || 'Prompt not found');
          return;
        }

        setBreadCrumbType('prompt');
        setPromptData({
          folder: folder.title,
          name: prompt.title,
          type: prompt.type,
        });
        return;
      }

      setError('Unknown URL');
      setBreadCrumbType(null);
    };

    loadData();
  }, [location]);

  return (
    <div className="draggable flex h-[64px] items-center gap-2 bg-sidebar p-2 pr-[145px]">
      <SidebarTrigger className="my-auto" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          navigation(-1);
        }}
        disabled={location.key === 'default'}
      >
        <ArrowLeft className="my-auto" />
      </Button>
      <Breadcrumb className="flex-1">
        {breadcrumbType === 'home' ? (
          <HomeBreadcrumb />
        ) : breadcrumbType === 'chat' ? (
          <ChatBreadcrumb chatData={chatData} />
        ) : breadcrumbType === 'prompt' ? (
          <PromptBreadcrumb promptData={promptData} />
        ) : (
          <ErrorOrLoadingBreadcrumb error={error} />
        )}
      </Breadcrumb>
      <ModelSelector />
      <GenSettings />
    </div>
  );
}
