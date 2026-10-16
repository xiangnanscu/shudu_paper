import type { SudokuPuzzle } from "./sudoku";

export type ExamStatus = "ready" | "doing" | "submitted";

// key: `${puzzleId}_${r}_${c}` -> 1..4
export type UserAnswers = Record<string, number>;

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
  detailJson?: {
    puzzles: SudokuPuzzle[];
    userAnswers: UserAnswers;
  };
}

export interface ActiveCell {
  puzzleId: number;
  r: number;
  c: number;
  element: HTMLElement;
}
