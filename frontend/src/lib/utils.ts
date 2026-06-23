import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(2) + 'h';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
}

export function getDurationSince(startTime: string | Date): number {
  return Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
}
