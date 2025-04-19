import React, { useState, useEffect } from 'react';
import { Music2, Settings, Moon, Sun, Trophy, Crown, Headphones, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YouTubePlayer } from './components/YouTubePlayer';
import { TypingArea } from './components/TypingArea';
import { SearchBar } from './components/SearchBar';
import { Achievements } from './components/Achievements';
import { ParticleSystem } from './components/ParticleEffect.tsx';
import { useTypingStore } from './store/typingStore';
import type { YouTubeVideo } from './lib/youtube';

// Sound effects
const correctSound = new Audio('/sounds/correct.mp3');
const errorSound = new Audio('/sounds/error.mp3');
const comboSound = new Audio('/sounds/combo.mp3');
const achievementSound = new Audio('/sounds/achievement.mp3');
const levelUpSound = new Audio('/sounds/level-up.mp3');

function App() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const { difficulty, setDifficulty, highScores, level } = useTypingStore();
  const [isDark, setIsDark] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevLevel, setPrevLevel] = useState(1);

  const handleVideoSelect = (video: YouTubeVideo) => {
    setVideoId(video.id);
  };
  
  // Watch for level ups to play sound
  useEffect(() => {
    if (soundEnabled && level > prevLevel) {
      levelUpSound.play();
    }
    setPrevLevel(level);
  }, [level, prevLevel, soundEnabled]);
  
  // Listen for achievement unlocks
  useEffect(() => {
    const handleAchievementUnlock = () => {
      if (soundEnabled) {
        achievementSound.play();
      }
    };
    
    // Listen for a custom event we'll dispatch when achievements are unlocked
    window.addEventListener('achievement-unlocked', handleAchievementUnlock);
    
    return () => {
      window.removeEventListener('achievement-unlocked', handleAchievementUnlock);
    };
  }, [soundEnabled]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#1a1b26] text-gray-100' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900'}`}>
      {/* Particle Effects */}
      <ParticleSystem enabled={soundEnabled} isDark={isDark} />

      {/* Header */}
      <header className={`${isDark ? 'bg-[#24283b]' : 'bg-white/80'} border-b ${isDark ? 'border-[#414868]' : 'border-gray-200'} sticky top-0 z-50 backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <Music2 className={`w-8 h-8 ${isDark ? 'text-[#7aa2f7]' : 'text-purple-600'}`} />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-pink-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                LyricType
              </h1>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <SearchBar onVideoSelect={handleVideoSelect} isDark={isDark} />
              
              <motion.button
                className={`p-2 rounded-lg ${
                  isDark ? 'hover:bg-[#414868]' : 'hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className={`w-5 h-5 ${isDark ? 'text-[#7dcfff]' : 'text-purple-500'}`} />
                ) : (
                  <VolumeX className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                )}
              </motion.button>
              
              <motion.button
                className={`p-2 rounded-lg ${
                  isDark ? 'hover:bg-[#414868]' : 'hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHighScores(!showHighScores)}
              >
                <Trophy className={`w-5 h-5 ${isDark ? 'text-[#e0af68]' : 'text-yellow-500'}`} />
              </motion.button>
              
              <motion.button
                className={`p-2 rounded-lg ${
                  isDark ? 'hover:bg-[#414868]' : 'hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-[#e0af68]" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-500" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* HighScores Overlay */}
      <AnimatePresence>
        {showHighScores && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHighScores(false)}
          >
            <motion.div
              className={`w-full max-w-md p-6 rounded-xl ${
                isDark ? 'bg-[#24283b]' : 'bg-white'
              }`}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Crown className={`w-6 h-6 ${isDark ? 'text-[#e0af68]' : 'text-yellow-500'}`} />
                  <h2 className="text-xl font-bold">High Scores</h2>
                </div>
                <button
                  className={`p-1 rounded-full ${
                    isDark ? 'hover:bg-[#414868]' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setShowHighScores(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {highScores.map((score, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-[#1a1b26]' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{new Date(score.date).toLocaleDateString()}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {score.mode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">{score.wpm} WPM</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {score.accuracy}% Accuracy
                        </p>
                        {score.points && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-[#e0af68]/20 text-[#e0af68]' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {score.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {highScores.length === 0 && (
                  <p className="text-center text-gray-500">No high scores yet. Start typing!</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {videoId ? (
              <YouTubePlayer videoId={videoId} isDark={isDark} />
            ) : (
              <div className={`w-full aspect-video ${isDark ? 'bg-[#24283b]' : 'bg-white/80'} rounded-lg flex flex-col items-center justify-center gap-4`}>
                <Headphones className={`w-16 h-16 ${isDark ? 'text-[#7aa2f7]' : 'text-purple-600'}`} />
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Search for a Song</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
                    Type along with your favorite music videos and improve your typing speed with lyrics!
                  </p>
                </div>
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TypingArea isDark={isDark} soundEnabled={soundEnabled} />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-6 text-center">
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Practice typing while listening to your favorite music!
        </p>
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          Current Difficulty: <span className="font-medium capitalize">{difficulty}</span> • Level {level}
        </p>
      </footer>
      
      {/* Achievements Component */}
      <Achievements isDark={isDark} />
    </div>
  );
}

export default App;