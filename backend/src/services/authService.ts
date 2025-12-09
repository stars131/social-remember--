import crypto from 'crypto';
import { getDatabase, saveDatabase } from '../config/database';

// 默认管理员账号
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'social2024';

// Token 有效期 (7天)
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// 存储活跃的 tokens
const activeTokens = new Map<string, { username: string; expiry: number }>();

// 生成安全的密码哈希
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, useSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: useSalt };
}

// 验证密码
function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

// 生成 token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 初始化管理员账号
function initAdmin() {
  const db = getDatabase();

  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();

  // 检查是否已有管理员
  const stmt = db.prepare('SELECT id FROM users WHERE username = ?');
  stmt.bind([DEFAULT_USERNAME]);
  const hasAdmin = stmt.step();
  stmt.free();

  if (!hasAdmin) {
    // 创建默认管理员
    const { hash, salt } = hashPassword(DEFAULT_PASSWORD);
    const insertStmt = db.prepare('INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)');
    insertStmt.bind([DEFAULT_USERNAME, hash, salt]);
    insertStmt.step();
    insertStmt.free();
    saveDatabase();
    console.log('Default admin account created');
  }
}

export const authService = {
  // 初始化
  init() {
    initAdmin();
  },

  // 登录
  login(username: string, password: string): { success: boolean; token?: string; message?: string } {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
    stmt.bind([username]);

    if (!stmt.step()) {
      stmt.free();
      return { success: false, message: '用户名或密码错误' };
    }

    const user = stmt.getAsObject();
    stmt.free();

    if (!verifyPassword(password, user.password_hash as string, user.password_salt as string)) {
      return { success: false, message: '用户名或密码错误' };
    }

    // 生成 token
    const token = generateToken();
    const expiry = Date.now() + TOKEN_EXPIRY;

    activeTokens.set(token, { username, expiry });

    // 更新最后登录时间
    const updateStmt = db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?');
    updateStmt.bind([user.id as number]);
    updateStmt.step();
    updateStmt.free();
    saveDatabase();

    return { success: true, token };
  },

  // 验证 token
  verifyToken(token: string): { valid: boolean; username?: string } {
    const tokenData = activeTokens.get(token);

    if (!tokenData) {
      return { valid: false };
    }

    if (Date.now() > tokenData.expiry) {
      activeTokens.delete(token);
      return { valid: false };
    }

    return { valid: true, username: tokenData.username };
  },

  // 登出
  logout(token: string): boolean {
    return activeTokens.delete(token);
  },

  // 修改密码
  changePassword(username: string, oldPassword: string, newPassword: string): { success: boolean; message?: string } {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([username]);

    if (!stmt.step()) {
      stmt.free();
      return { success: false, message: '用户不存在' };
    }

    const user = stmt.getAsObject();
    stmt.free();

    if (!verifyPassword(oldPassword, user.password_hash as string, user.password_salt as string)) {
      return { success: false, message: '原密码错误' };
    }

    // 生成新密码哈希
    const { hash, salt } = hashPassword(newPassword);

    const updateStmt = db.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime("now") WHERE id = ?');
    updateStmt.bind([hash, salt, user.id as number]);
    updateStmt.step();
    updateStmt.free();
    saveDatabase();

    // 清除该用户的所有 token
    activeTokens.forEach((value, key) => {
      if (value.username === username) {
        activeTokens.delete(key);
      }
    });

    return { success: true };
  },

  // 检查认证状态
  checkAuth(token: string): { authenticated: boolean; username?: string } {
    const result = this.verifyToken(token);
    return { authenticated: result.valid, username: result.username };
  }
};

// 认证中间件
export function authMiddleware(req: any, res: any, next: any) {
  // 允许的公开路径（无需认证）- 相对于 /api 的路径
  const publicPaths = [
    '/auth/login',
    '/auth/check'
  ];

  // 检查是否是公开路径
  if (publicPaths.some(path => req.path === path || req.path.startsWith(path))) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问，请先登录' });
  }

  const token = authHeader.substring(7);
  const { valid, username } = authService.verifyToken(token);

  if (!valid) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }

  req.user = { username };
  next();
}

export default authService;
