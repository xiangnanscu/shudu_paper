import type { DifficultyMode, SymbolType, TierDivision } from "./sudoku";

export interface PaperConfig {
  pagesCount: number; // 1, 2, 3, 5, 10
  rowsPerPage: number; // 2, 3, 4, 5
  tierDivision?: TierDivision; // 难度分档制：默认 6 档，支持调整为 3 档、5 档
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
