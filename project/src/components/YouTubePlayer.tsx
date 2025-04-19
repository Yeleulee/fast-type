import React, { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { useTypingStore } from '../store/typingStore';
import { getVideoSubtitles } from '../lib/youtube';
import { createTimedLyrics, getCurrentLyric } from '../lib/lyrics';

interface YouTubePlayerProps {
  videoId: string;
  isDark?: boolean;
}

export function YouTubePlayer({ videoId, isDark = false }: YouTubePlayerProps) {
  const { 
    isPlaying, 
    setText, 
    setIsPlaying,
    setSyncedLyrics,
    setCurrentTime,
    setVideoDuration,
    setCurrentLyricIndex,
    syncedLyrics,
    text
  } = useTypingStore();
  const playerRef = useRef<any>(null);
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reset state when video ID changes
  useEffect(() => {
    setText('');
    setSyncedLyrics([]);
    setCurrentLyricIndex(0);
    setLyricsLoaded(false);
    setLoadError(null);
    
    // Clean up interval when component unmounts or video changes
    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
        timeUpdateRef.current = null;
      }
    };
  }, [videoId, setText, setSyncedLyrics, setCurrentLyricIndex]);

  // Load lyrics for the video
  useEffect(() => {
    const loadSubtitles = async () => {
      try {
        console.log(`Loading lyrics for video ${videoId}...`);
        const lyricsText = await getVideoSubtitles(videoId);
        
        if (lyricsText && lyricsText.trim()) {
          console.log(`Lyrics loaded successfully (${lyricsText.length} chars)`);
          setText(lyricsText);
          setLyricsLoaded(true);
        } else {
          console.warn("Loaded lyrics were empty");
          setText("Start typing to practice with this placeholder text instead.");
          setLoadError("Could not load lyrics for this video");
        }
      } catch (error) {
        console.error("Error loading lyrics:", error);
        setText("Start typing to practice with this placeholder text instead.");
        setLoadError("Error loading lyrics. Please try another video.");
      }
    };
    
    if (videoId) {
      loadSubtitles();
    }
  }, [videoId, setText]);

  // When lyrics are loaded and duration is available, create synced lyrics
  useEffect(() => {
    if (lyricsLoaded && playerRef.current && text) {
      const duration = playerRef.current?.getDuration() || 0;
      if (duration && duration > 0) {
        console.log(`Creating timed lyrics for duration: ${duration}s`);
        const timedLyrics = createTimedLyrics(text, duration);
        console.log(`Created ${timedLyrics.length} timed lyrics segments`);
        setSyncedLyrics(timedLyrics);
      }
    }
  }, [lyricsLoaded, text, setSyncedLyrics]);

  const opts = {
    height: '360',
    width: '640',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  const onStateChange = (event: any) => {
    const isVideoPlaying = event.data === 1;
    setIsPlaying(isVideoPlaying);
    
    // Get player instance
    if (!playerRef.current) {
      playerRef.current = event.target;
    }
    
    // Set video duration if available
    const duration = playerRef.current?.getDuration() || 0;
    if (duration && duration > 0) {
      setVideoDuration(duration);
      
      // Generate synced lyrics based on video duration if we haven't already
      if (syncedLyrics.length === 0 && text && text.trim().length > 0) {
        console.log(`Setting up synced lyrics with duration: ${duration}s`);
        const timedLyrics = createTimedLyrics(text, duration);
        setSyncedLyrics(timedLyrics);
      }
    }
    
    // Start or stop tracking current playback time
    if (isVideoPlaying) {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
      
      timeUpdateRef.current = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          setCurrentTime(currentTime);
          
          // Find and set current lyric index
          if (syncedLyrics.length > 0) {
            const currentLyricIndex = syncedLyrics.findIndex(
              lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
            );
            
            if (currentLyricIndex !== -1) {
              setCurrentLyricIndex(currentLyricIndex);
            }
          }
        }
      }, 500); // Update every 500ms
    } else if (timeUpdateRef.current) {
      clearInterval(timeUpdateRef.current);
    }
  };

  const onReady = (event: any) => {
    playerRef.current = event.target;
    console.log("YouTube player ready");
    
    // If lyrics are already loaded, create synced lyrics now
    if (lyricsLoaded && text && text.trim().length > 0) {
      const duration = event.target.getDuration() || 0;
      if (duration && duration > 0) {
        console.log(`Player ready with duration: ${duration}s`);
        setVideoDuration(duration);
        const timedLyrics = createTimedLyrics(text, duration);
        setSyncedLyrics(timedLyrics);
      }
    }
  };

  const onError = (event: any) => {
    console.error("YouTube player error:", event);
    setLoadError("Error loading video. Please try another one.");
  };

  return (
    <div className={`w-full h-full flex flex-col gap-4 ${isDark ? 'bg-[#1a1b26]' : 'bg-black'} rounded-lg overflow-hidden`}>
      <div className="relative w-full">
        <YouTube
          videoId={videoId}
          opts={opts}
          onStateChange={onStateChange}
          onReady={onReady}
          onError={onError}
          className="w-full aspect-video"
        />
        
        {loadError && (
          <div className={`absolute bottom-0 inset-x-0 p-3 bg-red-500/80 text-white text-sm text-center`}>
            {loadError}
          </div>
        )}
      </div>
      <div className={`px-4 pb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>
        <p>🎵 Type along with the lyrics as they play!</p>
        {syncedLyrics.length > 0 && (
          <p className="mt-1">Synced {syncedLyrics.length} lines of lyrics to the video timing</p>
        )}
      </div>
    </div>
  );
}