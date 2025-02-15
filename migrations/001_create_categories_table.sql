-- pgcrypto 拡張機能を有効化（既に有効なら問題ありません）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. category テーブル
CREATE TABLE IF NOT EXISTS categories (
  categoryid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part text NOT NULL,           -- 例: "part1" or "part2-3"
  theme text NOT NULL,          -- 例: "work or school" 等
  period text NOT NULL,         -- 例: "all", "2025 Jan Apr", "2024 Sep Dec"
  created_at timestamp with time zone DEFAULT now()
);