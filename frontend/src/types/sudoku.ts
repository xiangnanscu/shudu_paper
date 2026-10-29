export type Grid4x4 = number[][]; // 4x4 矩阵，0 表示空格，1-4 表示填入数字

/**
 * 难度分档制：默认 6 档，支持调整为 3 档、5 档等细化分级
 */
export type TierDivision = 3 | 5 | 6;

/**
 * 难度模式枚举
 */
export type DifficultyMode =
  // 通用/动态
  | "mixed_page"
  | "random"
  // 6 档制 (默认 · 1级 -> 6级)
  | "tier_6_1"
  | "tier_6_2"
  | "tier_6_3"
  | "tier_6_4"
  | "tier_6_5"
  | "tier_6_6"
  // 3 档制
  | "easy"
  | "medium"
  | "hard"
  // 5 档制 (入门 -> 挑战)
  | "tier_5_1"
  | "tier_5_2"
  | "tier_5_3"
  | "tier_5_4"
  | "tier_5_5"
  // 历史兼容
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
  workloadNaked?: number;
  tierIndex?: number;    // 当前处于的档位索引 (0 到 totalTiers - 1)
  totalTiers?: number;   // 当前采用的总档位数 (3, 5, 6 等)
  tierName?: string;     // 档位名称 (如 "简单", "适中", "困难", "进阶", "4级")
}
