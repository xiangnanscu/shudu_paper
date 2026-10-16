CREATE TABLE IF NOT EXISTS exam_records (
  id TEXT PRIMARY KEY,
  client_uuid TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  student_class TEXT DEFAULT '',
  score INTEGER NOT NULL,
  time_spent INTEGER NOT NULL,
  total_puzzles INTEGER NOT NULL,
  correct_puzzles INTEGER NOT NULL,
  total_holes INTEGER NOT NULL,
  correct_holes INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  symbol_type TEXT NOT NULL,
  pages_count INTEGER NOT NULL,
  rows_per_page INTEGER NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_client_created
  ON exam_records (client_uuid, created_at DESC);
