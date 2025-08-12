import React from 'react';
import {
  ArrowUp,
  Bot,
  Brain,
  Lightbulb,
  LightbulbOff,
  Plus,
  SendIcon,
  Square,
  User2,
} from 'lucide-react';
import { ChatInputBarActions } from '@/common/types';
import { Button } from './ui/button';
import TextareaWithContextMenu from './textarea-context-menu';
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
    noSendAs,
    reasoningSelect,
    onReasoningToggle,
  }: {
    onSend: (t: string, as: 'user' | 'assistant') => void;
    onAddPrompt: () => void;
    actionRef: React.Ref<ChatInputBarActions>;
    isStreaming: boolean;
    onAbort: () => void;
    overrideCanSend: boolean;
    noSendAs?: boolean;
    reasoningSelect: boolean | null;
    onReasoningToggle: (enabled: boolean) => void;
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
      if ((canSend || overrideCanSend) && !isStreaming) {
        onSend(value, overrideCanSend && value === '' ? 'user' : sendAs);
        setSendAs(defaultSendAs);
        setValue('');
        resetHeight();
      }
    }, [canSend, isStreaming, onSend, overrideCanSend, sendAs, value]);

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
        <div className="z-10 flex max-h-[300px] w-full max-w-[800px] flex-col rounded-3xl bg-background-dim p-4 text-foreground drop-shadow-md">
          <TextareaWithContextMenu
            className="h-auto min-h-0 resize-none rounded-none border-none p-0 py-2 shadow-none focus:outline-none focus-visible:ring-0"
            placeholder="Message here..."
            spellCheck="false"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoHeight();
            }}
            onValueChange={(next) => {
              setValue(next);
              autoHeight();
            }}
            rows={1}
            onKeyDown={handleKeyDown}
            ref={textareaRef}
          />
          <div className="flex w-full justify-between pt-2">
            <div className="flex w-full items-start gap-2">
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-foreground focus:text-foreground"
                onClick={onAddPrompt}
              >
                <Plus className="h-4 w-4" />
                Prompt
              </Button>
              {reasoningSelect !== null && (
                <Button
                  variant="ghost"
                  className={cn(
                    'text-sm text-muted-foreground',
                    reasoningSelect &&
                      'bg-card-hover outline outline-1 outline-border',
                  )}
                  onClick={() => {
                    onReasoningToggle(!reasoningSelect);
                  }}
                >
                  {reasoningSelect ? (
                    <>
                      <Lightbulb className="h-4 w-4" />
                      Reasoning On
                    </>
                  ) : (
                    <>
                      <LightbulbOff className="h-4 w-4" />
                      Reasoning Off
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center">
              {!noSendAs && (
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
                        'text-muted-foreground',
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
              )}
              <div className="w-2" />
              <Button
                variant="default"
                size="icon"
                className="rounded-xl"
                disabled={!(canSend || isStreaming || overrideCanSend)}
                onClick={!isStreaming ? handleSend : onAbort}
              >
                {!isStreaming ? (
                  <ArrowUp className="h-4 w-4" />
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
