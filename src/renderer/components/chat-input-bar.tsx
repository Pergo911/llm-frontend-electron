import React from 'react';
import { Bot, Plus, SendIcon, Square, User2 } from 'lucide-react';
import { ChatInputBarActions } from '@/common/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from '../utils/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const ChatInputBar = React.memo(
  ({
    onSend,
    onAddPrompt,
    actionRef,
    isStreaming,
    onAbort,
    overrideCanSend,
  }: {
    onSend: (t: string, as: 'user' | 'assistant') => void;
    onAddPrompt: () => void;
    actionRef: React.Ref<ChatInputBarActions>;
    isStreaming: boolean;
    onAbort: () => void;
    overrideCanSend: boolean;
  }) => {
    const [value, setValue] = React.useState('');
    const [canSend, setCanSend] = React.useState(false);

    const defaultSendAs: 'user' | 'assistant' = 'user';
    const [sendAs, setSendAs] = React.useState<'user' | 'assistant'>(
      defaultSendAs,
    );

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(actionRef, () => ({
      focus: () => {
        if (textareaRef.current !== null) {
          textareaRef.current.focus();
        }
      },
    }));

    function autoHeight() {
      if (textareaRef.current === null) return;

      const taStyle = textareaRef.current.style;

      taStyle.height = 'auto';
      taStyle.height = `${textareaRef.current.scrollHeight}px`;
    }

    function resetHeight() {
      if (textareaRef.current === null) return;

      const taStyle = textareaRef.current.style;

      taStyle.height = 'auto';
    }

    const handleSend = React.useCallback(() => {
      if (canSend || overrideCanSend) {
        onSend(value, overrideCanSend && value === '' ? 'user' : sendAs);
        setSendAs(defaultSendAs);
        setValue('');
        resetHeight();
      }
    }, [canSend, onSend, overrideCanSend, sendAs, value]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
      [handleSend],
    );

    React.useEffect(() => {
      setCanSend(value !== ''); // false if textbox is empty
    }, [value]);

    return (
      // Little area at the bottom
      <div className="flex w-full flex-1 flex-grow-0 justify-center bg-background p-4 pt-0">
        {/* Input box itself */}
        <div className="z-10 flex max-h-[300px] w-full max-w-[800px] flex-col rounded-xl bg-card text-card-foreground drop-shadow-md">
          <Textarea
            className="h-auto resize-none border-none pb-0 pt-4 shadow-none focus:outline-none focus-visible:ring-0"
            placeholder="Message here..."
            spellCheck="false"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoHeight();
            }}
            onKeyDown={handleKeyDown}
            ref={textareaRef}
          />
          <div className="flex w-full justify-between p-2">
            <Button
              variant="ghost"
              className="text-sm text-muted-foreground hover:text-foreground focus:text-foreground"
              onClick={onAddPrompt}
            >
              <Plus className="h-4 w-4" />
              Prompt
            </Button>
            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSendAs(sendAs === 'user' ? 'assistant' : 'user');
                    }}
                    disabled={(overrideCanSend && !canSend) || isStreaming}
                    className={cn(
                      ((overrideCanSend && !canSend) || isStreaming) &&
                        'hidden',
                    )}
                  >
                    {sendAs === 'user' ? <User2 /> : <Bot />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {sendAs === 'user'
                    ? 'Sending as user'
                    : 'Sending as assistant'}
                </TooltipContent>
              </Tooltip>
              <div className="w-2" />
              <Button
                variant="default"
                size="icon"
                className="rounded-full"
                disabled={!(canSend || isStreaming || overrideCanSend)}
                onClick={!isStreaming ? handleSend : onAbort}
              >
                {!isStreaming ? (
                  <SendIcon className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4 animate-pulse duration-1000" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default ChatInputBar;
