/**
 * 数据库初始化脚本
 * 用于创建和初始化 SQLite 数据库
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'learning_progress.db');

console.log('🚀 开始初始化数据库...\n');

try {
  // 检查数据库是否已存在
  const fs = await import('fs');
  if (fs.existsSync(DB_PATH)) {
    console.log(`⚠️  数据库文件已存在: ${DB_PATH}`);
    console.log('如需重新初始化，请先删除现有数据库文件\n');
    process.exit(0);
  }

  console.log('📦 创建数据库...');
  const db = new Database(DB_PATH);

  // 启用 WAL 模式
  db.pragma('journal_mode = WAL');
  console.log('✓ WAL 模式已启用');

  // 启用外键约束
  db.pragma('foreign_keys = ON');
  console.log('✓ 外键约束已启用');

  // 读取并执行初始化 SQL
  console.log('\n📋 创建数据库表结构...');
  const initSQL = readFileSync(join(__dirname, 'init.sql'), 'utf-8');
  db.exec(initSQL);
  console.log('✓ 数据库表结构创建完成');

  // 显示创建的表
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND name NOT LIKE 'sqlite_%'
  `).all();

  console.log('\n📊 已创建的表:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);

    // 显示每张表的记录数
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`    记录数: ${count.count}`);
  });

  // 显示创建的索引
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='index'
    AND name LIKE 'idx_%'
  `).all();

  console.log('\n📇 已创建的索引:');
  indexes.forEach(index => {
    console.log(`  - ${index.name}`);
  });

  db.close();
  console.log('\n✅ 数据库初始化完成!');
  console.log(`\n数据库位置: ${DB_PATH}`);
  console.log('\n下一步:');
  console.log('  1. 运行 npm install 安装依赖');
  console.log('  2. 在应用中使用 @/utils/databaseStorage 模块');
  console.log('  3. 使用 npm run db:backup 备份数据库\n');

} catch (error) {
  console.error('\n❌ 数据库初始化失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
