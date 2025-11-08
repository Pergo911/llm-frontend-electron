/* eslint-disable import/prefer-default-export */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function formatTimestampRelative(
  timestamp: number,
  capitalize = false,
): string {
  const formatted = timeAgo.format(timestamp);
  return capitalize ? capitalizeFirstLetter(formatted) : formatted;
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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
