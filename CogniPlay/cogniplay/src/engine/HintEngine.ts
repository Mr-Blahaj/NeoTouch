import { Hint, HintStage, Puzzle, PuzzleCategory } from './types';

const FIRST_HINTS: Record<PuzzleCategory, string> = {
  [PuzzleCategory.PATTERN_COMPLETION]: 'Look at the two pieces that keep coming back.',
  [PuzzleCategory.SHAPE_TRANSFORMATION]: 'Try matching the outside shape.',
  [PuzzleCategory.REFLECTION_SYMMETRY]: 'Look for the piece with the same outline.',
  [PuzzleCategory.COLOR_LOGIC]: 'Watch which color comes next.',
  [PuzzleCategory.COUNTING_NUMERACY]: 'Touch each piece once while you count.',
  [PuzzleCategory.ODD_ONE_OUT]: 'Find the one that does not look like the others.',
  [PuzzleCategory.SEQUENCING]: 'Look at the lights from left to right.',
  [PuzzleCategory.GRID_REASONING]: 'Find the piece that belongs with the group.',
  [PuzzleCategory.OBJECT_MOVEMENT]: 'Follow the open path with your finger.',
  [PuzzleCategory.CLASSIFICATION]: 'Look at what the group has in common.',
  [PuzzleCategory.ARC_RULE_DISCOVERY]: 'The pattern is simple. Watch what repeats.',
  [PuzzleCategory.MULTI_STEP_REASONING]: 'Think about what happens next in the little story.',
  [PuzzleCategory.LOGICAL_DEDUCTION]: 'Pick what would happen next.',
  [PuzzleCategory.SPATIAL_ASSEMBLY]: 'Match the shape to the soft shadow.',
  [PuzzleCategory.PATHFINDING]: 'Trace from the green start to the red home.',
};

const SECOND_HINTS: Record<PuzzleCategory, string> = {
  [PuzzleCategory.PATTERN_COMPLETION]: 'Say it softly: first, second, first, second.',
  [PuzzleCategory.SHAPE_TRANSFORMATION]: 'Corners and round edges can help you choose.',
  [PuzzleCategory.REFLECTION_SYMMETRY]: 'The right answer has the same silhouette.',
  [PuzzleCategory.COLOR_LOGIC]: 'Only one choice keeps the color rhythm going.',
  [PuzzleCategory.COUNTING_NUMERACY]: 'Move slowly so no piece gets counted twice.',
  [PuzzleCategory.ODD_ONE_OUT]: 'Three belong together. One does not.',
  [PuzzleCategory.SEQUENCING]: 'The same light order should appear again.',
  [PuzzleCategory.GRID_REASONING]: 'Choose the one that feels like part of the same family.',
  [PuzzleCategory.OBJECT_MOVEMENT]: 'The path with no blocks is the gentle path.',
  [PuzzleCategory.CLASSIFICATION]: 'Match by shape first, then color.',
  [PuzzleCategory.ARC_RULE_DISCOVERY]: 'The empty spot wants the next repeating piece.',
  [PuzzleCategory.MULTI_STEP_REASONING]: 'Stories move one step at a time.',
  [PuzzleCategory.LOGICAL_DEDUCTION]: 'Look for the choice that makes sense with the first two.',
  [PuzzleCategory.SPATIAL_ASSEMBLY]: 'Try the piece that would cover the shadow.',
  [PuzzleCategory.PATHFINDING]: 'Do not cross the gray blocks.',
};

export function getHint(puzzle: Puzzle, stage: HintStage, attemptsSoFar = 0): Hint {
  void attemptsSoFar;
  if (stage === HintStage.NUDGE) {
    return { stage, text: FIRST_HINTS[puzzle.category] ?? 'Look closely and try one piece.' };
  }

  if (stage === HintStage.RULE) {
    return { stage, text: SECOND_HINTS[puzzle.category] ?? 'The answer is the one that fits best.' };
  }

  const optionLabels = puzzle.options?.map(option => option.label).filter(Boolean).slice(0, 4).join(', ');
  return {
    stage,
    text: optionLabels
      ? `Look at each choice: ${optionLabels}. Pick the one that fits the picture.`
      : 'Point to each choice, then tap the one that fits the picture.',
    llmPromptTemplate: `Give one gentle preschool hint for this visual puzzle: "${puzzle.instruction}". Do not reveal the answer. Use one short sentence.`,
  };
}

export function calculateHintPenalty(hintsUsed: number): number {
  if (hintsUsed <= 1) return 0;
  if (hintsUsed === 2) return 0.05;
  return 0.1;
}
