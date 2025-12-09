import { getDatabase, saveDatabase } from '../config/database';
import bcrypt from 'bcryptjs';

function queryAll(sql: string, params: any[] = []): any[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any | undefined {
  return queryAll(sql, params)[0];
}

function runSql(sql: string, params: any[] = []): number {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
  return queryOne('SELECT last_insert_rowid() as id')?.id || 0;
}

function execSql(sql: string, params: any[] = []): void {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export class SettingsService {
  // 获取设置
  getSetting(key: string): string | null {
    const result = queryOne('SELECT value FROM settings WHERE key = ?', [key]);
    return result?.value || null;
  }

  // 设置值
  setSetting(key: string, value: string): void {
    const existing = queryOne('SELECT id FROM settings WHERE key = ?', [key]);
    if (existing) {
      execSql('UPDATE settings SET value = ?, updated_at = datetime(\'now\') WHERE key = ?',
              [value, key]);
    } else {
      runSql('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))',
             [key, value]);
    }
  }

  // 获取所有设置
  getAllSettings(): Record<string, string> {
    const settings = queryAll('SELECT key, value FROM settings');
    const result: Record<string, string> = {};
    settings.forEach(s => { result[s.key] = s.value; });
    return result;
  }

  // 设置密码
  setPassword(password: string): void {
    const hashedPassword = bcrypt.hashSync(password, 10);
    this.setSetting('password', hashedPassword);
    this.setSetting('password_enabled', 'true');
  }

  // 验证密码
  verifyPassword(password: string): boolean {
    const enabled = this.getSetting('password_enabled');
    if (enabled !== 'true') return true;

    const hashedPassword = this.getSetting('password');
    if (!hashedPassword) return true;

    return bcrypt.compareSync(password, hashedPassword);
  }

  // 禁用密码
  disablePassword(): void {
    this.setSetting('password_enabled', 'false');
  }

  // 检查是否启用密码
  isPasswordEnabled(): boolean {
    return this.getSetting('password_enabled') === 'true';
  }

  // 获取主题设置
  getTheme(): string {
    return this.getSetting('theme') || 'light';
  }

  // 设置主题
  setTheme(theme: string): void {
    this.setSetting('theme', theme);
  }
}

export const settingsService = new SettingsService();
