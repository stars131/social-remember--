import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

const dataDir = process.env.DATA_PATH || path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'social_memo.db');
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'avatars'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'photos'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'activities'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'cards'), { recursive: true });
}

let db: Database;

export async function initializeDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 联系人主表（扩展字段）
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      relationship_level TEXT DEFAULT '一般',
      gender TEXT DEFAULT '未知',
      birthday TEXT,
      age INTEGER,
      phone TEXT,
      email TEXT,
      wechat TEXT,
      qq TEXT,
      company TEXT,
      position TEXT,
      address TEXT,
      hometown TEXT,
      tags TEXT,
      notes TEXT,
      avatar TEXT,
      is_favorite INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      group_id INTEGER,
      pinyin TEXT,
      last_contact_date TEXT,
      latitude REAL,
      longitude REAL,
      contact_frequency INTEGER DEFAULT 0,
      importance_score INTEGER DEFAULT 50,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 联系人详情表
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 社交互动记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS social_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      interaction_date TEXT NOT NULL,
      interaction_type TEXT,
      location TEXT,
      notes TEXT,
      follow_up_needed INTEGER DEFAULT 0,
      follow_up_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 重要日期表
  db.run(`
    CREATE TABLE IF NOT EXISTS important_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      date_name TEXT NOT NULL,
      date_value TEXT NOT NULL,
      remind_before_days INTEGER DEFAULT 7,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 联系人分组表
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#1890ff',
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 联系人图库表
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      description TEXT,
      taken_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 活动表
  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      activity_date TEXT NOT NULL,
      location TEXT,
      activity_type TEXT,
      cover_photo TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 活动参与者表
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      role TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 活动照片表
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  // 礼物记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      gift_type TEXT NOT NULL,
      gift_name TEXT NOT NULL,
      gift_date TEXT NOT NULL,
      value REAL,
      occasion TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 系统设置表
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 提醒表
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER,
      reminder_type TEXT NOT NULL,
      title TEXT NOT NULL,
      reminder_date TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // ====== 新增功能表 ======

  // 1. 联系人关系表（用于关系图谱）
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id_1 INTEGER NOT NULL,
      contact_id_2 INTEGER NOT NULL,
      relationship_type TEXT NOT NULL,
      description TEXT,
      strength INTEGER DEFAULT 50,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id_1) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id_2) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 5. 周期性联系提醒表
  db.run(`
    CREATE TABLE IF NOT EXISTS periodic_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      frequency_days INTEGER NOT NULL,
      last_reminded_at TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 6. 节日表
  db.run(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date_type TEXT NOT NULL,
      month INTEGER,
      day INTEGER,
      lunar_month INTEGER,
      lunar_day INTEGER,
      remind_before_days INTEGER DEFAULT 3,
      greeting_template TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. 消息模板表
  db.run(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      variables TEXT,
      is_active INTEGER DEFAULT 1,
      usage_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. 借还记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      loan_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      amount REAL,
      loan_date TEXT NOT NULL,
      due_date TEXT,
      return_date TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 10. 通话/聊天记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS communication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      comm_type TEXT NOT NULL,
      comm_date TEXT NOT NULL,
      duration INTEGER,
      summary TEXT,
      mood TEXT,
      important_points TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 20. 自定义字段定义表
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_field_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_name TEXT NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT NOT NULL,
      options TEXT,
      is_required INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 20. 自定义字段值表
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_field_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      field_id INTEGER NOT NULL,
      field_value TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (field_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
    )
  `);

  // 22. 操作日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      target_name TEXT,
      old_value TEXT,
      new_value TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 确保旧数据库的 contacts 表有新字段
  try {
    db.run('ALTER TABLE contacts ADD COLUMN is_deleted INTEGER DEFAULT 0');
  } catch (e) { /* column might exist */ }
  try {
    db.run('ALTER TABLE contacts ADD COLUMN deleted_at TEXT');
  } catch (e) { /* column might exist */ }
  try {
    db.run('ALTER TABLE contacts ADD COLUMN latitude REAL');
  } catch (e) { /* column might exist */ }
  try {
    db.run('ALTER TABLE contacts ADD COLUMN longitude REAL');
  } catch (e) { /* column might exist */ }
  try {
    db.run('ALTER TABLE contacts ADD COLUMN contact_frequency INTEGER DEFAULT 0');
  } catch (e) { /* column might exist */ }
  try {
    db.run('ALTER TABLE contacts ADD COLUMN importance_score INTEGER DEFAULT 50');
  } catch (e) { /* column might exist */ }
  try {
    db.run('ALTER TABLE contacts ADD COLUMN last_contact_date TEXT');
  } catch (e) { /* column might exist */ }

  // 插入默认节日数据
  const holidayCount = db.exec("SELECT COUNT(*) as count FROM holidays")[0]?.values[0]?.[0] || 0;
  if (holidayCount === 0) {
    db.run(`INSERT INTO holidays (name, date_type, month, day, remind_before_days, greeting_template) VALUES
      ('元旦', 'solar', 1, 1, 3, '新年快乐！愿新的一年万事如意！'),
      ('情人节', 'solar', 2, 14, 3, '情人节快乐！'),
      ('妇女节', 'solar', 3, 8, 3, '妇女节快乐！'),
      ('劳动节', 'solar', 5, 1, 3, '劳动节快乐！'),
      ('儿童节', 'solar', 6, 1, 3, '儿童节快乐！'),
      ('教师节', 'solar', 9, 10, 3, '教师节快乐！感谢您的教导！'),
      ('国庆节', 'solar', 10, 1, 3, '国庆节快乐！'),
      ('圣诞节', 'solar', 12, 25, 3, '圣诞快乐！Merry Christmas!')
    `);
  }

  // 插入默认消息模板
  const templateCount = db.exec("SELECT COUNT(*) as count FROM message_templates")[0]?.values[0]?.[0] || 0;
  if (templateCount === 0) {
    db.run(`INSERT INTO message_templates (name, category, content, variables) VALUES
      ('生日祝福-通用', 'birthday', '亲爱的{name}，生日快乐！愿你的每一天都充满阳光和欢笑！', '["name"]'),
      ('生日祝福-正式', 'birthday', '尊敬的{name}，值此生辰之际，祝您生日快乐，身体健康，事业顺利！', '["name"]'),
      ('新年祝福', 'holiday', '{name}，新年快乐！祝你在新的一年里心想事成，万事如意！', '["name"]'),
      ('中秋祝福', 'holiday', '{name}，中秋快乐！月圆人团圆，祝你阖家幸福！', '["name"]'),
      ('感谢信', 'thanks', '亲爱的{name}，非常感谢你的{reason}！你的帮助对我来说意义重大。', '["name", "reason"]'),
      ('邀请函', 'invitation', '{name}，诚挚邀请你参加{event}，时间：{time}，地点：{location}。期待你的到来！', '["name", "event", "time", "location"]')
    `);
  }

  saveDatabase();
  console.log('Database initialized successfully');
  return db;
}

export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export function getDatabase(): Database {
  return db;
}

export default { initializeDatabase, getDatabase, saveDatabase };
