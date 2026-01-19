-- 学习进度数据库初始化脚本

-- 用户学习进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  current_index INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL DEFAULT 20000,
  today_studied INTEGER NOT NULL DEFAULT 0,
  today_target INTEGER NOT NULL DEFAULT 1000,
  completed_rounds INTEGER NOT NULL DEFAULT 0,
  start_time TEXT NOT NULL DEFAULT (datetime('now')),
  last_study_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 用户收藏单词表
CREATE TABLE IF NOT EXISTS user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  word_id TEXT NOT NULL,
  word TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, word_id)
);

-- 学习历史表（记录每次学习的单词）
CREATE TABLE IF NOT EXISTS study_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  word_id TEXT NOT NULL,
  word TEXT NOT NULL,
  studied_at TEXT NOT NULL DEFAULT (datetime('now')),
  session_round INTEGER NOT NULL DEFAULT 0
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, key)
);

-- 学习统计表（每日统计）
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  study_date TEXT NOT NULL, -- YYYY-MM-DD format
  words_studied INTEGER NOT NULL DEFAULT 0,
  words_reviewed INTEGER NOT NULL DEFAULT 0,
  study_duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, study_date)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_study_history_user_id ON study_history(user_id);
CREATE INDEX IF NOT EXISTS idx_study_history_studied_at ON study_history(studied_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, study_date);

-- 插入默认进度记录
INSERT OR IGNORE INTO user_progress (user_id, current_index, total_words, today_target)
VALUES ('default', 0, 20000, 1000);
