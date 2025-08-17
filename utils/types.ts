export const ConfigSchema = {
  baseUrl: {
    type: 'string',
    default: 'https://openrouter.ai/api/v1',
  },
  apiKey: {
    type: 'string',
    default: '',
  },
  modelSelection: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        reasoning: {
          type: 'boolean',
        },
        reasoning_preference: {
          type: 'boolean',
        },
      },
      required: ['id', 'name', 'reasoning', 'reasoning_preference'],
    },
    default: [],
  },
  theme: {
    type: 'string',
    default: 'system',
    enum: ['system', 'light', 'dark'],
  },
  saveFilePath: {
    type: 'string',
    default: '',
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

export type OpenRouterModel = {
  id: string;
  name: string;
  reasoning: boolean;
  reasoning_preference: boolean;
};

export type Config = {
  baseUrl: string;
  apiKey: string;
  modelSelection: OpenRouterModel[];
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

export type ChatInputBarActions = {
  focus: () => void;
};

export type StreamingMessageHandle = {
  addToken: (token: string) => void;
};

export type RequestMessage = {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
  reasoning_details?: string;
};

// ---------

export type Message = {
  id: string;
  messageType: 'user' | 'assistant' | 'user-prompt' | 'system-prompt';
};

export type UserMessage = Message & {
  messageType: 'user';
  created: number;
  modified: number;
  content: string;
};

export type AssistantMessage = Message & {
  messageType: 'assistant';
  activeChoice: number;
  choices: Array<{
    created: number;
    modified: number;
    content: string;
    reasoning_details?: string;
    generated_with?: string;
  }>;
};

export type PromptMessage = Message & {
  messageType: 'user-prompt' | 'system-prompt';
  created: number;
  modified: number;
  promptId: string;
};

export type Chat = {
  title: string;
  id: string;
  created: number;
  modified: number;
  messages: Array<UserMessage | AssistantMessage | PromptMessage>;
};

export type Prompt = {
  title: string;
  id: string;
  type: 'user-prompt' | 'system-prompt';
  folderId: string;
  created: number;
  modified: number;
  content: string;
};

export type Folder = {
  id: string;
  name: string;
};

export type ResolvedPrompt = Prompt & {
  folder: Folder | null;
};

export type SaveFile = {
  chats: Chat[];
  prompts: Prompt[];
  folders: Folder[];
};

export type ResolvedPromptMessage = PromptMessage & {
  title: string | null;
  content: string | null;
};

export type ResolvedChat = {
  title: string;
  id: string;
  created: number;
  modified: number;
  messages: Array<UserMessage | AssistantMessage | ResolvedPromptMessage>;
};

export type ResolvedFolder = Folder & {
  items: ResolvedPrompt[];
};

export type ResolvedSaveFile = {
  chats: ResolvedChat[];
  prompts: ResolvedPrompt[];
  folders: ResolvedFolder[];
};

export type SaveFileController = {
  saveFile: {
    write: () => void;
    reload: () => void;
  };
  chats: {
    messages: {
      add: (
        chatId: string,
        messageType: Message['messageType'],
        content: string,
        reasoning?: string,
        generatedWith?: string,
      ) => { error: string | null; messageId: string | null };

      addChoice: (
        chatId: string,
        messageId: string,
        content: string,
        reasoning?: string,
        generatedWith?: string,
      ) => { error: string | null };

      setChoice: (
        chatId: string,
        messageId: string,
        choiceIndex: number,
      ) => { error: string | null };

      delete: (chatId: string, messageId: string) => { error: string | null };

      deleteChoice: (
        chatId: string,
        messageId: string,
        choiceIndex?: number,
      ) => {
        error: string | null;
      };

      modify: (
        chatId: string,
        messageId: string,
        content: string,
        reasoning?: string,
      ) => { error: string | null };
    };

    add: (title: string) => { error: string | null; newId: string | null };

    delete: (id: string) => { error: string | null };

    duplicate: (id: string) => { error: string | null; newId: string | null };

    rename: (id: string, newName: string) => { error: string | null };
  };
  prompts: {
    add: (
      title: string,
      folderId: string,
      type: Prompt['type'],
    ) => { error: string | null; newId: string | null };

    delete: (id: string) => { error: string | null };

    duplicate: (id: string) => { error: string | null; newId: string | null };

    editContent: (id: string, newContent: string) => { error: string | null };

    rename: (id: string, newName: string) => { error: string | null };

    changeFolder: (id: string, newFolderId: string) => { error: string | null };

    changeType: (
      id: string,
      newType: Prompt['type'],
    ) => { error: string | null };
  };
  folders: {
    add: (name: string) => { error: string | null; newId: string | null };

    delete: (id: string) => { error: string | null };

    rename: (id: string, newName: string) => { error: string | null };
  };
};

export type ModelsController = {
  select: (model: OpenRouterModel) => Promise<{
    error: string | null;
  }>;
  toggleReasoningPreference: (enabled: boolean) => Promise<{
    error: string | null;
  }>;
  reload: () => void;
};
