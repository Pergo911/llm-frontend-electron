import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Chat,
  Message,
  MultipleChoiceMessage,
  PromptMessage,
} from '@/common/types';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import TitleBar from './ui/title-bar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from './ui/breadcrumb';
import ChatInputBar from './chat-input-bar';
import Messages from './messages';

export default function ChatPage() {
  const { id } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      type: 'user' | 'assistant' | 'prompt';
      item: Message | MultipleChoiceMessage | PromptMessage;
    }>
  >([]);

  useEffect(() => {
    const getChat = async () => {
      if (!id) {
        setError('Getting id route param failed.');
        return null;
      }

      const { chat, error } =
        await window.electron.fileOperations.getChatById(id);

      setError(error);
      return chat;
    };

    // parse chat object to pass to <Messages />
    const buildMessages = async (chatData: Chat) => {
      const messages = await Promise.all(
        chatData.messages.map(
          async (
            m,
          ): Promise<{
            type: 'user' | 'assistant' | 'prompt';
            item: Message | MultipleChoiceMessage | PromptMessage;
          } | null> => {
            if (m.messageType === 'user') {
              if (!m.choices) return null;

              return {
                type: 'user',
                item: {
                  content: m.choices[0].content,
                  timestamp: m.choices[0].timestamp,
                } as Message,
              };
            }

            if (m.messageType === 'assistant') {
              return {
                type: 'assistant',
                item: {
                  choices: m.choices,
                } as MultipleChoiceMessage,
              };
            }

            if (
              m.messageType === 'user-prompt' ||
              m.messageType === 'system-prompt'
            ) {
              if (!m.promptId) return null;

              const { error, prompt, folder } =
                await window.electron.fileOperations.getPromptById(m.promptId);

              if (error || !prompt) return null;

              return {
                type: 'prompt',
                item: {
                  type: prompt.type,
                  title: prompt.title,
                  content: prompt.content,
                } as PromptMessage,
              };
            }

            return null;
          },
        ),
      );

      setMessages(messages.filter((e) => e !== null));
    };

    // eslint-disable-next-line promise/catch-or-return
    getChat().then((chatData) => {
      // eslint-disable-next-line promise/always-return
      if (chatData) {
        setChat(chatData);
        buildMessages(chatData);
      }
    });
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
    }
  }, [error]);

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
      <div className="p-4 rounded-xl bg-background h-full">
        <Messages messages={messages} />
        <ChatInputBar onSend={() => {}} onAddPrompt={() => {}} />
      </div>
    </>
  );
}
