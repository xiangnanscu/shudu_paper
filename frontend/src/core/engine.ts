import type { Grid4x4, SudokuPuzzle } from "../types/sudoku";
import rawClassesCsv from "./sudoku-classes.csv?raw";

export interface SudokuClassRecord {
  puzzle: string;
  solution: string;
  workloadNaked: number;
}

/**
 * 解析按 workloadNaked 升序排好序的原始 CSV 表格数据
 * 列：puzzle,solution,workloadNaked
 */
function parseClassesCsv(csv: string): SudokuClassRecord[] {
  const lines = csv.trim().split(/\r?\n/);
  const records: SudokuClassRecord[] = [];
  // 跳过第 0 行表头
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length >= 3) {
      records.push({
        puzzle: parts[0],
        solution: parts[1],
        workloadNaked: parseFloat(parts[2]),
      });
    }
  }
  return records;
}

export const SUDOKU_CLASSES: SudokuClassRecord[] = parseClassesCsv(rawClassesCsv);

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
  cls: { puzzle: string; solution: string },
  rng: () => number = Math.random
): { puzzle: string; solution: string } {
  const m = CELL_MAPS[Math.floor(rng() * CELL_MAPS.length)];
  const dp = DIGIT_PERMS[Math.floor(rng() * DIGIT_PERMS.length)];
  return {
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

// ---------------------------------------------------------------- 动态分档切片算法
/**
 * 根据当前分档制（totalTiers）与指定档位（tierIndex: 0 到 totalTiers - 1），
 * 计算对应的类库索引区间 [startIndex, endIndex)
 */
export function getTierSlice(
  tierIndex: number,
  totalTiers: number
): { start: number; end: number; count: number } {
  const total = SUDOKU_CLASSES.length;
  const clampedTotal = Math.max(1, totalTiers);
  const clampedIndex = Math.max(0, Math.min(clampedTotal - 1, tierIndex));
  const start = Math.floor((clampedIndex * total) / clampedTotal);
  const end = Math.floor(((clampedIndex + 1) * total) / clampedTotal);
  return { start, end, count: end - start };
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
   * 获取按 workloadNaked 升序排列的全部类库数据
   */
  static getAllClasses(): SudokuClassRecord[] {
    return SUDOKU_CLASSES;
  }

  /**
   * 核心出题方法：根据动态难度档位生成试题
   *
   * @param tierIndex 当前档位索引 (0 到 totalTiers - 1)
   * @param totalTiers 总档位数 (默认 6，可调整为 3、5 档等)
   * @param tierName 档位名称（如 "简单", "适中", "4级", "6级" 等）
   * @param id 题目编号
   * @param usedIndices 本试卷已使用的题目索引集合，避免试卷内拓扑重复
   * @param rng 随机数生成器
   */
  static generatePuzzleByDynamicTier(
    tierIndex: number,
    totalTiers = 6,
    tierName = "",
    id = 1,
    usedIndices?: Set<number>,
    rng: () => number = Math.random
  ): SudokuPuzzle {
    const { start, end } = getTierSlice(tierIndex, totalTiers);

    // 候选索引列表：优先选本套卷子尚未用过的等价类
    let chosenIdx: number;
    const candidates: number[] = [];
    if (usedIndices) {
      for (let i = start; i < end; i++) {
        if (!usedIndices.has(i)) candidates.push(i);
      }
    }

    if (candidates.length > 0) {
      chosenIdx = candidates[Math.floor(rng() * candidates.length)];
    } else {
      chosenIdx = start + Math.floor(rng() * (end - start));
    }

    if (usedIndices) {
      usedIndices.add(chosenIdx);
    }

    const cls = SUDOKU_CLASSES[chosenIdx];
    // 随机施加 3072 种对称与置换变换
    const inst = instantiate(cls, rng);

    // 计算实际已知数（线索数）
    let cluesCount = 0;
    for (let i = 0; i < 16; i++) {
      if (inst.puzzle[i] !== "0") cluesCount++;
    }

    const puzzleGrid = stringToGrid(inst.puzzle);
    const solutionGrid = stringToGrid(inst.solution);

    return {
      id,
      targetClues: cluesCount,
      cluesCount,
      puzzle: puzzleGrid,
      solution: solutionGrid,
      workloadNaked: cls.workloadNaked,
      tierIndex,
      totalTiers,
      tierName,
    };
  }

  /**
   * 兼容方法：快速生成试题
   */
  static generatePuzzle(
    targetCluesOrTier: number | string = "medium",
    id = 1
  ): SudokuPuzzle {
    let tierIndex = 1;
    const totalTiers = 3;
    if (typeof targetCluesOrTier === "number") {
      if (targetCluesOrTier >= 9) tierIndex = 0;
      else if (targetCluesOrTier >= 6) tierIndex = 1;
      else tierIndex = 2;
    } else if (targetCluesOrTier === "easy") {
      tierIndex = 0;
    } else if (targetCluesOrTier === "hard") {
      tierIndex = 2;
    } else {
      tierIndex = 1;
    }
    return Sudoku4x4Engine.generatePuzzleByDynamicTier(
      tierIndex,
      totalTiers,
      tierIndex === 0 ? "简单" : tierIndex === 1 ? "适中" : "困难",
      id
    );
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
   * 兼容保留：假设专题出题
   */
  static generateHypothesisPuzzle(
    targetType: "direct" | "deep",
    id = 1
  ): SudokuPuzzle {
    const puzzle = Sudoku4x4Engine.generatePuzzleByDynamicTier(1, 3, "适中", id);
    puzzle.hypoType = targetType;
    return puzzle;
  }
}
