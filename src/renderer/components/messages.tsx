import { Message, MultipleChoiceMessage, PromptMessage } from '@/common/types';
import React from 'react';
import ReactMarkdown from 'react-markdown';

const UserMessageComponent = ({ m }: { m: Message }) => {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in self-end w-fit max-w-[700px] py-2 px-4 bg-card text-card-foreground rounded-3xl display-linebreak">
      {m.content}
    </div>
  );
};

const AssistantMessageComponent = ({ m }: { m: MultipleChoiceMessage }) => {
  return (
    <div className="markdown self-start w-full py-2 px-4">
      <ReactMarkdown>{m.choices[0].content}</ReactMarkdown>
    </div>
  );
};

const PromptMessageComponent = ({ m }: { m: PromptMessage }) => {
  return <div>Prompt</div>;
};

const Messages = React.memo(
  ({
    messages,
  }: {
    messages: Array<{
      type: 'user' | 'assistant' | 'prompt';
      item: Message | MultipleChoiceMessage | PromptMessage;
    }>;
  }) => {
    return (
      <div className="flex flex-col gap-4 max-w-[800px] mx-auto">
        {messages.map((m, i) => {
          if (m.type === 'user') {
            // eslint-disable-next-line react/no-array-index-key
            return <UserMessageComponent key={i} m={m.item as Message} />;
          }

          if (m.type === 'assistant') {
            return (
              <AssistantMessageComponent
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                m={m.item as MultipleChoiceMessage}
              />
            );
          }

          if (m.type === 'prompt') {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <PromptMessageComponent key={i} m={m.item as PromptMessage} />
            );
          }

          return null;
        })}
      </div>
    );
  },
);

export default Messages;
