import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Chat } from '@/common/types';
import { SidebarTrigger } from './ui/sidebar';

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
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <SidebarTrigger className="absolute top-2 left-2" />
      {error ? <div>ERROR: {error}</div> : null}
      {chat ? <div>CHAT:{JSON.stringify(chat, null, 2)}</div> : null}
    </div>
  );
}
