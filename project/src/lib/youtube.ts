const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
import { getSongLyrics } from './lyrics';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchVideos(query: string): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_URL}/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
}

export async function getVideoSubtitles(videoId: string): Promise<string> {
  try {
    // Get complete video details including description
    const response = await fetch(
      `${YOUTUBE_API_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return 'No video details available. Start typing to practice...';
    }

    const videoTitle = data.items[0].snippet.title;
    const channelTitle = data.items[0].snippet.channelTitle;
    const description = data.items[0].snippet.description;
    
    // Check if description contains lyrics (common for music videos)
    const lyricsFromDescription = extractLyricsFromDescription(description);
    
    if (lyricsFromDescription) {
      console.log("Found lyrics in description");
      return lyricsFromDescription;
    }
    
    // Try to get lyrics using the video title and channel name as fallback
    console.log("Getting lyrics based on title:", videoTitle);
    const lyrics = await getSongLyrics(videoTitle, channelTitle);
    
    // Format lyrics to be more consistent for synchronization
    // Remove extra blank lines and normalize spacing
    const formattedLyrics = lyrics
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n');
    
    return formattedLyrics || description || 'Start typing to practice...';
  } catch (error) {
    console.error('Error fetching video details:', error);
    return 'Start typing to practice...';
  }
}

// Helper function to extract lyrics from video description
function extractLyricsFromDescription(description: string): string | null {
  if (!description) return null;
  
  // Common markers for lyrics in descriptions
  const lyricsMarkers = [
    'lyrics:', 'lyrics', 'lyric:', 'lyric', 
    'words:', 'words', 'letra:', 'letra',
    '가사:', '가사', 'текст:', 'текст'
  ];
  
  // Try to locate lyrics section in description
  let lyricsStart = -1;
  
  // Look for lyrics markers
  for (const marker of lyricsMarkers) {
    const markerIndex = description.toLowerCase().indexOf(marker);
    if (markerIndex !== -1) {
      lyricsStart = markerIndex + marker.length;
      break;
    }
  }
  
  // If no marker found, look for common patterns in music video descriptions
  if (lyricsStart === -1) {
    // Check for verse/chorus pattern
    if (description.toLowerCase().includes('verse') && 
        description.toLowerCase().includes('chorus')) {
      return description;
    }
    
    // Check for multiple line breaks which often indicate lyrics
    const lines = description.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 5) {
      // If description has many short lines, it's likely lyrics
      const shortLines = lines.filter(line => line.length < 100);
      if (shortLines.length > lines.length * 0.7) {
        return lines.join('\n');
      }
    }
    
    return null;
  }
  
  // Extract content after lyrics marker
  let lyricsContent = description.substring(lyricsStart).trim();
  
  // Try to find end of lyrics (usually followed by links, copyright, etc.)
  const endMarkers = [
    'follow', 'subscribe', 'instagram', 'facebook', 'twitter',
    'tiktok', 'copyright', '©', 'all rights reserved', 'official'
  ];
  
  for (const marker of endMarkers) {
    const markerIndex = lyricsContent.toLowerCase().indexOf(marker);
    if (markerIndex !== -1) {
      lyricsContent = lyricsContent.substring(0, markerIndex).trim();
      break;
    }
  }
  
  return lyricsContent || null;
}