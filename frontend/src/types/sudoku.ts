export type Grid4x4 = number[][]; // 4x4 矩阵，0 表示空格，1-4 表示填入数字

export type DifficultyMode =
  | "starter"
  | "easy"
  | "medium"
  | "medium_hypo_direct"
  | "medium_hypo_deep"
  | "medium_hypo_mixed"
  | "hard"
  | "mixed_page"
  | "random";

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
}
