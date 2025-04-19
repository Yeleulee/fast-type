import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X } from 'lucide-react';
import { useTypingStore, Achievement } from '../store/typingStore';

interface AchievementsProps {
  isDark?: boolean;
}

export function Achievements({ isDark = false }: AchievementsProps) {
  const { achievements } = useTypingStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const hasNewAchievements = unlockedAchievements.length > 0;
  
  return (
    <>
      <motion.button
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg flex items-center justify-center ${
          isDark 
            ? 'bg-[#1a1b26] text-[#e0af68]' 
            : 'bg-white text-yellow-500'
        } ${hasNewAchievements && !isOpen ? 'animate-pulse' : ''}`}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
      >
        <Award size={24} />
        {hasNewAchievements && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {unlockedAchievements.length}
          </span>
        )}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className={`relative w-full max-w-xl mx-auto p-6 rounded-xl ${
                isDark ? 'bg-[#24283b]' : 'bg-white'
              }`}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                className={`absolute top-4 right-4 p-1 rounded-full ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
              
              <h2 className={`text-2xl font-bold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Achievements
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map(achievement => (
                  <AchievementCard 
                    key={achievement.id} 
                    achievement={achievement} 
                    isDark={isDark} 
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  isDark?: boolean;
}

function AchievementCard({ achievement, isDark = false }: AchievementCardProps) {
  const isUnlocked = achievement.unlocked;
  
  return (
    <motion.div
      className={`p-4 rounded-lg transition-colors ${
        isUnlocked
          ? isDark 
            ? 'bg-[#1a1b26] border-2 border-[#e0af68]' 
            : 'bg-white shadow border-2 border-yellow-400'
          : isDark 
            ? 'bg-[#1a1b26]/50 opacity-60' 
            : 'bg-gray-100 opacity-60'
      }`}
      whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        <div>
          <h3 className={`font-bold ${
            isDark ? (isUnlocked ? 'text-[#e0af68]' : 'text-gray-400') : (isUnlocked ? 'text-yellow-600' : 'text-gray-500')
          }`}>
            {achievement.name}
          </h3>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {achievement.description}
          </p>
          {isUnlocked && achievement.date && (
            <p className={`text-xs mt-2 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Unlocked: {new Date(achievement.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      
      {!isUnlocked && (
        <div className={`mt-2 text-xs ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          Locked
        </div>
      )}
    </motion.div>
  );
} 