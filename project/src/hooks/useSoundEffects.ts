import { useState, useEffect, useCallback } from 'react';
import { useTypingStore } from '../store/typingStore';

type SoundType = 'correct' | 'error' | 'combo' | 'achievement' | 'levelUp';

const soundFiles: Record<SoundType, string> = {
  correct: '/sounds/correct.mp3',
  error: '/sounds/error.mp3',
  combo: '/sounds/combo.mp3',
  achievement: '/sounds/achievement.mp3',
  levelUp: '/sounds/level-up.mp3'
};

interface SoundOptions {
  volume?: number;
  playbackRate?: number;
}

export function useSoundEffects(enabled: boolean = true) {
  const [sounds, setSounds] = useState<Record<SoundType, HTMLAudioElement | null>>({
    correct: null,
    error: null,
    combo: null,
    achievement: null,
    levelUp: null
  });
  
  const [prevCombo, setPrevCombo] = useState(0);
  const [prevLevel, setPrevLevel] = useState(1);
  const { combo, level, achievements } = useTypingStore();
  
  // Initialize sounds
  useEffect(() => {
    const loadedSounds: Record<SoundType, HTMLAudioElement> = {} as Record<SoundType, HTMLAudioElement>;
    
    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      loadedSounds[key as SoundType] = audio;
    });
    
    setSounds(loadedSounds);
    
    // Cleanup
    return () => {
      Object.values(loadedSounds).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);
  
  // Monitor combo changes
  useEffect(() => {
    if (!enabled || !sounds.combo) return;
    
    // Play combo sound on milestone combos
    if (combo > 0 && combo % 10 === 0 && combo > prevCombo) {
      playSound('combo', { playbackRate: Math.min(1 + (combo / 100), 2) });
    }
    
    setPrevCombo(combo);
  }, [combo, enabled, sounds.combo, prevCombo]);
  
  // Monitor level changes
  useEffect(() => {
    if (!enabled || !sounds.levelUp) return;
    
    if (level > prevLevel) {
      playSound('levelUp');
    }
    
    setPrevLevel(level);
  }, [level, enabled, sounds.levelUp, prevLevel]);
  
  // Monitor achievement changes
  useEffect(() => {
    if (!enabled || !sounds.achievement) return;
    
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const dispatchEvent = (e: Event) => document.dispatchEvent(e);
    
    // Set up listener for custom achievement event
    const handleAchievementUnlock = () => {
      playSound('achievement');
    };
    
    document.addEventListener('achievement-unlocked', handleAchievementUnlock);
    
    return () => {
      document.removeEventListener('achievement-unlocked', handleAchievementUnlock);
    };
  }, [achievements, enabled, sounds.achievement]);
  
  const playSound = useCallback((type: SoundType, options: SoundOptions = {}) => {
    if (!enabled || !sounds[type]) return;
    
    const sound = sounds[type];
    if (sound) {
      // Clone the audio to allow for overlapping sounds
      const soundClone = sound.cloneNode() as HTMLAudioElement;
      
      if (options.volume !== undefined) {
        soundClone.volume = options.volume;
      }
      
      if (options.playbackRate !== undefined) {
        soundClone.playbackRate = options.playbackRate;
      }
      
      soundClone.play().catch(err => {
        console.warn(`Failed to play sound: ${err.message}`);
      });
    }
  }, [enabled, sounds]);
  
  return { playSound };
} 