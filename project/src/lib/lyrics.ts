import { getLyrics as fetchGeniusLyrics } from 'genius-lyrics-api';

const GENIUS_API_KEY = import.meta.env.VITE_GENIUS_API_KEY || '';

export interface Song {
  title: string;
  artist: string;
  lyrics: string;
}

export interface SyncedLyric {
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

export async function getSongLyrics(songTitle: string, artist?: string): Promise<string> {
  try {
    if (!GENIUS_API_KEY) {
      console.warn('Genius API key is not set. Using fallback lyrics.');
      return getFallbackLyrics(songTitle);
    }

    // Clean up the song title by removing things like "(Official Video)", etc.
    const cleanTitle = songTitle
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/official\s*(music)?\s*video/i, '')
      .replace(/lyrics/i, '')
      .trim();

    // Extract artist from title if not provided (Format: "Artist - Song")
    const searchTitle = artist ? cleanTitle : cleanTitle.split('-')[1]?.trim() || cleanTitle;
    const searchArtist = artist || cleanTitle.split('-')[0]?.trim() || '';

    const options = {
      apiKey: GENIUS_API_KEY,
      title: searchTitle,
      artist: searchArtist,
      optimizeQuery: true
    };

    const lyrics = await fetchGeniusLyrics(options);
    
    if (!lyrics || lyrics.length === 0) {
      return getFallbackLyrics(cleanTitle);
    }

    return lyrics;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return getFallbackLyrics(songTitle);
  }
}

// Add this function to convert lyrics to timed lyrics segments
export function createTimedLyrics(lyrics: string, songDuration: number): SyncedLyric[] {
  // Split lyrics by lines
  const lines = lyrics
    .split('\n')
    .filter(line => line.trim().length > 0); // Remove empty lines
  
  const syncedLyrics: SyncedLyric[] = [];
  
  if (lines.length === 0) return syncedLyrics;
  
  // Distribute lines evenly across the song duration
  const averageLineTime = songDuration / lines.length;
  
  lines.forEach((line, index) => {
    const startTime = index * averageLineTime;
    const endTime = (index + 1) * averageLineTime;
    
    syncedLyrics.push({
      text: line,
      startTime,
      endTime
    });
  });
  
  return syncedLyrics;
}

// Get the current lyric based on the playback time
export function getCurrentLyric(syncedLyrics: SyncedLyric[], currentTime: number): SyncedLyric | null {
  const currentLyric = syncedLyrics.find(
    lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
  );
  
  return currentLyric || null;
}

function getFallbackLyrics(songTitle: string): string {
  return `Lyrics for "${songTitle}" could not be loaded.
  
Start typing to practice with this placeholder text instead.
The quick brown fox jumps over the lazy dog.
Pack my box with five dozen liquor jugs.
How vexingly quick daft zebras jump!`;
} 