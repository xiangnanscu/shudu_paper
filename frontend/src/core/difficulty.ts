import type { DifficultyMode } from "../types/sudoku";

/**
 * 难度与已知数分配策略
 */
export function getDifficultyClues(
  diffType: DifficultyMode,
  indexOnPage: number,
  totalOnPage: number
): number {
  switch (diffType) {
    case "starter": {
      const list = [13, 14];
      return list[Math.floor(Math.random() * list.length)];
    }
    case "easy": {
      const list = [9, 10, 11, 12];
      return list[Math.floor(Math.random() * list.length)];
    }
    case "medium": {
      const list = [6, 7, 8];
      return list[Math.floor(Math.random() * list.length)];
    }
    case "hard": {
      const list = [4, 5];
      return list[Math.floor(Math.random() * list.length)];
    }
    case "mixed_page": {
      const ratio = indexOnPage / Math.max(1, totalOnPage - 1);
      if (ratio < 0.25) {
        return Math.random() < 0.5 ? 13 : 14;
      } else if (ratio < 0.55) {
        return [9, 10, 11, 12][Math.floor(Math.random() * 4)];
      } else if (ratio < 0.8) {
        return [6, 7, 8][Math.floor(Math.random() * 3)];
      } else {
        return [4, 5][Math.floor(Math.random() * 2)];
      }
    }
    case "random":
    default: {
      const pool = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
}
