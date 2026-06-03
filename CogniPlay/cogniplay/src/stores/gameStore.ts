import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AgeGroup, PuzzleCategory, CognitiveDimension,
  Puzzle, PuzzleAttempt, CognitiveProfile, PlayerProgress, HintStage,
} from '../engine/types';
import { generatePuzzle, getCategoriesForAge } from '../engine/PuzzleGenerator';
import { updateTheta, thetaToScore, selectNextDifficulty, selectNextCategory } from '../engine/AdaptiveEngine';
import { updateProfile } from '../engine/CognitiveScorer';
import { getHint } from '../engine/HintEngine';
import { generatePuzzleAI, generateHintAI } from '../engine/AIEngine';
import { calculateXP, calculateStars, checkBadgeUnlocks, getUnlockedWorlds, WORLDS } from '../engine/RewardEngine';

interface SavedPlayer {
  name: string;
  profile: CognitiveProfile;
  progress: PlayerProgress;
  history: PuzzleAttempt[];
  selectedPuzzleGroups: PuzzleCategory[];
}

interface GameState {
  // Player identity
  playerName: string;
  ageGroup: AgeGroup | null;
  isSetup: boolean;
  players: Record<string, SavedPlayer>;
  useAI: boolean;
  isGeneratingAI: boolean;

  // Cognitive state
  profile: CognitiveProfile;
  progress: PlayerProgress;

  // Current session
  currentPuzzle: Puzzle | null;
  currentWorld: string;
  puzzleStartTime: number;
  hintsUsedThisPuzzle: number;
  retriesThisPuzzle: number;
  selectedOption: string | null;
  isCorrect: boolean | null;
  showResult: boolean;
  currentHintStage: number;
  currentHint: string | null;
  selectedPuzzleGroups: PuzzleCategory[];

  // History
  history: PuzzleAttempt[];
  sessionPuzzleCount: number;
  newBadges: string[];

  // Actions
  setPlayerInfo: (name: string, ageGroup?: AgeGroup) => void;
  switchPlayer: (name: string) => void;
  setPuzzleGroups: (groups: PuzzleCategory[]) => void;
  toggleAI: () => void;
  startNewPuzzle: (worldId?: string) => Promise<void>;
  selectOption: (optionId: string) => void;
  submitAnswer: () => void;
  answerOption: (optionId: string) => void;
  requestHint: () => Promise<void>;
  nextPuzzle: () => void;
  setCurrentWorld: (worldId: string) => void;
  clearNewBadges: () => void;
  resetGame: () => void;
}

function createDefaultProfile(): CognitiveProfile {
  const dims: Record<CognitiveDimension, number> = {
    [CognitiveDimension.PATTERN_RECOGNITION]: 500,
    [CognitiveDimension.SPATIAL_INTELLIGENCE]: 500,
    [CognitiveDimension.LOGICAL_REASONING]: 500,
    [CognitiveDimension.WORKING_MEMORY]: 500,
    [CognitiveDimension.ATTENTION_CONTROL]: 500,
    [CognitiveDimension.PERSISTENCE]: 500,
    [CognitiveDimension.LEARNING_SPEED]: 500,
  };
  return {
    playerId: 'player-1',
    cognitiveScore: 500,
    dimensions: dims,
    theta: 0,
    standardError: 1.5,
    totalPuzzlesSolved: 0,
    streakDays: 1,
    lastUpdated: new Date().toISOString(),
  };
}

function createDefaultProgress(): PlayerProgress {
  return {
    currentWorld: 'shape-forest',
    worldProgress: {},
    totalXP: 0,
    level: 1,
    badges: [],
    achievements: [],
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: '',
      ageGroup: AgeGroup.GROUP_A,
      isSetup: false,
      players: {},
      useAI: false,
      isGeneratingAI: false,
      profile: createDefaultProfile(),
      progress: createDefaultProgress(),
      currentPuzzle: null,
      currentWorld: 'shape-forest',
      puzzleStartTime: 0,
      hintsUsedThisPuzzle: 0,
      retriesThisPuzzle: 0,
      selectedOption: null,
      isCorrect: null,
      showResult: false,
      currentHintStage: 0,
      currentHint: null,
      selectedPuzzleGroups: [],
      history: [],
      sessionPuzzleCount: 0,
      newBadges: [],

      setPlayerInfo: (name, ageGroup = AgeGroup.GROUP_A) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        const state = get();
        const existing = state.players[cleanName];
        set({
          playerName: cleanName,
          ageGroup,
          isSetup: true,
          profile: existing?.profile ?? createDefaultProfile(),
          progress: existing?.progress ?? createDefaultProgress(),
          history: existing?.history ?? [],
          selectedPuzzleGroups: existing?.selectedPuzzleGroups ?? [],
          currentPuzzle: null,
          selectedOption: null,
          isCorrect: null,
          showResult: false,
          sessionPuzzleCount: 0,
          players: {
            ...state.players,
            [cleanName]: existing ?? {
              name: cleanName,
              profile: createDefaultProfile(),
              progress: createDefaultProgress(),
              history: [],
              selectedPuzzleGroups: [],
            },
          },
        });
      },

      switchPlayer: (name) => {
        get().setPlayerInfo(name, AgeGroup.GROUP_A);
      },

      setPuzzleGroups: (groups) => set((state) => ({
        selectedPuzzleGroups: groups,
        players: state.playerName ? {
          ...state.players,
          [state.playerName]: {
            name: state.playerName,
            profile: state.profile,
            progress: state.progress,
            history: state.history,
            selectedPuzzleGroups: groups,
          },
        } : state.players,
      })),

      toggleAI: () => set((state) => ({ useAI: !state.useAI })),

      startNewPuzzle: async (worldId) => {
        const state = get();
        if (!state.ageGroup) return;

        set({ isGeneratingAI: true });
        
        try {
          const world = WORLDS.find(w => w.id === (worldId || state.currentWorld));
          const worldCategories = world?.categories ?? getCategoriesForAge(state.ageGroup);
          const selectedInWorld = state.selectedPuzzleGroups.filter(category => worldCategories.includes(category));
          const categories = selectedInWorld.length > 0 ? selectedInWorld : worldCategories;
          const category = selectNextCategory(state.history, categories);
          const difficulty = selectNextDifficulty(state.profile.theta, state.history);
          
          let puzzle: Puzzle;
          if (state.useAI) {
            puzzle = await generatePuzzleAI(category, state.ageGroup, difficulty);
          } else {
            puzzle = generatePuzzle(category, state.ageGroup, difficulty);
          }

          set({
            currentPuzzle: puzzle,
            puzzleStartTime: Date.now(),
            hintsUsedThisPuzzle: 0,
            retriesThisPuzzle: 0,
            selectedOption: null,
            isCorrect: null,
            showResult: false,
            currentHintStage: 0,
            currentHint: null,
            isGeneratingAI: false,
          });
        } catch (error) {
          console.error('Failed to generate puzzle:', error);
          set({ isGeneratingAI: false });
        }
      },

      selectOption: (optionId) => {
        if (get().showResult) return;
        set({ selectedOption: optionId });
      },

      submitAnswer: () => {
        const state = get();
        if (!state.currentPuzzle || !state.selectedOption) return;

        const correct = state.selectedOption === state.currentPuzzle.correctAnswer;
        const timeTakenMs = Date.now() - state.puzzleStartTime;

        const attempt: PuzzleAttempt = {
          puzzleId: state.currentPuzzle.id,
          category: state.currentPuzzle.category,
          ageGroup: state.currentPuzzle.ageGroup,
          difficulty: state.currentPuzzle.difficulty,
          answer: state.selectedOption,
          correct,
          timeTakenMs,
          hintsUsed: state.hintsUsedThisPuzzle,
          retries: state.retriesThisPuzzle,
          timestamp: new Date().toISOString(),
          irtParameters: state.currentPuzzle.irtParameters,
        };

        // Update theta
        const { newTheta, newSE } = updateTheta(state.profile.theta, attempt);
        const newScore = thetaToScore(newTheta);

        // Update cognitive profile
        const updatedProfile = updateProfile({
          ...state.profile,
          theta: newTheta,
          standardError: newSE,
          cognitiveScore: newScore,
        }, attempt);

        // Calculate rewards
        const xp = calculateXP(state.currentPuzzle.difficulty, attempt, state.profile.streakDays);
        const stars = calculateStars(attempt);
        const newHistory = [...state.history, attempt];

        // Check badges
        const earnedBadges = checkBadgeUnlocks(updatedProfile, newHistory, state.progress.badges);
        const newBadgeIds = earnedBadges.map(b => b.id);

        // Update level (every 100 XP)
        const newTotalXP = state.progress.totalXP + xp;
        const newLevel = Math.floor(newTotalXP / 100) + 1;

        const nextProgress = {
          ...state.progress,
          totalXP: newTotalXP,
          level: newLevel,
          badges: [...state.progress.badges, ...newBadgeIds],
        };

        set({
          isCorrect: correct,
          showResult: true,
          profile: updatedProfile,
          history: newHistory,
          sessionPuzzleCount: state.sessionPuzzleCount + 1,
          newBadges: newBadgeIds,
          progress: nextProgress,
          players: state.playerName ? {
            ...state.players,
            [state.playerName]: {
              name: state.playerName,
              profile: updatedProfile,
              progress: nextProgress,
              history: newHistory,
              selectedPuzzleGroups: state.selectedPuzzleGroups,
            },
          } : state.players,
        });
      },

      answerOption: (optionId) => {
        const state = get();
        if (!state.currentPuzzle || state.showResult) return;

        const correct = optionId === state.currentPuzzle.correctAnswer;
        const timeTakenMs = Date.now() - state.puzzleStartTime;
        const attempt: PuzzleAttempt = {
          puzzleId: state.currentPuzzle.id,
          category: state.currentPuzzle.category,
          ageGroup: state.currentPuzzle.ageGroup,
          difficulty: state.currentPuzzle.difficulty,
          answer: optionId,
          correct,
          timeTakenMs,
          hintsUsed: state.hintsUsedThisPuzzle,
          retries: state.retriesThisPuzzle,
          timestamp: new Date().toISOString(),
          irtParameters: state.currentPuzzle.irtParameters,
        };

        const { newTheta, newSE } = updateTheta(state.profile.theta, attempt);
        const updatedProfile = updateProfile({
          ...state.profile,
          theta: newTheta,
          standardError: newSE,
          cognitiveScore: thetaToScore(newTheta),
        }, attempt);
        const xp = calculateXP(state.currentPuzzle.difficulty, attempt, state.profile.streakDays);
        const newHistory = [...state.history, attempt];
        const earnedBadges = checkBadgeUnlocks(updatedProfile, newHistory, state.progress.badges);
        const newBadgeIds = earnedBadges.map(b => b.id);
        const newTotalXP = state.progress.totalXP + xp;

        const nextProgress = {
          ...state.progress,
          totalXP: newTotalXP,
          level: Math.floor(newTotalXP / 100) + 1,
          badges: [...state.progress.badges, ...newBadgeIds],
        };

        set({
          selectedOption: optionId,
          isCorrect: correct,
          showResult: true,
          profile: updatedProfile,
          history: newHistory,
          sessionPuzzleCount: state.sessionPuzzleCount + 1,
          newBadges: newBadgeIds,
          progress: nextProgress,
          players: state.playerName ? {
            ...state.players,
            [state.playerName]: {
              name: state.playerName,
              profile: updatedProfile,
              progress: nextProgress,
              history: newHistory,
              selectedPuzzleGroups: state.selectedPuzzleGroups,
            },
          } : state.players,
        });
      },

      requestHint: async () => {
        const state = get();
        if (!state.currentPuzzle || state.currentHintStage >= 3 || state.isGeneratingAI) return;

        set({ isGeneratingAI: true });
        const stages = [HintStage.NUDGE, HintStage.RULE, HintStage.GUIDED];
        const stage = stages[state.currentHintStage];
        
        try {
          let hintText = '';
          if (state.useAI) {
            const aiHint = await generateHintAI(state.currentPuzzle, stage);
            hintText = aiHint.text;
          } else {
            const procHint = getHint(state.currentPuzzle, stage, state.retriesThisPuzzle);
            hintText = procHint.text;
          }

          set({
            currentHintStage: state.currentHintStage + 1,
            hintsUsedThisPuzzle: state.hintsUsedThisPuzzle + 1,
            currentHint: hintText,
            isGeneratingAI: false,
          });
        } catch (error) {
          console.error('Hint generation failed:', error);
          set({ isGeneratingAI: false });
        }
      },

      nextPuzzle: () => {
        get().startNewPuzzle();
      },

      setCurrentWorld: (worldId) => set({
        currentWorld: worldId,
        progress: { ...get().progress, currentWorld: worldId },
      }),

      clearNewBadges: () => set({ newBadges: [] }),

      resetGame: () => set({
        playerName: '',
        ageGroup: AgeGroup.GROUP_A,
        isSetup: false,
        profile: createDefaultProfile(),
        progress: createDefaultProgress(),
        currentPuzzle: null,
        history: [],
        sessionPuzzleCount: 0,
      }),
    }),
    {
      name: 'cogniplay-storage',
      partialize: (state) => ({
        playerName: state.playerName,
        ageGroup: state.ageGroup,
        isSetup: state.isSetup,
        useAI: state.useAI,
        selectedPuzzleGroups: state.selectedPuzzleGroups,
        players: state.players,
        profile: state.profile,
        progress: state.progress,
        history: state.history.slice(-200), // Keep last 200 attempts
      }),
    }
  )
);
