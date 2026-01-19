/**
 * SQLite 数据库管理器
 * 用于持久化存储学习进度、收藏、设置等数据
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径
const DB_PATH = join(__dirname, 'learning_progress.db');

/**
 * 数据库类
 */
class DatabaseManager {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * 初始化数据库连接
   */
  connect() {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // 启用 WAL 模式以提高并发性能
      this.db.pragma('foreign_keys = ON'); // 启用外键约束
      console.log(`✓ 数据库连接成功: ${this.dbPath}`);
      return this;
    } catch (error) {
      console.error('✗ 数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 初始化数据库表结构
   */
  initSchema() {
    try {
      const initSQL = readFileSync(join(__dirname, 'init.sql'), 'utf-8');
      this.db.exec(initSQL);
      console.log('✓ 数据库表结构初始化完成');
      return this;
    } catch (error) {
      console.error('✗ 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✓ 数据库连接已关闭');
    }
  }

  /**
   * 获取用户进度
   */
  getUserProgress(userId = 'default') {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM user_progress
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `);
      const progress = stmt.get(userId);
      return progress || null;
    } catch (error) {
      console.error('获取用户进度失败:', error);
      return null;
    }
  }

  /**
   * 更新用户进度
   */
  updateUserProgress(userId, progressData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE user_progress
        SET
          current_index = ?,
          total_words = ?,
          today_studied = ?,
          today_target = ?,
          completed_rounds = ?,
          last_study_time = datetime('now'),
          updated_at = datetime('now')
        WHERE user_id = ?
      `);

      const result = stmt.run(
        progressData.current_index,
        progressData.total_words,
        progressData.today_studied,
        progressData.today_target,
        progressData.completed_rounds,
        userId
      );

      if (result.changes === 0) {
        this.insertUserProgress(userId, progressData);
      }

      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('更新用户进度失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 插入用户进度
   */
  insertUserProgress(userId, progressData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO user_progress (
          user_id, current_index, total_words, today_studied,
          today_target, completed_rounds
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        userId,
        progressData.current_index,
        progressData.total_words,
        progressData.today_studied,
        progressData.today_target,
        progressData.completed_rounds
      );

      return { success: true, lastInsertRowid: result.lastInsertRowid };
    } catch (error) {
      console.error('插入用户进度失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 重置用户进度
   */
  resetUserProgress(userId = 'default') {
    try {
      const stmt = this.db.prepare(`
        UPDATE user_progress
        SET
          current_index = 0,
          today_studied = 0,
          completed_rounds = 0,
          start_time = datetime('now'),
          last_study_time = NULL,
          updated_at = datetime('now')
        WHERE user_id = ?
      `);

      const result = stmt.run(userId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('重置用户进度失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户收藏列表
   */
  getUserFavorites(userId = 'default') {
    try {
      const stmt = this.db.prepare(`
        SELECT word_id, word, created_at
        FROM user_favorites
        WHERE user_id = ?
        ORDER BY created_at DESC
      `);
      const favorites = stmt.all(userId);
      return favorites.map(f => f.word_id);
    } catch (error) {
      console.error('获取用户收藏失败:', error);
      return [];
    }
  }

  /**
   * 添加收藏
   */
  addFavorite(userId, wordId, word) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO user_favorites (user_id, word_id, word)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(userId, wordId, word);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('添加收藏失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 移除收藏
   */
  removeFavorite(userId, wordId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM user_favorites
        WHERE user_id = ? AND word_id = ?
      `);
      const result = stmt.run(userId, wordId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('移除收藏失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查是否已收藏
   */
  isFavorite(userId, wordId) {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM user_favorites
        WHERE user_id = ? AND word_id = ?
      `);
      const result = stmt.get(userId, wordId);
      return result.count > 0;
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  }

  /**
   * 记录学习历史
   */
  addStudyHistory(userId, wordId, word, sessionRound) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO study_history (user_id, word_id, word, session_round)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(userId, wordId, word, sessionRound);
      return { success: true, lastInsertRowid: result.lastInsertRowid };
    } catch (error) {
      console.error('记录学习历史失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取学习历史
   */
  getStudyHistory(userId, limit = 100) {
    try {
      const stmt = this.db.prepare(`
        SELECT word_id, word, studied_at, session_round
        FROM study_history
        WHERE user_id = ?
        ORDER BY studied_at DESC
        LIMIT ?
      `);
      const history = stmt.all(userId, limit);
      return history;
    } catch (error) {
      console.error('获取学习历史失败:', error);
      return [];
    }
  }

  /**
   * 获取用户设置
   */
  getUserSettings(userId = 'default') {
    try {
      const stmt = this.db.prepare(`
        SELECT key, value FROM user_settings WHERE user_id = ?
      `);
      const rows = stmt.all(userId);

      // 将数组转换为对象
      const settings = {};
      rows.forEach(row => {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      });

      return settings;
    } catch (error) {
      console.error('获取用户设置失败:', error);
      return {};
    }
  }

  /**
   * 保存用户设置
   */
  saveUserSetting(userId, key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO user_settings (user_id, key, value)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `);
      const result = stmt.run(userId, key, JSON.stringify(value));
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('保存用户设置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 批量保存用户设置
   */
  saveUserSettings(userId, settings) {
    const transaction = this.db.transaction((userId, settings) => {
      for (const [key, value] of Object.entries(settings)) {
        const result = this.saveUserSetting(userId, key, value);
        if (!result.success) {
          throw new Error(`保存设置 ${key} 失败`);
        }
      }
    });

    try {
      transaction(userId, settings);
      return { success: true };
    } catch (error) {
      console.error('批量保存用户设置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新每日统计
   */
  updateDailyStats(userId, studyDate, statsData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO daily_stats (
          user_id, study_date, words_studied, words_reviewed, study_duration_seconds
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, study_date) DO UPDATE SET
          words_studied = words_studied + excluded.words_studied,
          words_reviewed = words_reviewed + excluded.words_reviewed,
          study_duration_seconds = study_duration_seconds + excluded.study_duration_seconds,
          updated_at = datetime('now')
      `);
      const result = stmt.run(
        userId,
        studyDate,
        statsData.wordsStudied || 0,
        statsData.wordsReviewed || 0,
        statsData.studyDuration || 0
      );
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('更新每日统计失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取每日统计
   */
  getDailyStats(userId, days = 30) {
    try {
      const stmt = this.db.prepare(`
        SELECT study_date, words_studied, words_reviewed, study_duration_seconds
        FROM daily_stats
        WHERE user_id = ?
          AND study_date >= date('now', '-' || ? || ' days')
        ORDER BY study_date DESC
      `);
      const stats = stmt.all(userId, days);
      return stats;
    } catch (error) {
      console.error('获取每日统计失败:', error);
      return [];
    }
  }

  /**
   * 重置今日学习数量（新的一天）
   */
  resetTodayStudied(userId = 'default') {
    try {
      const stmt = this.db.prepare(`
        UPDATE user_progress
        SET today_studied = 0, updated_at = datetime('now')
        WHERE user_id = ?
      `);
      const result = stmt.run(userId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('重置今日学习数量失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出所有数据
   */
  exportAllData(userId = 'default') {
    try {
      const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId,
        progress: this.getUserProgress(userId),
        favorites: this.getUserFavorites(userId),
        settings: this.getUserSettings(userId),
        studyHistory: this.getStudyHistory(userId, 1000),
        dailyStats: this.getDailyStats(userId, 365)
      };
      return { success: true, data };
    } catch (error) {
      console.error('导出数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查并创建数据库
   */
  static initialize() {
    const db = new DatabaseManager();
    db.connect().initSchema();
    return db;
  }
}

// 创建并导出数据库实例
let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = DatabaseManager.initialize();
  }
  return dbInstance;
}

export default DatabaseManager;
