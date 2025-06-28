/* eslint-disable camelcase */
import { RequestMessage, ResolvedChat, OpenRouterModel } from '@/common/types';
import { OpenAIHandler } from './openai';

/**
 * Converts chat messages into a format suitable for API requests
 * @param messageData Array of messages from a chat
 * @returns Promise containing either the formatted messages or an error
 */
const buildRequestMessages = async (
  messageData: ResolvedChat['messages'],
): Promise<{
  resultMessages: RequestMessage[] | null;
  error: string | null;
}> => {
  try {
    // New role name for system messages for official OpenAI API is 'developer'
    // For legacy API, it's 'system'
    const { useLegacyRoleNames } =
      await window.electron.fileOperations.getConfig();
    const systemRole = useLegacyRoleNames ? 'system' : 'developer';

    const converted = messageData.map((m): RequestMessage | null => {
      const role =
        // eslint-disable-next-line no-nested-ternary
        m.messageType === 'user' || m.messageType === 'assistant'
          ? m.messageType
          : m.messageType === 'user-prompt'
            ? 'user'
            : systemRole;

      let content: string;
      let reasoning_details: string | undefined;

      if (m.messageType === 'assistant') {
        content = m.choices[m.activeChoice].content;
        reasoning_details = m.choices[m.activeChoice].reasoning_details;
      } else if (m.messageType === 'user') {
        content = m.content;
      } else {
        if (!m.content) return null;
        content = m.content;
      }

      return { role, content, reasoning_details };
    });

    // Remove null values and concatenate consecutive messages with the same role
    const resultMessages = converted.reduce<RequestMessage[]>((acc, curr) => {
      // Omit null
      if (!curr) return acc;

      const lastMessage = acc[acc.length - 1];

      if (lastMessage && lastMessage.role === curr.role) {
        // Combine with previous message of same role
        lastMessage.content += `\n\n${curr.content}`;
        return acc;
      }

      // Add as new message
      acc.push({ ...curr });
      return acc;
    }, []);

    if (resultMessages[resultMessages.length - 1].role === 'assistant') {
      throw new Error("Last message can't be an assistant message.");
    }

    return { resultMessages, error: null };
  } catch (e) {
    return { resultMessages: null, error: (e as Error).message };
  }
};

/**
 * Sends a streaming request to the OpenAI API with the given messages
 * @param messages Array of messages to send
 * @param onNewToken Callback for new tokens received
 * @param abortSignal Optional AbortSignal to cancel the request
 * @returns Promise containing final message, reasoning, finish reason, and error
 */
const streamingRequest = async (
  messages: RequestMessage[],
  onNewToken: (newToken?: string, newReasoningToken?: string) => void,
  abortSignal?: AbortSignal,
): Promise<{
  finalMessage: string | null;
  finalReasoning: string | null;
  finishReason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | null;
  error: string | null;
}> => {
  let finalMessage = '';
  let finalReasoning = '';
  let finishReason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | null = null;

  console.log('messages received:', messages);

  try {
    const config = await window.electron.fileOperations.getConfig();
    const openAI = await OpenAIHandler.get();

    // Always use latest values from config
    // @ts-ignore
    const completion = await openAI.chat.completions.create(
      {
        model: config.modelSelection[0].id,
        max_tokens: config.genSettings.max_tokens,
        temperature: config.genSettings.temperature,
        top_p: config.genSettings.top_p,
        stop: config.genSettings.stop,
        messages,
        stream: true,
        reasoning: {
          enabled: config.modelSelection[0].reasoning_preference,
        },
      },
      { signal: abortSignal },
    );

    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of completion) {
      let content = '';
      let reasoning = '';

      // @ts-ignore
      if (chunk.choices[0].delta.reasoning) {
        // @ts-ignore
        reasoning = chunk.choices[0].delta.reasoning;
      } else if (chunk.choices[0].delta.content) {
        content = chunk.choices[0].delta.content;
      }

      if (content) {
        finalMessage += content;
        onNewToken(content);
      }

      if (reasoning) {
        finalReasoning += reasoning;
        onNewToken(undefined, reasoning);
      }

      if (chunk.choices[0].finish_reason) {
        finishReason = chunk.choices[0].finish_reason;
      }
    }

    return {
      finalMessage,
      finalReasoning,
      finishReason,
      error: null,
    };
  } catch (e) {
    return {
      finalMessage: null,
      finalReasoning: null,
      finishReason: null,
      error: `${e as Error}`,
    };
  }
};

export const ChatOperations = {
  buildRequestMessages,
  streamingRequest,
};
