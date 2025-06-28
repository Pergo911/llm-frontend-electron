import { Config } from '@/common/types';
import OpenAI from 'openai';

let openAI: OpenAI | undefined;
let config: Config | undefined;

export const OpenAIHandler = {
  /**
   * Get an instance of OpenAI client. Creates a new instance if not already created.
   * @returns Promise that resolves to OpenAI instance
   * @throws Error if OpenAI client cannot be created
   */
  get: async () => {
    const newConfig = await window.electron.fileOperations.getConfig();

    if (
      !openAI ||
      !config ||
      config.apiKey !== newConfig.apiKey ||
      config.baseUrl !== newConfig.baseUrl
    ) {
      config = newConfig;
      openAI = new OpenAI({
        baseURL: config.baseUrl,
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true,
      });

      console.log(
        'We just had a newly created OpenAI instance. Watch for excessive prints of this message.',
      );
    }

    return openAI;
  },
};
