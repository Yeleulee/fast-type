import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SyncedLyric } from '../lib/lyrics';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  date?: string;
  icon: string;
}

interface TypingState {
  text: string;
  typedText: string;
  wpm: number;
  accuracy: number;
  errors: number;
  isPlaying: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'es' | 'fr' | 'de';
  mode: 'video' | 'practice' | 'challenge';
  practiceTexts: Record<string, string[]>;
  syncedLyrics: SyncedLyric[];
  currentTime: number;
  videoDuration: number;
  currentLyricIndex: number;
  streak: number;
  maxStreak: number;
  combo: number;
  maxCombo: number;
  comboMultiplier: number;
  points: number;
  level: number;
  achievements: Achievement[];
  highScores: Array<{
    date: string;
    wpm: number;
    accuracy: number;
    mode: string;
    points?: number;
  }>;
  setText: (text: string) => void;
  setTypedText: (text: string) => void;
  setWPM: (wpm: number) => void;
  setAccuracy: (accuracy: number) => void;
  setErrors: (errors: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  setLanguage: (language: 'en' | 'es' | 'fr' | 'de') => void;
  setMode: (mode: 'video' | 'practice' | 'challenge') => void;
  setSyncedLyrics: (lyrics: SyncedLyric[]) => void;
  setCurrentTime: (time: number) => void;
  setVideoDuration: (duration: number) => void;
  setCurrentLyricIndex: (index: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  addPoints: (amount: number) => void;
  unlockAchievement: (id: string) => void;
  addHighScore: (score: { wpm: number; accuracy: number; mode: string }) => void;
  reset: () => void;
}

// Define achievements
const defaultAchievements: Achievement[] = [
  {
    id: 'first_song',
    name: 'First Beat',
    description: 'Complete your first song',
    unlocked: false,
    icon: '🎵'
  },
  {
    id: 'perfect_accuracy',
    name: 'Perfect Harmony',
    description: 'Achieve 100% accuracy on any song',
    unlocked: false,
    icon: '🎯'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Type faster than 80 WPM',
    unlocked: false,
    icon: '⚡'
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Reach a 50x combo',
    unlocked: false,
    icon: '🔥'
  },
  {
    id: 'lyric_genius',
    name: 'Lyric Genius',
    description: 'Complete 10 songs',
    unlocked: false,
    icon: '🧠'
  }
];

export const useTypingStore = create<TypingState>()(
  persist(
    (set, get) => ({
      text: '',
      typedText: '',
      wpm: 0,
      accuracy: 100,
      errors: 0,
      isPlaying: false,
      difficulty: 'medium',
      language: 'en',
      mode: 'video',
      syncedLyrics: [],
      currentTime: 0,
      videoDuration: 0,
      currentLyricIndex: 0,
      streak: 0,
      maxStreak: 0,
      combo: 0,
      maxCombo: 0,
      comboMultiplier: 1,
      points: 0,
      level: 1,
      achievements: defaultAchievements,
      practiceTexts: {
        en: [
          'The quick brown fox jumps over the lazy dog.',
          'Pack my box with five dozen liquor jugs.',
          'How vexingly quick daft zebras jump!'
        ],
        es: [
          'El veloz murcielago hindu comia feliz cardillo y kiwi.',
          'La ciguena tocaba el saxofon detras del palenque de paja.',
          'Que extrano ver zorro equis jugar bajo mi whisky!'
        ],
        fr: [
          'Portez ce vieux whisky au juge blond qui fume.',
          'Le coeur decu mais l\'ame plutot naive.',
          'Voix ambigue d\'un coeur qui au zephyr prefere les jattes de kiwis.'
        ],
        de: [
          'Victor jagt zwolf Boxkampfer quer uber den grossen Sylter Deich.',
          'Falsches Uben von Xylophonmusik qualt jeden grosseren Zwerg.',
          'Zwolf Boxkampfer jagen Viktor quer uber den grossen Sylter Deich.'
        ]
      },
      highScores: [],
      setText: (text) => set({ text }),
      setTypedText: (typedText) => set({ typedText }),
      setWPM: (wpm) => set({ wpm }),
      setAccuracy: (accuracy) => set({ accuracy }),
      setErrors: (errors) => set({ errors }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setLanguage: (language) => set({ language }),
      setMode: (mode) => set({ mode }),
      setSyncedLyrics: (syncedLyrics) => set({ syncedLyrics }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setVideoDuration: (videoDuration) => set({ videoDuration }),
      setCurrentLyricIndex: (currentLyricIndex) => set({ currentLyricIndex }),
      incrementStreak: () => {
        const { streak, maxStreak } = get();
        const newStreak = streak + 1;
        const newMaxStreak = Math.max(maxStreak, newStreak);
        
        set({ 
          streak: newStreak, 
          maxStreak: newMaxStreak 
        });
        
        // Check streak-based achievements
        if (newStreak >= 100 && !get().achievements.find(a => a.id === 'streak_master')?.unlocked) {
          get().unlockAchievement('streak_master');
        }
      },
      resetStreak: () => set({ streak: 0 }),
      incrementCombo: () => {
        const { combo, maxCombo, comboMultiplier, difficulty } = get();
        const newCombo = combo + 1;
        const newMaxCombo = Math.max(maxCombo, newCombo);
        
        // Increase multiplier every 10 combos
        let newMultiplier = comboMultiplier;
        if (newCombo % 10 === 0 && newCombo > 0) {
          newMultiplier = Math.min(comboMultiplier + 0.5, 5); // Cap at 5x
        }
        
        set({ 
          combo: newCombo, 
          maxCombo: newMaxCombo,
          comboMultiplier: newMultiplier
        });
        
        // Add points for combo
        const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }[difficulty];
        const comboPoints = 10 * newMultiplier * difficultyMultiplier;
        get().addPoints(comboPoints);
        
        // Check combo-based achievements
        if (newCombo >= 50 && !get().achievements.find(a => a.id === 'combo_master')?.unlocked) {
          get().unlockAchievement('combo_master');
        }
      },
      resetCombo: () => set({ combo: 0, comboMultiplier: 1 }),
      addPoints: (amount) => {
        const { points, level } = get();
        const newPoints = points + amount;
        
        // Level up system (every 1000 points)
        const pointsForNextLevel = level * 1000;
        let newLevel = level;
        
        if (newPoints >= pointsForNextLevel) {
          newLevel = Math.floor(newPoints / 1000) + 1;
        }
        
        set({ points: newPoints, level: newLevel });
      },
      unlockAchievement: (id) => {
        const { achievements } = get();
        const newAchievements = achievements.map(achievement => 
          achievement.id === id 
            ? { ...achievement, unlocked: true, date: new Date().toISOString() } 
            : achievement
        );
        
        set({ achievements: newAchievements });
      },
      addHighScore: (score) => {
        const { points, maxCombo } = get();
        
        set((state) => ({
          highScores: [...state.highScores, { 
            ...score, 
            date: new Date().toISOString(),
            points 
          }]
            .sort((a, b) => b.wpm - a.wpm)
            .slice(0, 10)
        }));
        
        // Check for achievements
        const { achievements, wpm, accuracy } = get();
        
        // First song completed
        if (!achievements.find(a => a.id === 'first_song')?.unlocked) {
          get().unlockAchievement('first_song');
        }
        
        // Perfect accuracy
        if (accuracy === 100 && !achievements.find(a => a.id === 'perfect_accuracy')?.unlocked) {
          get().unlockAchievement('perfect_accuracy');
        }
        
        // Speed demon
        if (wpm >= 80 && !achievements.find(a => a.id === 'speed_demon')?.unlocked) {
          get().unlockAchievement('speed_demon');
        }
        
        // Lyric genius (check for 10 completed songs)
        const completedSongs = get().highScores.length;
        if (completedSongs >= 10 && !achievements.find(a => a.id === 'lyric_genius')?.unlocked) {
          get().unlockAchievement('lyric_genius');
        }
      },
      reset: () => set({
        typedText: '',
        wpm: 0,
        accuracy: 100,
        errors: 0,
        isPlaying: false,
        currentLyricIndex: 0,
        streak: 0,
        combo: 0,
        comboMultiplier: 1
      })
    }),
    {
      name: 'typing-store',
      partialize: (state) => ({
        highScores: state.highScores,
        language: state.language,
        difficulty: state.difficulty,
        achievements: state.achievements,
        maxStreak: state.maxStreak,
        maxCombo: state.maxCombo,
        points: state.points,
        level: state.level
      })
    }
  )
);