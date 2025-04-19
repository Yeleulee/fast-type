import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateWPM(
  typedCharacters: number,
  timeElapsedInSeconds: number,
  errors: number
): number {
  const minutes = timeElapsedInSeconds / 60;
  const words = typedCharacters / 5; // Standard: 5 characters = 1 word
  
  return Math.max(0, Math.round(words / minutes));
}

export function calculateAccuracy(
  correctCharacters: number,
  totalCharacters: number
): number {
  if (totalCharacters === 0) return 100;
  return Math.round((correctCharacters / totalCharacters) * 100);
}

export async function getLyrics(songTitle: string, artist: string): Promise<string> {
  try {
    return `This is where the lyrics for "${songTitle}" by ${artist} would appear.
Try typing along with the music!`;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return 'Lyrics could not be loaded. Try typing along with the music!';
  }
}