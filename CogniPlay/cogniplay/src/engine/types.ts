// ─── CogniPlay Core Type System ───────────────────────────────────────────────

/** Age-based difficulty groupings */
export enum AgeGroup {
  GROUP_A = 'age_3_5',
  GROUP_B = 'age_6_8',
  GROUP_C = 'age_9_12',
}

/** All 15 puzzle categories */
export enum PuzzleCategory {
  PATTERN_COMPLETION = 'pattern_completion',
  SHAPE_TRANSFORMATION = 'shape_transformation',
  REFLECTION_SYMMETRY = 'reflection_symmetry',
  COLOR_LOGIC = 'color_logic',
  COUNTING_NUMERACY = 'counting_numeracy',
  ODD_ONE_OUT = 'odd_one_out',
  SEQUENCING = 'sequencing',
  GRID_REASONING = 'grid_reasoning',
  OBJECT_MOVEMENT = 'object_movement',
  CLASSIFICATION = 'classification',
  ARC_RULE_DISCOVERY = 'arc_rule_discovery',
  MULTI_STEP_REASONING = 'multi_step_reasoning',
  LOGICAL_DEDUCTION = 'logical_deduction',
  SPATIAL_ASSEMBLY = 'spatial_assembly',
  PATHFINDING = 'pathfinding',
}

/** Cognitive dimensions tracked for each player */
export enum CognitiveDimension {
  PATTERN_RECOGNITION = 'pattern_recognition',
  SPATIAL_INTELLIGENCE = 'spatial_intelligence',
  LOGICAL_REASONING = 'logical_reasoning',
  WORKING_MEMORY = 'working_memory',
  ATTENTION_CONTROL = 'attention_control',
  PERSISTENCE = 'persistence',
  LEARNING_SPEED = 'learning_speed',
}

// ─── Puzzle Building Blocks ──────────────────────────────────────────────────

/** A 2D grid of cell values (0 = empty, 1-9 = colours) */
export interface Grid {
  width: number;
  height: number;
  cells: number[][];
}

/** A visual element inside a puzzle (shape, icon, etc.) */
export interface PuzzleElement {
  type: string;        // e.g. 'circle', 'square', 'triangle', 'star'
  color: number;       // palette index
  size: number;        // relative size 1-3
  rotation: number;    // degrees
  position: { x: number; y: number };
}

/** One selectable option presented to the player */
export interface PuzzleOption {
  id: string;
  elements?: PuzzleElement[];
  grid?: Grid;
  label?: string;
  value?: string | number | number[] | number[][];
}

/** The correct answer — may be an option id, a grid, a sequence, or a path */
export type Answer = string | number | number[] | Grid;

/** How the player interacts with the puzzle */
export type InteractionType = 'select' | 'grid_paint' | 'drag_drop' | 'sequence' | 'path' | 'trace_maze';

// ─── IRT (Item Response Theory) ──────────────────────────────────────────────

/** 3-Parameter Logistic model parameters */
export interface IRTParameters {
  /** Item difficulty, range [-3, 3] */
  difficulty: number;
  /** Item discrimination, range [0.5, 2.5] */
  discrimination: number;
  /** Guessing / pseudo-chance parameter, range [0, 0.35] */
  guessing: number;
}

// ─── Core Puzzle ─────────────────────────────────────────────────────────────

export interface Puzzle {
  id: string;
  seed: number;
  category: PuzzleCategory;
  ageGroup: AgeGroup;
  /** Normalised difficulty 0-1 */
  difficulty: number;
  /** Which cognitive dimensions this puzzle exercises */
  cognitiveLoad: CognitiveDimension[];
  /** Optional grid representation of the puzzle */
  grid?: Grid;
  /** Optional element-based representation */
  elements?: PuzzleElement[];
  /** Selectable answer options (typically 4) */
  options?: PuzzleOption[];
  /** The correct answer */
  correctAnswer: Answer;
  /** Expected solve time in seconds */
  estimatedTimeSeconds: number;
  /** Maximum hints available */
  maxHints: number;
  /** IRT calibration parameters */
  irtParameters: IRTParameters;
  /** Player-facing instruction text */
  instruction: string;
  /** How the player interacts with this puzzle */
  interactionType: InteractionType;
  /** Optional example input/output pairs (for ARC-style puzzles) */
  examplePairs?: { input: Grid; output: Grid }[];
  /** Optional test input grid (for ARC-style puzzles) */
  testInput?: Grid;
}

// ─── Attempt / History ───────────────────────────────────────────────────────

export interface PuzzleAttempt {
  puzzleId: string;
  category: PuzzleCategory;
  ageGroup: AgeGroup;
  difficulty: number;
  /** Player's submitted answer */
  answer: Answer;
  /** Was the answer correct? */
  correct: boolean;
  /** Time taken in milliseconds */
  timeTakenMs: number;
  /** Number of hints used */
  hintsUsed: number;
  /** Number of retry attempts before final answer */
  retries: number;
  /** ISO timestamp */
  timestamp: string;
  /** IRT parameters of the puzzle */
  irtParameters: IRTParameters;
}

// ─── Cognitive Profile ───────────────────────────────────────────────────────

export interface CognitiveProfile {
  playerId: string;
  /** Overall cognitive score, 0–1000 */
  cognitiveScore: number;
  /** Per-dimension scores, each 0–1000 */
  dimensions: Record<CognitiveDimension, number>;
  /** IRT ability estimate (log-odds scale, typically -3 to 3) */
  theta: number;
  /** Standard error of theta */
  standardError: number;
  /** Lifetime puzzles solved correctly */
  totalPuzzlesSolved: number;
  /** Current daily streak */
  streakDays: number;
  /** ISO timestamp of last profile update */
  lastUpdated: string;
}

// ─── Player Progress & Gamification ──────────────────────────────────────────

export interface PlayerProgress {
  currentWorld: string;
  /** Per-world completion 0-1 */
  worldProgress: Record<string, number>;
  totalXP: number;
  level: number;
  badges: string[];
  achievements: string[];
}

export interface World {
  id: string;
  name: string;
  emoji: string;
  description: string;
  categories: PuzzleCategory[];
  /** Minimum cognitive score to unlock */
  unlockScore: number;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Condition function described as a type – evaluated at runtime */
  condition: {
    type: 'puzzles_solved' | 'streak' | 'category_mastery' | 'score_threshold' | 'perfect_solves' | 'speed' | 'world_complete';
    threshold: number;
    category?: PuzzleCategory;
    world?: string;
  };
}

// ─── Hint System ─────────────────────────────────────────────────────────────

export enum HintStage {
  NUDGE = 'nudge',
  RULE = 'rule',
  GUIDED = 'guided',
}

export interface Hint {
  stage: HintStage;
  text: string;
  /** Optional visual highlight positions */
  highlightPositions?: { x: number; y: number }[];
  /** For stage 3: an optional prompt template for LLM assistance */
  llmPromptTemplate?: string;
}
