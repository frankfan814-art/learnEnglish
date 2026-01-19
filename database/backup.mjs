/**
 * 数据库备份脚本
 * 用于备份 SQLite 数据库到 JSON 文件
 */

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'learning_progress.db');
const BACKUP_DIR = join(__dirname, 'backups');

console.log('🗄️  开始备份数据库...\n');

try {
  // 创建备份目录
  const fs = await import('fs');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('✓ 备份目录已创建');
  }

  // 检查数据库是否存在
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`数据库文件不存在: ${DB_PATH}`);
  }

  console.log('📦 连接数据库...');
  const db = new Database(DB_PATH, { readonly: true });

  // 生成备份文件名（带时间戳）
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFileName = `backup_${timestamp}.json`;
  const backupFilePath = join(BACKUP_DIR, backupFileName);

  console.log('📋 导出数据...');
  const backupData = {
    version: '1.0.0',
    backupDate: new Date().toISOString(),
    database: DB_PATH,
    tables: {}
  };

  // 获取所有表名
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND name NOT LIKE 'sqlite_%'
  `).all();

  // 导出每张表的数据
  tables.forEach(table => {
    console.log(`  - 导出表: ${table.name}`);
    const rows = db.prepare(`SELECT * FROM ${table.name}`).all();
    backupData.tables[table.name] = rows;
    console.log(`    ✓ ${rows.length} 条记录`);
  });

  // 保存备份文件
  console.log('\n💾 保存备份文件...');
  writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

  db.close();

  console.log('\n✅ 数据库备份完成!');
  console.log(`\n备份文件: ${backupFilePath}`);
  console.log(`文件大小: ${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB`);

  // 显示备份目录中的所有备份文件
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.json'))
    .sort()
    .reverse();

  console.log(`\n📁 备份目录中的文件 (${backupFiles.length}):`);
  backupFiles.slice(0, 5).forEach((file, index) => {
    const filePath = join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`  ${index + 1}. ${file} (${size} KB)`);
  });

  if (backupFiles.length > 5) {
    console.log(`  ... 还有 ${backupFiles.length - 5} 个文件`);
  }

  console.log('\n提示:');
  console.log('  - 定期备份数据库以防止数据丢失');
  console.log('  - 可以使用此备份文件恢复数据');
  console.log('  - 建议在每次重要更新前备份\n');

} catch (error) {
  console.error('\n❌ 数据库备份失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
