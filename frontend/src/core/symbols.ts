import type { SymbolType } from "../types/sudoku";

/**
 * 符号映射字典
 */
export const SYMBOL_SETS: Record<SymbolType, Record<number, string>> = {
  numbers: { 1: "1", 2: "2", 3: "3", 4: "4" },
  letters: { 1: "A", 2: "B", 3: "C", 4: "D" },
  shapes: { 1: "●", 2: "▲", 3: "■", 4: "★" },
  fruits: { 1: "🍎", 2: "🍌", 3: "🍇", 4: "🍓" },
  animals: { 1: "🐱", 2: "🐶", 3: "🐰", 4: "🐼" },
};
