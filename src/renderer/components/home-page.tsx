import { useCallback, useEffect, useRef } from 'react';
import {
  ChatInputBarActions,
  ResolvedFolder,
  SaveFileController,
} from '@/common/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { setWindowTitle } from '../utils/utils';
import ChatInputBar from './chat-input-bar';
import { PromptSelectModal, PromptSelectModalRef } from './modal-prompt-select';
import { NewModal, NewModalRef } from './modal-new';

export default function HomePage({
  controller,
  folders,
}: {
  controller: SaveFileController;
  folders: ResolvedFolder[];
}) {
  const navigate = useNavigate();

  const inputRef = useRef<ChatInputBarActions>(null);
  const promptSelectModalRef = useRef<PromptSelectModalRef>(null);
  const newModalRef = useRef<NewModalRef>(null);

  const input = useRef('');
  const promptId = useRef<string | null>(null);

  useEffect(() => {
    setWindowTitle();
    inputRef.current?.focus();
  }, []);

  const handleCreateNew = useCallback(() => {
    newModalRef.current?.promptUser();
  }, []);

  // Forwards to /c/[id] page with the payload as query params
  const handleForward = useCallback(() => {
    const message = input.current;
    const prompt = promptId.current;

    const { error, newId } = controller.chats.add(
      message ? message.substring(0, 25) : 'New chat',
    );

    if (error || !newId) {
      toast.error(error || 'Failed to create chat');
      return;
    }

    const base = `/c/${newId}`;
    const queryMessage = message
      ? `?message=${encodeURIComponent(message)}`
      : '';
    const queryPrompt = prompt ? `?prompt=${prompt}` : '';

    navigate(base + queryMessage + queryPrompt, { replace: true });
  }, [controller.chats, navigate]);

  const handleSend = useCallback(
    (t: string) => {
      input.current = t;
      handleForward();
    },
    [handleForward],
  );

  const handleAddPrompt = useCallback(async () => {
    const prompt = await promptSelectModalRef.current?.promptUser();

    if (!prompt) return;

    promptId.current = prompt.id;

    handleForward();
  }, [handleForward]);

  return (
    <div className="m-2 mt-0 flex flex-1 flex-col items-center justify-center rounded-3xl bg-background p-4">
      <div className="flex w-fit items-center justify-center gap-2 text-muted-foreground">
        <span>
          <span className="font-bold">Start typing</span> or
        </span>

        <Button variant="outline" onClick={handleAddPrompt}>
          Add a prompt
        </Button>

        <span>or</span>

        <Button variant="outline" onClick={handleCreateNew}>
          Create new
        </Button>
      </div>

      <div className="h-6" />

      <ChatInputBar
        onSend={handleSend}
        onAddPrompt={handleAddPrompt}
        actionRef={inputRef}
        isStreaming={false}
        onAbort={() => {}}
        overrideCanSend={false}
        noSendAs
        reasoningSelect={null}
        onReasoningToggle={() => {}}
      />
      <PromptSelectModal ref={promptSelectModalRef} folders={folders} />
      <NewModal ref={newModalRef} controller={controller} folders={folders} />
    </div>
  );
}
