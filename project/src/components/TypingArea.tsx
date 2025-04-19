import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateWPM, calculateAccuracy } from '../lib/utils';
import { useTypingStore } from '../store/typingStore';
import { Music, Headphones, RotateCcw, Timer, Award, Zap, TrendingUp, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface TypingAreaProps {
  isDark?: boolean;
  soundEnabled?: boolean;
}

export function TypingArea({ isDark = false, soundEnabled = true }: TypingAreaProps) {
  const {
    text,
    typedText,
    wpm,
    accuracy,
    errors,
    isPlaying,
    setTypedText,
    setWPM,
    setAccuracy,
    setErrors,
    addHighScore,
    reset,
    syncedLyrics,
    currentLyricIndex,
    setCurrentLyricIndex,
    currentTime,
    streak,
    combo,
    comboMultiplier,
    points,
    level,
    incrementStreak,
    resetStreak,
    incrementCombo,
    resetCombo,
    addPoints
  } = useTypingStore();

  const { playSound } = useSoundEffects(soundEnabled);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeLyrics, setActiveLyrics] = useState<string[]>([]);
  const [showComboEffect, setShowComboEffect] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to filter out lyrics labels
  const filterLyricLabels = (lyric: string): string => {
    // Remove common lyric labels like [Verse], [Chorus], [Intro], etc.
    return lyric.replace(/\[(Verse|Chorus|Intro|Bridge|Outro|Pre-Chorus|Hook|Refrain|Interlude)(?:\s\d+)?\]/gi, '')
               .replace(/\(Verse|Chorus|Intro|Bridge|Outro|Pre-Chorus|Hook|Refrain|Interlude\)(?:\s\d+)?/gi, '')
               .trim();
  };

  // Process all lyrics for display
  useEffect(() => {
    if (syncedLyrics.length > 0) {
      // Get all lyrics at once instead of just the current line
      const allLyrics = syncedLyrics.map(lyric => filterLyricLabels(lyric.text))
        .filter(lyric => lyric.trim().length > 0); // Remove empty strings after filtering
      
      setActiveLyrics([allLyrics.join(' ')]);
    } else {
      // If no synced lyrics, use the full text
      // Make sure we always have text content to display
      if (text && text.trim()) {
        setActiveLyrics([filterLyricLabels(text)]);
      } else {
        setActiveLyrics(['Start typing to practice with this placeholder text instead.']);
      }
    }
  }, [syncedLyrics, text]);
  
  // Split text into words for word-by-word typing (MonkeyType style)
  const words = activeLyrics.join(' ').split(/\s+/).filter(word => word.trim().length > 0);
  
  // If no words, provide some default content
  if (words.length === 0) {
    words.push('Start', 'typing', 'to', 'practice');
  }
  
  // Function to reset the typing test
  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    reset();
    setStartTime(null);
    setIsComplete(false);
    setCurrentWordIndex(0);
    setElapsedTime(0);
    
    // Focus the text area after reset
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reset]);
  
  // Add keyboard shortcut for reset
  useHotkeys('ctrl+r, cmd+r', (e) => {
    e.preventDefault();
    handleReset();
  }, { enableOnFormTags: true });
  
  // Start the timer when user begins typing
  useEffect(() => {
    if (typedText.length === 1 && !startTime) {
      setStartTime(Date.now());
      
      // Start a timer to update elapsed time
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime!) / 1000));
      }, 1000);
    }

    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(Math.floor(timeElapsed));
      
      const newWPM = calculateWPM(typedText.length, timeElapsed, errors);
      const newAccuracy = calculateAccuracy(
        typedText.length - errors,
        typedText.length
      );
      
      setWPM(newWPM);
      setAccuracy(newAccuracy);

      // Check for completion of the current active lyrics
      const currentLyricText = activeLyrics.join(' ');
      if (typedText.length === currentLyricText.length && !isComplete) {
        setIsComplete(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        addHighScore({
          wpm: newWPM,
          accuracy: newAccuracy,
          mode: 'lyrics'
        });
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [typedText, errors, startTime, activeLyrics, isComplete, addHighScore]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    // Intentionally left empty - we're removing the particle effects
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const prevText = typedText;
    const newTypedText = e.target.value;
    setTypedText(newTypedText);

    // Count errors and track current word
    let newErrors = 0;
    const currentLyricText = activeLyrics.join(' ');
    
    for (let i = 0; i < newTypedText.length; i++) {
      if (i < currentLyricText.length && newTypedText[i] !== currentLyricText[i]) {
        newErrors++;
      }
    }
    
    // Check if we just typed a correct character
    if (
      newTypedText.length > prevText.length && 
      newTypedText.length <= currentLyricText.length &&
      newTypedText[newTypedText.length - 1] === currentLyricText[newTypedText.length - 1]
    ) {
      // Correct character typed - increment combo and streak
      incrementCombo();
      incrementStreak();
      
      // Add base points
      addPoints(1);
      
      // Play correct sound
      playSound('correct', { 
        volume: 0.3, 
        playbackRate: Math.min(1 + (combo / 100), 2) 
      });
      
      // Show combo effect for milestone combos
      if (combo > 0 && combo % 10 === 0) {
        setShowComboEffect(true);
        setTimeout(() => setShowComboEffect(false), 1000);
        
        // Special combo sound
        playSound('combo', { 
          volume: 0.5,
          playbackRate: Math.min(1 + (combo / 50), 2) 
        });
      }
    } else if (newTypedText.length > prevText.length) {
      // Incorrect character typed - reset combo
      resetCombo();
      resetStreak();
      
      // Play error sound
      playSound('error', { volume: 0.2 });
    }
    
    setErrors(newErrors);
    
    // Update current word index based on space characters typed
    const spaces = newTypedText.split('').filter(char => char === ' ').length;
    setCurrentWordIndex(Math.min(spaces, words.length - 1));
  };

  // Render text in a MonkeyType style - word by word approach
  const renderText = () => {
    return (
      <div className="flex flex-wrap gap-1 typing-text max-w-5xl mx-auto">
        {words.map((word, wordIndex) => {
          const isCurrentWord = wordIndex === currentWordIndex;
          const isPastWord = wordIndex < currentWordIndex;
          
          return (
            <div 
              key={wordIndex} 
              className={`font-mono relative ${
                isCurrentWord 
                  ? (isDark ? 'bg-[#1a1b26]/70' : 'bg-purple-100/50') 
                  : ''
              } rounded px-0.5 ${wordIndex >= currentWordIndex + 10 ? 'opacity-50' : ''}`}
            >
              {word.split('').map((char, charIndex) => {
                // Determine character styling
                const absoluteIndex = wordIndex === 0 
                  ? charIndex 
                  : words.slice(0, wordIndex).join(' ').length + 1 + charIndex;
                
                const isTyped = absoluteIndex < typedText.length;
                const isCorrect = isTyped && typedText[absoluteIndex] === char;
                const isIncorrect = isTyped && typedText[absoluteIndex] !== char;
                
                let className = isDark ? 'text-gray-500' : 'text-gray-400';
                
                if (isCorrect) {
                  className = isDark ? 'text-[#9ece6a]' : 'text-emerald-500';
                } else if (isIncorrect) {
                  className = isDark ? 'text-[#f7768e] bg-red-900/20' : 'text-red-500 bg-red-100';
                } else if (isPastWord) {
                  className = isDark ? 'text-gray-600' : 'text-gray-500';
                } else if (isCurrentWord) {
                  className = isDark ? 'text-gray-300' : 'text-gray-800';
                }
                
      return (
                  <span key={charIndex} className={className}>
          {char}
                  </span>
                );
              })}
              {wordIndex < words.length - 1 && (
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>
                  {' '}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className={`w-full h-full flex flex-col gap-6 p-8 rounded-xl shadow-xl cursor-text transition-all ${
        isDark ? 'bg-[#24283b] shadow-[#1a1b26]/50' : 'bg-white/80 backdrop-blur-sm shadow-purple-500/10'
      }`}
      onClick={handleFocus}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* MonkeyType-inspired stats bar */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-4">
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="font-mono text-xl font-bold">{wpm}</span>
            <span className={`text-xs uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>wpm</span>
          </div>
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="font-mono text-xl font-bold">{accuracy}%</span>
            <span className={`text-xs uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>acc</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="font-mono text-xl font-bold">{formatTime(elapsedTime)}</span>
            <span className={`text-xs uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>time</span>
          </div>
          
          <div className={`flex items-center gap-2 ${combo > 0 ? (isDark ? 'text-amber-400' : 'text-amber-500') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
            <span className="font-mono text-xl font-bold">{combo}</span>
            <span className={`text-xs uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              combo {comboMultiplier > 1 ? `(${comboMultiplier}x)` : ''}
            </span>
          </div>
        </div>
        
        <div 
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className={`flex items-center gap-2 rounded px-3 py-1 cursor-pointer ${
            isDark ? 'hover:bg-[#1a1b26] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <RotateCcw size={16} />
          <span className="text-xs uppercase">Reset</span>
          </div>
      </div>

      {/* Main typing area - MonkeyType style */}
      <div 
        className={`flex-1 relative rounded-lg overflow-hidden flex items-start justify-center ${
          isDark ? 'bg-[#1a1b26]/50' : 'bg-gray-50'
        }`}
      >
        <div 
          className={`absolute inset-0 font-mono text-lg whitespace-pre-wrap p-6 overflow-y-auto pointer-events-none`}
        >
          {renderText()}
        </div>
        
        {/* Visual effect for combos - kept this since it's less distracting */}
        <AnimatePresence>
          {showComboEffect && (
            <motion.div 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className={`text-4xl font-bold ${
                combo > 30 
                  ? 'text-red-500' 
                  : (combo > 10 ? 'text-amber-500' : 'text-green-500')
              }`}>
                {combo}x Combo!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <textarea
          ref={textareaRef}
          value={typedText}
          onChange={handleTyping}
          onKeyDown={handleKeyPress}
          className={`w-full h-full resize-none font-mono text-lg p-6 caret-emerald-500 focus:outline-none focus:ring-0 ${
            isDark 
              ? 'bg-transparent text-transparent selection:bg-[#7aa2f7]/20' 
              : 'bg-transparent text-transparent selection:bg-emerald-100'
          }`}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* MonkeyType-style footer stats */}
      <div className="flex justify-between items-center text-xs mt-2">
        <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Level {level}</div>
        <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Points: {points}</div>
        <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Streak: {streak}</div>
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center p-6 rounded-lg ${
            isDark ? 'bg-[#1a1b26]' : 'bg-gray-50'
          }`}
        >
          <h3 className="text-xl font-bold mb-2">🎵 Performance Results 🎵</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#24283b]' : 'bg-white/50'}`}>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>WPM</p>
              <p className="text-2xl font-mono font-bold">{wpm}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#24283b]' : 'bg-white/50'}`}>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Accuracy</p>
              <p className="text-2xl font-mono font-bold">{accuracy}%</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#24283b]' : 'bg-white/50'}`}>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Max Combo</p>
              <p className="text-2xl font-mono font-bold">{combo}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#24283b]' : 'bg-white/50'}`}>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Points</p>
              <p className="text-2xl font-mono font-bold">{points}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className={`mt-6 px-6 py-3 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-[#7aa2f7]/20 text-[#7aa2f7] hover:bg-[#7aa2f7]/30' 
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            Try Again
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}