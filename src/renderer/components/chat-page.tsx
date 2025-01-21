import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Chat } from '@/common/types';
import { MessageCircle } from 'lucide-react';
import TitleBar from './ui/title-bar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from './ui/breadcrumb';

export default function ChatPage() {
  const { id } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getChat = async () => {
      if (!id) return;

      const { chat, error } =
        await window.electron.fileOperations.getChatById(id);

      setChat(chat);
      setError(error);
    };

    getChat();
  }, [id]);

  return (
    <>
      <TitleBar>
        <Breadcrumb className="h-full flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <MessageCircle className="h-4 w-4" />
              {chat?.title ?? 'Chat'}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </TitleBar>
      <div className="p-4 rounded-lg bg-background flex flex-col gap-4 items-center justify-center h-full">
        {error ? <div>ERROR: {error}</div> : null}
        {chat ? <div>CHAT:{JSON.stringify(chat, null, 2)}</div> : null}
      </div>
    </>
  );
}
