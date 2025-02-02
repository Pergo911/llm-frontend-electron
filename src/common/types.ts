export const ConfigSchema = {
  baseUrl: {
    type: 'string',
    default: 'https://api.deepinfra.com/v1/openai',
  },
  apiKey: {
    type: 'string',
  },
  modelSelection: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  theme: {
    type: 'string',
    default: 'system',
    enum: ['system', 'light', 'dark'],
  },
  saveFilePath: {
    type: 'string',
  },
  sidebarState: {
    type: 'boolean',
    default: true,
  },
  useLegacyRoleNames: {
    type: 'boolean',
    default: false,
  },
  genSettings: {
    type: 'object',
    properties: {
      max_tokens: {
        type: 'integer',
        default: 4096,
        minimum: 1,
      },
      temperature: {
        type: 'number',
        default: 0.9,
        minimum: 0,
        maximum: 5,
      },
      top_p: {
        type: 'number',
        default: 1,
        minimum: 0,
        maximum: 1,
      },
      stop: {
        type: 'array',
        items: {
          type: 'string',
        },
        maxItems: 4,
      },
    },
  },
};

export type Config = {
  baseUrl: string;
  apiKey: string;
  modelSelection: string[];
  theme: 'system' | 'light' | 'dark';
  saveFilePath: string;
  sidebarState: boolean;
  useLegacyRoleNames: boolean;
  genSettings: {
    max_tokens: number;
    temperature: number;
    top_p: number;
    stop: string[];
  };
};

export type ChatEntry = {
  title: string;
  id: string;
};

export type PromptEntry = {
  title: string;
  id: string;
  items: Array<{
    title: string;
    id: string;
    type: 'user' | 'system';
  }>;
};

export type Chat = {
  title: string;
  id: string;
  timestamp: number;
  messages: Array<{
    messageType: 'user' | 'assistant' | 'user-prompt' | 'system-prompt';
    id: string;
    activeChoice?: number;
    choices?: Array<{
      content: string;
      timestamp: number;
    }>;
    promptId?: string;
  }>;
};

export type Message = {
  id: string;
  content: string;
  timestamp: number;
};

export type MultipleChoiceMessage = {
  id: string;
  activeChoice: number;
  choices: Message[];
};

export type PromptMessage = {
  id: string;
  promptId: string;
  type: 'user' | 'system';
  title: string;
  content: string;
};

export interface DisplayMessage {
  type: 'user' | 'assistant' | 'prompt';
  item: Message | MultipleChoiceMessage | PromptMessage;
}

export type Prompt = {
  id: string;
  title: string;
  folderId: string;
  type: 'user' | 'system';
  timestamp: number;
  content: string;
};

export type Folder = {
  id: string;
  title: string;
};

export type SaveFile = {
  chats: Chat[];
  prompts: Prompt[];
  folders: Folder[];
};

export type ChatInputBarActions = {
  focus: () => void;
};

export type StreamingMessageHandle = {
  addToken: (token: string) => void;
};

export type RequestMessage = {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
};

export type ChatMessage = {
  messageType: 'user' | 'assistant' | 'user-prompt' | 'system-prompt';
  id: string;
  activeChoice?: number;
  choices?: Array<{
    content: string;
    timestamp: number;
  }>;
  promptId?: string;
};
