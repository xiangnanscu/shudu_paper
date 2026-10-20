import type { SudokuPuzzle } from "./sudoku";

export type ExamStatus = "ready" | "doing" | "submitted";

// key: `${puzzleId}_${r}_${c}` -> 1..4
export type UserAnswers = Record<string, number>;

/**
 * 孩子单次填数/擦除的操作步骤流水
 */
export interface AnswerStep {
  step: number;        // 步骤递增序号（1, 2, 3...）
  puzzleId: number;    // 题目 ID
  r: number;           // 宫格行索引（0-3）
  c: number;           // 宫格列索引（0-3）
  val: number;         // 填入的数值（1-4，0 表示清空）
  prevVal: number;     // 填入前的数值（0 表示此前空格为空）
  timeOffset: number;  // 相对开始答题的累计秒数（如 15 表示第 15 秒填入）
  timestamp: number;   // 绝对时间戳
  isCorrect?: boolean; // 该填数是否与终盘答案一致
  solutionVal?: number;// 该格的标准答案
}

export interface ExamDetailData {
  puzzles: SudokuPuzzle[];
  userAnswers: UserAnswers;
  steps?: AnswerStep[];
}

export interface ExamResult {
  score: number;
  timeSpent: number;
  totalPuzzles: number;
  correctPuzzles: number;
  totalHoles: number;
  correctHoles: number;
  wrongHoles: number;
  difficulty: string;
  symbolType: string;
  studentName: string;
  studentClass: string;
  pagesCount: number;
  rowsPerPage: number;
  createdAt: string;
  clientUuid?: string;
  detailJson?: ExamDetailData;
}

export interface ActiveCell {
  puzzleId: number;
  r: number;
  c: number;
  element: HTMLElement;
}
