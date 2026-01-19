/**
 * 数据库功能测试脚本
 * 用于测试数据库的各项功能
 */

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'learning_progress.db');

console.log('🧪 开始测试数据库功能...\n');

try {
  const db = new Database(DB_PATH);

  // 测试 1: 更新用户进度
  console.log('📝 测试 1: 更新用户进度');
  const updateProgress = db.prepare(`
    UPDATE user_progress
    SET
      current_index = 50,
      today_studied = 25,
      last_study_time = datetime('now'),
      updated_at = datetime('now')
    WHERE user_id = 'default'
  `);
  const result1 = updateProgress.run();
  console.log(`  ✓ 更新了 ${result1.changes} 条记录`);

  // 测试 2: 查询用户进度
  console.log('\n📝 测试 2: 查询用户进度');
  const getProgress = db.prepare(`
    SELECT * FROM user_progress WHERE user_id = 'default'
  `);
  const progress = getProgress.get();
  console.log(`  ✓ 当前索引: ${progress.current_index}`);
  console.log(`  ✓ 今日学习: ${progress.today_studied}`);
  console.log(`  ✓ 完成轮数: ${progress.completed_rounds}`);

  // 测试 3: 添加收藏
  console.log('\n📝 测试 3: 添加收藏');
  const addFavorite = db.prepare(`
    INSERT OR IGNORE INTO user_favorites (user_id, word_id, word)
    VALUES ('default', 'test_word_1', 'hello')
  `);
  const result2 = addFavorite.run();
  console.log(`  ✓ 添加了 ${result2.changes} 条收藏`);

  // 添加更多收藏
  const addMoreFavorites = db.prepare(`
    INSERT OR IGNORE INTO user_favorites (user_id, word_id, word)
    VALUES ('default', ?, ?)
  `);
  const testWords = [
    ['test_word_2', 'world'],
    ['test_word_3', 'example'],
    ['test_word_4', 'database']
  ];

  testWords.forEach(([id, word]) => {
    addMoreFavorites.run(id, word);
    console.log(`  ✓ 添加收藏: ${word}`);
  });

  // 测试 4: 查询收藏列表
  console.log('\n📝 测试 4: 查询收藏列表');
  const getFavorites = db.prepare(`
    SELECT word_id, word FROM user_favorites
    WHERE user_id = 'default'
    ORDER BY created_at DESC
  `);
  const favorites = getFavorites.all();
  console.log(`  ✓ 收藏列表 (${favorites.length} 个):`);
  favorites.forEach(fav => {
    console.log(`    - ${fav.word} (${fav.word_id})`);
  });

  // 测试 5: 检查是否已收藏
  console.log('\n📝 测试 5: 检查收藏状态');
  const checkFavorite = db.prepare(`
    SELECT COUNT(*) as count FROM user_favorites
    WHERE user_id = 'default' AND word_id = 'test_word_1'
  `);
  const isFav = checkFavorite.get();
  console.log(`  ✓ 'hello' 是否收藏: ${isFav.count > 0 ? '是' : '否'}`);

  // 测试 6: 记录学习历史
  console.log('\n📝 测试 6: 记录学习历史');
  const addHistory = db.prepare(`
    INSERT INTO study_history (user_id, word_id, word, session_round)
    VALUES ('default', ?, ?, ?)
  `);
  const historyWords = [
    ['hist_1', 'learn', 0],
    ['hist_2', 'study', 0],
    ['hist_3', 'practice', 0]
  ];

  historyWords.forEach(([id, word, round]) => {
    addHistory.run(id, word, round);
    console.log(`  ✓ 记录学习: ${word}`);
  });

  // 测试 7: 查询学习历史
  console.log('\n📝 测试 7: 查询学习历史');
  const getHistory = db.prepare(`
    SELECT word_id, word, studied_at, session_round
    FROM study_history
    WHERE user_id = 'default'
    ORDER BY studied_at DESC
    LIMIT 5
  `);
  const history = getHistory.all();
  console.log(`  ✓ 最近学习历史 (${history.length} 条):`);
  history.forEach(h => {
    console.log(`    - ${h.word} (${h.studied_at})`);
  });

  // 测试 8: 保存用户设置
  console.log('\n📝 测试 8: 保存用户设置');
  const saveSetting = db.prepare(`
    INSERT INTO user_settings (user_id, key, value)
    VALUES ('default', ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `);

  const settings = {
    dailyTarget: 100,
    voiceType: 'UK',
    theme: 'dark'
  };

  Object.entries(settings).forEach(([key, value]) => {
    saveSetting.run(key, JSON.stringify(value));
    console.log(`  ✓ 保存设置: ${key} = ${value}`);
  });

  // 测试 9: 查询用户设置
  console.log('\n📝 测试 9: 查询用户设置');
  const getSettings = db.prepare(`
    SELECT key, value FROM user_settings WHERE user_id = 'default'
  `);
  const settingsRows = getSettings.all();
  console.log(`  ✓ 用户设置 (${settingsRows.length} 个):`);
  settingsRows.forEach(row => {
    const value = JSON.parse(row.value);
    console.log(`    - ${row.key}: ${value}`);
  });

  // 测试 10: 更新每日统计
  console.log('\n📝 测试 10: 更新每日统计');
  const today = new Date().toISOString().split('T')[0];
  const updateStats = db.prepare(`
    INSERT INTO daily_stats (user_id, study_date, words_studied, words_reviewed)
    VALUES ('default', ?, ?, ?)
    ON CONFLICT(user_id, study_date) DO UPDATE SET
      words_studied = words_studied + excluded.words_studied,
      words_reviewed = words_reviewed + excluded.words_reviewed,
      updated_at = datetime('now')
  `);
  updateStats.run(today, 10, 5);
  console.log(`  ✓ 更新今日统计: ${today}`);

  // 测试 11: 查询每日统计
  console.log('\n📝 测试 11: 查询每日统计');
  const getStats = db.prepare(`
    SELECT study_date, words_studied, words_reviewed
    FROM daily_stats
    WHERE user_id = 'default'
    ORDER BY study_date DESC
    LIMIT 5
  `);
  const stats = getStats.all();
  console.log(`  ✓ 每日统计 (${stats.length} 条):`);
  stats.forEach(s => {
    console.log(`    - ${s.study_date}: 学习 ${s.words_studied} 词, 复习 ${s.words_reviewed} 词`);
  });

  // 测试 12: 数据库统计
  console.log('\n📝 测试 12: 数据库统计');
  const tables = ['user_progress', 'user_favorites', 'study_history', 'user_settings', 'daily_stats'];
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`  ✓ ${table}: ${count.count} 条记录`);
  });

  db.close();

  console.log('\n✅ 所有测试通过!');
  console.log('\n📊 数据库测试摘要:');
  console.log(`  ✓ 进度记录: current_index = ${progress.current_index}`);
  console.log(`  ✓ 收藏数量: ${favorites.length}`);
  console.log(`  ✓ 学习历史: ${history.length} 条`);
  console.log(`  ✓ 用户设置: ${settingsRows.length} 项`);
  console.log(`  ✓ 每日统计: ${stats.length} 天`);
  console.log('\n数据库功能正常，可以开始使用!\n');

} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
