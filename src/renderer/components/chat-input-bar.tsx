import React from 'react';
import { Plus, SendIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const ChatInputBar = ({
  onSend,
  onAddPrompt,
}: {
  onSend: (t: string) => void;
  onAddPrompt: () => void;
}) => {
  const [value, setValue] = React.useState('');
  const [canSend, setCanSend] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  function autoHeight() {
    if (textareaRef.current === null) return;

    const taStyle = textareaRef.current.style;

    taStyle.height = 'auto';
    taStyle.height = `${textareaRef.current.scrollHeight}px`;
  }

  const handleSend = React.useCallback(() => {
    if (canSend) {
      onSend(value);
      setValue('');
      autoHeight();
    }
  }, [canSend, onSend, value]);

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
    <div className="absolute bottom-0 left-0 w-full pb-4 bg-background flex justify-center p-4">
      {/* Input box itself */}
      <div className="flex flex-col bg-card text-card-foreground rounded-xl w-full max-w-[800px] max-h-[300px]">
        <Textarea
          className="border-none focus:outline-none focus-visible:ring-0 resize-none pt-4 pb-0 shadow-none h-auto"
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
        <div className="w-full flex justify-between p-2">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={onAddPrompt}
          >
            <Plus className="h-4 w-4" />
            Prompt
          </Button>
          <Button
            variant="default"
            size="icon"
            className="rounded-full"
            disabled={!canSend}
            onClick={handleSend}
          >
            <SendIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInputBar;
