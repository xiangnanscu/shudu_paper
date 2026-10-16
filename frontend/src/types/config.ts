import type { DifficultyMode, SymbolType } from "./sudoku";

export interface PaperConfig {
  pagesCount: number; // 1, 2, 3, 5, 10
  rowsPerPage: number; // 2, 3, 4, 5
  difficulty: DifficultyMode;
  symbolType: SymbolType;
  paperTitle: string;
  paperSubtitle: string;
  studentName: string;
  studentClass: string;
  showName: boolean;
  showClass: boolean;
  showDate: boolean;
  showTime: boolean;
  showScore: boolean;
  appendAnswerPage: boolean;
  showAnswers: boolean;
}
