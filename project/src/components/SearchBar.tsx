import React, { useState, useEffect } from 'react';
import { Search, Music } from 'lucide-react';
import { cn } from '../lib/utils';
import { searchVideos, type YouTubeVideo } from '../lib/youtube';
import { SearchResults } from './SearchResults';
import { useHotkeys } from 'react-hotkeys-hook';

interface SearchBarProps {
  onVideoSelect: (video: YouTubeVideo) => void;
  className?: string;
  isDark?: boolean;
}

export function SearchBar({ onVideoSelect, className, isDark = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    document.querySelector<HTMLInputElement>('#search-input')?.focus();
  });

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        const videos = await searchVideos(query + ' lyrics');
        setResults(videos);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleVideoSelect = (video: YouTubeVideo) => {
    onVideoSelect(video);
    setQuery('');
    setResults([]);
  };

  return (
    <div className={cn("relative", className)}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
        isDark 
          ? 'bg-[#1a1b26] ring-1 ring-[#414868] focus-within:ring-[#7aa2f7]' 
          : 'bg-white/80 shadow-lg shadow-purple-500/5 focus-within:shadow-purple-500/10'
      }`}>
        <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-purple-400'}`} />
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs... (Ctrl+K)"
          className={`flex-1 bg-transparent border-none focus:outline-none text-base ${
            isDark ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-800 placeholder:text-gray-400'
          }`}
        />
        <Music className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-purple-400'}`} />
        {isSearching && (
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <SearchResults results={results} onVideoSelect={handleVideoSelect} isDark={isDark} />
    </div>
  );
}