import { ref, computed } from "vue";
import type { SudokuPuzzle } from "../types/sudoku";
import type { PaperConfig } from "../types/config";
import { Sudoku4x4Engine } from "../core/engine";
import { getDifficultyClues } from "../core/difficulty";
import { SYMBOL_SETS } from "../core/symbols";

export function useSudoku(config: PaperConfig) {
  // 试卷数据：按页面切片 [pageIndex][itemIndex]
  const puzzlesData = ref<SudokuPuzzle[][]>([]);

  // 扁平化所有题目
  const flatPuzzles = computed<SudokuPuzzle[]>(() =>
    puzzlesData.value.flat()
  );

  // 每页尺寸与字号自适应
  const boardSize = computed(() => {
    switch (config.rowsPerPage) {
      case 2:
        return "198px";
      case 3:
        return "172px";
      case 4:
        return "146px";
      case 5:
        return "122px";
      default:
        return "146px";
    }
  });

  const cellFontSize = computed(() => {
    switch (config.rowsPerPage) {
      case 2:
        return "28px";
      case 3:
        return "24px";
      case 4:
        return "21px";
      case 5:
        return "17px";
      default:
        return "21px";
    }
  });

  // 当前符号映射字典
  const currentSymbolMap = computed(() => {
    return SYMBOL_SETS[config.symbolType] || SYMBOL_SETS.numbers;
  });

  // 全卷总空位数
  const totalHoles = computed(() => {
    let count = 0;
    for (const p of flatPuzzles.value) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (p.puzzle[r][c] === 0) {
            count++;
          }
        }
      }
    }
    return count;
  });

  // 生成全套试题
  function generateAll(): SudokuPuzzle[][] {
    const pages: SudokuPuzzle[][] = [];
    const itemsPerPage = config.rowsPerPage * 3;
    let currentId = 1;

    for (let p = 0; p < config.pagesCount; p++) {
      const pageList: SudokuPuzzle[] = [];
      for (let i = 0; i < itemsPerPage; i++) {
        const targetClues = getDifficultyClues(
          config.difficulty,
          i,
          itemsPerPage
        );
        const puzzleObj = Sudoku4x4Engine.generatePuzzle(targetClues, currentId++);
        pageList.push(puzzleObj);
      }
      pages.push(pageList);
    }

    puzzlesData.value = pages;
    return pages;
  }

  return {
    puzzlesData,
    flatPuzzles,
    boardSize,
    cellFontSize,
    currentSymbolMap,
    totalHoles,
    generateAll,
  };
}
