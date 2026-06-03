import { AgeGroup, PuzzleCategory, Puzzle, HintStage, Hint } from './types';
import { generatePuzzle as generateProceduralPuzzle } from './PuzzleGenerator';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'llama3';

/**
 * Attempts to generate a puzzle using a local Ollama instance.
 * Falls back to the procedural generator if the local AI fails.
 */
export async function generatePuzzleAI(
  category: PuzzleCategory,
  ageGroup: AgeGroup,
  difficulty: number,
  model: string = DEFAULT_MODEL
): Promise<Puzzle> {
  void model;
  return generateProceduralPuzzle(category, ageGroup, difficulty);

  const prompt = `You are an expert cognitive scientist designing an educational puzzle game.
Generate a JSON puzzle for the category "${category}" suitable for age group "${ageGroup}" with difficulty ${difficulty.toFixed(2)} (0 to 1).
The JSON must perfectly match this TypeScript interface:

interface Puzzle {
  id: string; // unique UUID or timestamp
  seed: number;
  category: string; // the category passed in
  ageGroup: string; // the age group passed in
  difficulty: number;
  cognitiveLoad: string[]; // e.g., ["logical_reasoning", "pattern_recognition"]
  instruction: string; // child-friendly instructions
  interactionType: "select";
  options: { id: string, label?: string, value?: string | number }[]; // Exactly 4 options
  correctAnswer: string; // the ID of the correct option
  estimatedTimeSeconds: number;
  maxHints: number;
  irtParameters: { difficulty: number, discrimination: number, guessing: number };
}

Output ONLY valid JSON. No markdown formatting, no explanations.`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.7 }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const puzzleData = JSON.parse(data.response);
    
    // Strict validation to prevent UI crashes from AI hallucinations
    if (!puzzleData.id || !puzzleData.instruction || !Array.isArray(puzzleData.options)) {
      throw new Error('AI generated invalid puzzle schema: missing base fields');
    }
    
    if (puzzleData.options.length !== 4) {
      throw new Error(`AI generated ${puzzleData.options.length} options instead of exactly 4`);
    }

    if (!puzzleData.correctAnswer) {
      throw new Error('AI missing correctAnswer ID');
    }

    // Check that the correctAnswer actually exists in the options
    if (!puzzleData.options.some((opt: any) => opt.id === puzzleData.correctAnswer)) {
      throw new Error('AI correctAnswer ID does not match any generated option');
    }

    // For grid-based puzzles, the AI often hallucinates or fails to generate the complex Grid objects.
    // If it's a grid category and it's missing 'grid', we reject it to trigger the procedural fallback.
    const gridCategories = [PuzzleCategory.GRID_REASONING, PuzzleCategory.ARC_RULE_DISCOVERY, PuzzleCategory.COLOR_LOGIC];
    if (gridCategories.includes(category)) {
       if (!puzzleData.grid && !puzzleData.testInput) {
          throw new Error('AI failed to generate required Grid objects for this category');
       }
    }

    return puzzleData as Puzzle;
  } catch (error) {
    console.warn('Local AI generation failed, falling back to procedural generator.', error);
    // Fallback to the procedural generator
    return generateProceduralPuzzle(category, ageGroup, difficulty);
  }
}

/**
 * Generates a contextual hint using the local AI based on the puzzle and current stage.
 */
export async function generateHintAI(
  puzzle: Puzzle,
  stage: HintStage,
  model: string = DEFAULT_MODEL
): Promise<Hint> {
  const stageInstruction = stage === HintStage.NUDGE 
    ? 'Provide a very subtle nudge, just pointing them in the right direction.'
    : stage === HintStage.RULE 
      ? 'Explain the underlying rule or pattern without giving away the answer.'
      : 'Give a guided, step-by-step hint that heavily implies the correct answer without explicitly saying it.';

  const prompt = `You are a helpful tutor in a puzzle game.
The puzzle instruction is: "${puzzle.instruction}"
The correct answer is: "${puzzle.correctAnswer}" (Do NOT state this explicitly).
The current hint stage is: ${stage}.
${stageInstruction}

Output ONLY a JSON object with this format:
{ "stage": "${stage}", "text": "Your hint text here" }`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.5 }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.response) as Hint;
  } catch (error) {
    console.warn('Local AI hint generation failed, using fallback text.', error);
    return {
      stage,
      text: stage === HintStage.NUDGE 
        ? "Look closely at the pattern again! What seems to be changing?"
        : "Think about how the elements move or change color step-by-step."
    };
  }
}
