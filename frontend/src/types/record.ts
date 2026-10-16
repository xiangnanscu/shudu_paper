export interface ExamRecordEntity {
  id: string;
  client_uuid?: string;
  clientUuid?: string;
  student_name?: string;
  studentName?: string;
  student_class?: string;
  studentClass?: string;
  score: number;
  time_spent?: number;
  timeSpent?: number;
  total_puzzles?: number;
  totalPuzzles?: number;
  correct_puzzles?: number;
  correctPuzzles?: number;
  total_holes?: number;
  totalHoles?: number;
  correct_holes?: number;
  correctHoles?: number;
  difficulty: string;
  symbol_type?: string;
  symbolType?: string;
  pages_count?: number;
  pagesCount?: number;
  rows_per_page?: number;
  rowsPerPage?: number;
  detail_json?: string;
  created_at?: string;
  createdAt?: string;
}

export interface ExamStats {
  totalRecords: number;
  maxScore: number;
  avgScore: number;
  totalTimeSpent: number;
}
