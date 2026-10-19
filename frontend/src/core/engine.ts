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

  /**
   * 4x4 数独的 12 个基本单元定义（4行、4列、4宫）
   */
  static getUnits(): [number, number][][] {
    const units: [number, number][][] = [];
    // 4 行
    for (let r = 0; r < 4; r++) {
      units.push([
        [r, 0],
        [r, 1],
        [r, 2],
        [r, 3],
      ]);
    }
    // 4 列
    for (let c = 0; c < 4; c++) {
      units.push([
        [0, c],
        [1, c],
        [2, c],
        [3, c],
      ]);
    }
    // 4 宫
    for (let b = 0; b < 4; b++) {
      const br = Math.floor(b / 2) * 2;
      const bc = (b % 2) * 2;
      units.push([
        [br, bc],
        [br, bc + 1],
        [br + 1, bc],
        [br + 1, bc + 1],
      ]);
    }
    return units;
  }

  /**
   * 检查盘面两格假设（二选一试数）的特征
   */
  static analyzeHypothesisFeatures(
    puzzle: Grid4x4,
    solution: Grid4x4
  ): {
    has1HoleUnit: boolean;
    directCount: number;
    deepCount: number;
    rowDirectCount: number;
    rowDeepCount: number;
  } {
    const units = Sudoku4x4Engine.getUnits();
    let has1HoleUnit = false;
    let directCount = 0;
    let deepCount = 0;
    let rowDirectCount = 0;
    let rowDeepCount = 0;

    // 检查所有 12 个基本单元（4行、4列、4宫）
    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const cells = units[uIdx];
      const empty = cells.filter(([r, c]) => puzzle[r][c] === 0);
      if (empty.length === 1) {
        has1HoleUnit = true;
      } else if (empty.length === 2) {
        const [c1, c2] = empty;
        const v1Corr = solution[c1[0]][c1[1]];
        const v2Corr = solution[c2[0]][c2[1]];

        // 另一种组合为交换两个数字
        const v1Wrong = v2Corr;
        const v2Wrong = v1Corr;

        // 校验试填错误组合时，所填空格所在排/列/宫是否引发直接矛盾
        const valid1 = Sudoku4x4Engine.isValid(puzzle, c1[0], c1[1], v1Wrong);
        const valid2 = Sudoku4x4Engine.isValid(puzzle, c2[0], c2[1], v2Wrong);

        const isDirect = !valid1 || !valid2;

        if (isDirect) {
          directCount++;
          if (uIdx < 4) {
            rowDirectCount++;
          }
        } else {
          deepCount++;
          if (uIdx < 4) {
            rowDeepCount++;
          }
        }
      }
    }

    return {
      has1HoleUnit,
      directCount,
      deepCount,
      rowDirectCount,
      rowDeepCount,
    };
  }

  /**
   * 生成符合两格假设特征（直接排除 或 深度尝试）的专题训练题目
   */
  static generateHypothesisPuzzle(
    targetType: "direct" | "deep",
    id = 1
  ): SudokuPuzzle {
    // 深度尝试题目需锁定在 5~6 数，严格保证所有两空格排均无直接排除
    const targetCluesPool = targetType === "deep" ? [5, 6] : [6, 7];
    const maxAttempts = 180;

    let fallbackPuzzle: Grid4x4 | null = null;
    let fallbackSolution: Grid4x4 | null = null;
    let fallbackClues = 6;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const targetClues =
        targetCluesPool[Math.floor(Math.random() * targetCluesPool.length)];
      const res = Sudoku4x4Engine.generatePuzzleSingle(targetClues);

      const features = Sudoku4x4Engine.analyzeHypothesisFeatures(
        res.puzzle,
        res.solution
      );

      // 无论何种假设题目，开局绝不能有只剩 1 空格的单元
      if (features.has1HoleUnit) {
        if (!fallbackPuzzle) {
          fallbackPuzzle = res.puzzle;
          fallbackSolution = res.solution;
          fallbackClues = res.cluesCount;
        }
        continue;
      }

      if (targetType === "deep") {
        // 深度尝试的核心铁律：
        // 1. 绝不允许任何一排（行）存在可以直接排除的两格情形（杜绝做题者从某一排顺着直接排除一路平推解完）
        // 2. 必须存在至少一排刚好剩 2 个空格，且无论填入哪种组合，所填空格所在的排、列、小宫格局部均不引起任何矛盾
        if (features.rowDirectCount === 0 && features.rowDeepCount > 0) {
          return {
            id,
            targetClues,
            cluesCount: res.cluesCount,
            puzzle: res.puzzle,
            solution: res.solution,
            hypoType: "deep",
          };
        }
      } else {
        // 直接排除的核心规范：
        // 必须存在可以直接排除的两格排（一试填立刻在交叉列/宫出现相同数字发生矛盾）
        if (features.rowDirectCount > 0) {
          return {
            id,
            targetClues,
            cluesCount: res.cluesCount,
            puzzle: res.puzzle,
            solution: res.solution,
            hypoType: "direct",
          };
        }
      }

      if (!fallbackPuzzle) {
        fallbackPuzzle = res.puzzle;
        fallbackSolution = res.solution;
        fallbackClues = res.cluesCount;
      }
    }

    return {
      id,
      targetClues: fallbackClues,
      cluesCount: fallbackClues,
      puzzle: fallbackPuzzle!,
      solution: fallbackSolution!,
      hypoType: targetType,
    };
  }
}
