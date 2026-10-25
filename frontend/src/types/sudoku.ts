export type Grid4x4 = number[][]; // 4x4 矩阵，0 表示空格，1-4 表示填入数字

/**
 * 按 workloadNaked 划分的 3 档核心难度
 * easy: workloadNaked < 8.0 (1805类，基础唯余)
 * medium: 8.0 <= workloadNaked < 11.0 (1552类，综合进阶)
 * hard: workloadNaked >= 11.0 (1351类，深度推演)
 */
export type DifficultyTier = "easy" | "medium" | "hard";

export type DifficultyMode =
  | "easy"
  | "medium"
  | "hard"
  | "mixed_page"
  | "random"
  | "starter"
  | "medium_hypo_direct"
  | "medium_hypo_deep"
  | "medium_hypo_mixed";

export type SymbolType =
  | "numbers"
  | "letters"
  | "shapes"
  | "fruits"
  | "animals";

export interface SudokuPuzzle {
  id: number;
  targetClues: number;
  cluesCount: number;
  puzzle: Grid4x4;
  solution: Grid4x4;
  hypoType?: "direct" | "deep";
  difficultyTier?: DifficultyTier;
  workloadNaked?: number;
  roundsNaked?: number;
  classId?: number;
}
