import type { DifficultyTier, Grid4x4, SudokuPuzzle } from "../types/sudoku";
import classesJson from "./sudoku-classes.json";

export type RawClassTuple = [
  id: number,
  puzzle: string,
  solution: string,
  workloadNaked: number,
  blanks: number,
  roundsNaked: number
];

export interface SudokuClassesData {
  easy: RawClassTuple[];
  medium: RawClassTuple[];
  hard: RawClassTuple[];
}

const CLASSES_DATA = classesJson as SudokuClassesData;

// ---------------------------------------------------------------- 几何结构与对称变换群
export const UNITS: number[][] = (() => {
  const u: number[][] = [];
  for (let r = 0; r < 4; r++) u.push([0, 1, 2, 3].map((c) => r * 4 + c));
  for (let c = 0; c < 4; c++) u.push([0, 1, 2, 3].map((r) => r * 4 + c));
  for (let b = 0; b < 4; b++) {
    const br = (b >> 1) * 2;
    const bc = (b & 1) * 2;
    u.push([[0, 0], [0, 1], [1, 0], [1, 1]].map(([dr, dc]) => (br + dr) * 4 + bc + dc));
  }
  return u;
})();

export const PEERS: number[][] = (() => {
  const p = Array.from({ length: 16 }, () => new Set<number>());
  for (const u of UNITS) {
    for (const i of u) {
      for (const j of u) {
        if (i !== j) p[i].add(j);
      }
    }
  }
  return p.map((s) => [...s]);
})();

function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr.slice()];
  const out: number[][] = [];
  arr.forEach((x, i) => {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([x, ...p]);
  });
  return out;
}

/** 128 个格子位置变换：行重排(8) × 列重排(8) × 转置(2)；行重排只在带内换行或整带互换 */
export const CELL_MAPS: number[][] = (() => {
  const perms = permutations([0, 1, 2, 3]).filter(
    (p) => (p[0] >> 1) === (p[1] >> 1) && (p[2] >> 1) === (p[3] >> 1)
  );
  const maps: number[][] = [];
  for (const rp of perms) {
    for (const cp of perms) {
      for (const t of [0, 1]) {
        const m = new Array(16);
        for (let i = 0; i < 16; i++) {
          let nr = rp[i >> 2];
          let nc = cp[i & 3];
          if (t) [nr, nc] = [nc, nr];
          m[i] = nr * 4 + nc;
        }
        maps.push(m);
      }
    }
  }
  return maps;
})();

/** 24 个数字重命名：dp[d-1] 为数字 d 的新名字 */
export const DIGIT_PERMS: number[][] = permutations([1, 2, 3, 4]);

function popcount(x: number): number {
  x -= (x >> 1) & 0x5;
  return (x & 0x3) + ((x >> 2) & 0x3);
}

// ---------------------------------------------------------------- 变换与求解
export function transform(str: string, m: number[], dp: number[]): string {
  const out = new Array(16);
  for (let i = 0; i < 16; i++) {
    const d = str.charCodeAt(i) - 48;
    out[m[i]] = d ? dp[d - 1] : 0;
  }
  return out.join("");
}

export function instantiate(
  cls: { id: number; puzzle: string; solution: string },
  rng: () => number = Math.random
): { classId: number; puzzle: string; solution: string } {
  const m = CELL_MAPS[Math.floor(rng() * CELL_MAPS.length)];
  const dp = DIGIT_PERMS[Math.floor(rng() * DIGIT_PERMS.length)];
  return {
    classId: cls.id,
    puzzle: transform(cls.puzzle, m, dp),
    solution: transform(cls.solution, m, dp),
  };
}

export function stringToGrid(str: string): Grid4x4 {
  const grid: Grid4x4 = [];
  for (let r = 0; r < 4; r++) {
    const row: number[] = [];
    for (let c = 0; c < 4; c++) {
      row.push(Number(str[r * 4 + c]));
    }
    grid.push(row);
  }
  return grid;
}

export function gridToString(grid: Grid4x4): string {
  let str = "";
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      str += grid[r][c];
    }
  }
  return str;
}

/**
 * 回溯求解，最多数到 limit 个解；返回 { count, first }
 */
export function solve(
  puzzle: string | number[],
  limit = 2
): { count: number; first: string | null } {
  const g = Array.from(puzzle, Number);
  let count = 0;
  let first: string | null = null;
  const rec = () => {
    if (count >= limit) return;
    let best = -1;
    let bestMask = 0;
    let bestN = 5;
    for (let i = 0; i < 16; i++) {
      if (g[i]) continue;
      let seen = 0;
      for (const j of PEERS[i]) if (g[j]) seen |= 1 << (g[j] - 1);
      const free = 15 & ~seen;
      const n = popcount(free);
      if (n < bestN) {
        bestN = n;
        best = i;
        bestMask = free;
        if (n === 0) return;
      }
    }
    if (best < 0) {
      count++;
      if (!first) first = g.join("");
      return;
    }
    for (let d = 0; d < 4; d++) {
      if ((bestMask >> d) & 1) {
        g[best] = d + 1;
        rec();
        g[best] = 0;
      }
    }
  };
  rec();
  return { count, first };
}

/**
 * 计算工作量模型
 * mode: 'naked' 只用唯余法；'full' 唯余 + 摒除
 */
export function profile(
  puzzleDigits: number[],
  mode: "naked" | "full" = "naked"
): { widths: number[]; rounds: number; workload: number } {
  const cand = new Array(16).fill(15);
  const placed = new Array(16).fill(false);
  const place = (i: number, d: number) => {
    const bit = 1 << (d - 1);
    if (!(cand[i] & bit)) throw new Error("inconsistent puzzle");
    cand[i] = bit;
    placed[i] = true;
    for (const j of PEERS[i]) cand[j] &= ~bit;
  };
  for (let i = 0; i < 16; i++) {
    if (puzzleDigits[i]) place(i, puzzleDigits[i]);
  }

  let remaining = placed.filter((x) => !x).length;
  const widths: number[] = [];
  let cost = 0;
  while (remaining > 0) {
    const moves = new Map<number, number>();
    for (let i = 0; i < 16; i++) {
      if (!placed[i] && popcount(cand[i]) === 1) {
        moves.set(i, Math.log2(cand[i]) + 1);
      }
    }
    if (mode === "full") {
      for (const u of UNITS) {
        for (let d = 0; d < 4; d++) {
          let cnt = 0;
          let last = -1;
          for (const i of u) {
            if ((cand[i] >> d) & 1) {
              cnt++;
              last = i;
            }
          }
          if (cnt === 1 && !placed[last] && !moves.has(last)) {
            moves.set(last, d + 1);
          }
        }
      }
    }
    if (moves.size === 0) {
      throw new Error("stuck: needs a technique beyond singles");
    }
    const n = moves.size;
    cost += n * (1 + Math.log(remaining / n));
    widths.push(n);
    for (const [i, d] of moves) place(i, d);
    remaining -= n;
  }
  return {
    widths,
    rounds: widths.length,
    workload: Math.round(cost * 1e4) / 1e4,
  };
}

// ---------------------------------------------------------------- 四宫格数独主引擎
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
   * 统计解的数量，用来严格保障唯一解
   */
  static countSolutions(grid: Grid4x4, limit = 2): number {
    return solve(gridToString(grid), limit).count;
  }

  /**
   * 获取题库类别数据
   */
  static getClassesData(): SudokuClassesData {
    return CLASSES_DATA;
  }

  /**
   * 核心出题方法：根据 workloadNaked 划分的 3 档（easy / medium / hard）生成试题
   * 严格保障唯一解，并保留 workloadNaked 与轮数元信息
   */
  static generatePuzzleByTier(
    tier: DifficultyTier,
    id = 1,
    usedClassIds?: Set<number>,
    rng: () => number = Math.random
  ): SudokuPuzzle {
    const pool = CLASSES_DATA[tier] || CLASSES_DATA.medium;
    if (pool.length === 0) {
      throw new Error(`Empty class pool for tier ${tier}`);
    }

    // 优先选择本卷尚未使用的等价类，确保试题多样性
    let chosen: RawClassTuple;
    if (usedClassIds && usedClassIds.size < pool.length) {
      const candidates = pool.filter(([cid]) => !usedClassIds.has(cid));
      chosen =
        candidates.length > 0
          ? candidates[Math.floor(rng() * candidates.length)]
          : pool[Math.floor(rng() * pool.length)];
    } else {
      chosen = pool[Math.floor(rng() * pool.length)];
    }

    const [classId, rawPuzzle, rawSolution, workloadNaked, blanks, roundsNaked] = chosen;
    if (usedClassIds) {
      usedClassIds.add(classId);
    }

    // 在 3072 种对称与数字变换中均匀随机抽取并实例化
    const inst = instantiate(
      { id: classId, puzzle: rawPuzzle, solution: rawSolution },
      rng
    );

    const puzzleGrid = stringToGrid(inst.puzzle);
    const solutionGrid = stringToGrid(inst.solution);
    const cluesCount = 16 - blanks;

    return {
      id,
      targetClues: cluesCount,
      cluesCount,
      puzzle: puzzleGrid,
      solution: solutionGrid,
      difficultyTier: tier,
      workloadNaked,
      roundsNaked,
      classId,
    };
  }

  /**
   * 兼容方法：支持根据难度或目标线索数出题
   */
  static generatePuzzle(
    targetCluesOrTier: number | DifficultyTier = "medium",
    id = 1
  ): SudokuPuzzle {
    let tier: DifficultyTier = "medium";
    if (typeof targetCluesOrTier === "string") {
      tier = targetCluesOrTier;
    } else {
      // 若传入数字，按线索数映射到最贴近的 workload 档位
      if (targetCluesOrTier >= 9) tier = "easy";
      else if (targetCluesOrTier >= 6) tier = "medium";
      else tier = "hard";
    }
    return Sudoku4x4Engine.generatePuzzleByTier(tier, id);
  }

  /**
   * 4x4 数独的 12 个基本单元定义（4行、4列、4宫）
   */
  static getUnits(): [number, number][][] {
    const units: [number, number][][] = [];
    for (let r = 0; r < 4; r++) {
      units.push([[r, 0], [r, 1], [r, 2], [r, 3]]);
    }
    for (let c = 0; c < 4; c++) {
      units.push([[0, c], [1, c], [2, c], [3, c]]);
    }
    for (let b = 0; b < 4; b++) {
      const br = Math.floor(b / 2) * 2;
      const bc = (b % 2) * 2;
      units.push([[br, bc], [br, bc + 1], [br + 1, bc], [br + 1, bc + 1]]);
    }
    return units;
  }

  /**
   * 兼容保留：两格假设特征分析
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

    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const cells = units[uIdx];
      const empty = cells.filter(([r, c]) => puzzle[r][c] === 0);
      if (empty.length === 1) {
        has1HoleUnit = true;
      } else if (empty.length === 2) {
        const [c1, c2] = empty;
        const v1Corr = solution[c1[0]][c1[1]];
        const v2Corr = solution[c2[0]][c2[1]];

        const v1Wrong = v2Corr;
        const v2Wrong = v1Corr;

        const valid1 = Sudoku4x4Engine.isValid(puzzle, c1[0], c1[1], v1Wrong);
        const valid2 = Sudoku4x4Engine.isValid(puzzle, c2[0], c2[1], v2Wrong);

        const isDirect = !valid1 || !valid2;

        if (isDirect) {
          directCount++;
          if (uIdx < 4) rowDirectCount++;
        } else {
          deepCount++;
          if (uIdx < 4) rowDeepCount++;
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
   * 兼容保留：假设专题出题（默认对应适中难度）
   */
  static generateHypothesisPuzzle(
    targetType: "direct" | "deep",
    id = 1
  ): SudokuPuzzle {
    const puzzle = Sudoku4x4Engine.generatePuzzleByTier("medium", id);
    puzzle.hypoType = targetType;
    return puzzle;
  }
}
