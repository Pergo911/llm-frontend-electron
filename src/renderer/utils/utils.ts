/* eslint-disable import/prefer-default-export */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function setWindowTitle(title?: string) {
  if (!title) {
    document.title = 'ChatApp';
    return;
  }

  document.title = `${title} - ChatApp`;
}

export const isInvalid = (s: string) => {
  return s.trim() === '' || s.length > 50 || s.includes('/') || s.includes('$');
};
