import type { Grid4x4, SudokuPuzzle } from "../types/sudoku";

/**
 * 四宫格数独生成与求解校验引擎 (4x4 Sudoku Core Engine)
 */
export class Sudoku4x4Engine {
  /**
   * 检查在 (r, c) 填入 val 是否合法（满足 4x4 行、列、2x2 宫格规则）
   */
  static isValid(grid: Grid4x4, r: number, c: number, val: number): boolean {
    for (let i = 0; i < 4; i++) {
      if (grid[r][i] === val || grid[i][c] === val) return false;
    }
    const br = Math.floor(r / 2) * 2;
    const bc = Math.floor(c / 2) * 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (grid[br + i][bc + j] === val) return false;
      }
    }
    return true;
  }

  /**
   * 生成合法的完整终盘（基于回溯 + 随机洗牌）
   */
  static generateCompleteBoard(): Grid4x4 {
    const grid: Grid4x4 = Array.from({ length: 4 }, () => Array(4).fill(0));

    function fill(pos: number): boolean {
      if (pos === 16) return true;
      const r = Math.floor(pos / 4);
      const c = pos % 4;
      const nums = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
      for (const val of nums) {
        if (Sudoku4x4Engine.isValid(grid, r, c, val)) {
          grid[r][c] = val;
          if (fill(pos + 1)) return true;
          grid[r][c] = 0;
        }
      }
      return false;
    }

    fill(0);
    return grid;
  }

  /**
   * 统计解的数量，用来严格保障唯一解
   */
  static countSolutions(grid: Grid4x4, limit = 2): number {
    let count = 0;
    const work: Grid4x4 = grid.map((row) => [...row]);

    function backtrack(pos: number): boolean {
      if (pos === 16) {
        count++;
        return count >= limit;
      }
      const r = Math.floor(pos / 4);
      const c = pos % 4;
      if (work[r][c] !== 0) {
        return backtrack(pos + 1);
      }
      for (let val = 1; val <= 4; val++) {
        if (Sudoku4x4Engine.isValid(work, r, c, val)) {
          work[r][c] = val;
          if (backtrack(pos + 1)) return true;
          work[r][c] = 0;
        }
      }
      return false;
    }

    backtrack(0);
    return count;
  }

  /**
   * 单次尝试挖空生成题目
   */
  static generatePuzzleSingle(targetClues: number): {
    puzzle: Grid4x4;
    solution: Grid4x4;
    cluesCount: number;
  } {
    const complete = Sudoku4x4Engine.generateCompleteBoard();
    const puzzle: Grid4x4 = complete.map((row) => [...row]);

    const positions: number[] = [];
    for (let i = 0; i < 16; i++) positions.push(i);
    positions.sort(() => Math.random() - 0.5);

    const holesToDig = 16 - targetClues;
    let dug = 0;

    for (const pos of positions) {
      if (dug >= holesToDig) break;
      const r = Math.floor(pos / 4);
      const c = pos % 4;
      const original = puzzle[r][c];

      puzzle[r][c] = 0;

      // 校验是否唯一解
      if (Sudoku4x4Engine.countSolutions(puzzle, 2) === 1) {
        dug++;
      } else {
        puzzle[r][c] = original; // 发生多解，恢复原数
      }
    }

    return {
      puzzle,
      solution: complete,
      cluesCount: 16 - dug,
    };
  }

  /**
   * 挖空生成题目，严格保证唯一解
   */
  static generatePuzzle(
    targetClues: number,
    id = 1
  ): SudokuPuzzle {
    const maxAttempts = targetClues <= 5 ? 8 : 1;
    let best: {
      puzzle: Grid4x4;
      solution: Grid4x4;
      cluesCount: number;
    } | null = null;

    for (let i = 0; i < maxAttempts; i++) {
      const res = Sudoku4x4Engine.generatePuzzleSingle(targetClues);
      if (!best || res.cluesCount < best.cluesCount) {
        best = res;
      }
      if (best.cluesCount <= targetClues) {
        break;
      }
    }

    return {
      id,
      targetClues,
      cluesCount: best!.cluesCount,
      puzzle: best!.puzzle,
      solution: best!.solution,
    };
  }
}
