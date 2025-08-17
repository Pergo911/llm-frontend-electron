import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new UUID
 * @param t The type of UUID to generate ('__c__' - chat, '__p__' - prompt, '__f__' - folder, '__m__' - message)
 * @returns string A new UUID
 */
export function generateUUID(t: 'c' | 'p' | 'f' | 'm'): string {
  return `${t}-${uuidv4()}`;
}
