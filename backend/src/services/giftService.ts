import { getDatabase, saveDatabase } from '../config/database';

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

export interface Gift {
  id?: number;
  contact_id: number;
  gift_type: 'sent' | 'received';
  gift_name: string;
  gift_date: string;
  value?: number;
  occasion?: string;
  notes?: string;
  created_at?: string;
  contact_name?: string;
}

export class GiftService {
  // 获取联系人的礼物记录
  getContactGifts(contactId: number): Gift[] {
    return queryAll(
      'SELECT * FROM gifts WHERE contact_id = ? ORDER BY gift_date DESC',
      [contactId]
    );
  }

  // 获取所有礼物记录
  getAllGifts(params: { page?: number; limit?: number; type?: string } = {}) {
    const { page = 1, limit = 20, type } = params;
    const offset = (page - 1) * limit;

    let query = `
      SELECT g.*, c.name as contact_name FROM gifts g
      LEFT JOIN contacts c ON g.contact_id = c.id WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM gifts WHERE 1=1';
    const queryParams: any[] = [];

    if (type) {
      query += ' AND g.gift_type = ?';
      countQuery += ' AND gift_type = ?';
      queryParams.push(type);
    }

    const countResult = queryOne(countQuery, queryParams);
    const total = countResult?.total || 0;

    query += ' ORDER BY g.gift_date DESC LIMIT ? OFFSET ?';
    const gifts = queryAll(query, [...queryParams, limit, offset]);

    return {
      data: gifts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  // 添加礼物记录
  addGift(gift: Gift): Gift {
    const lastId = runSql(`
      INSERT INTO gifts (contact_id, gift_type, gift_name, gift_date, value, occasion, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [gift.contact_id, gift.gift_type, gift.gift_name, gift.gift_date,
        gift.value || null, gift.occasion || null, gift.notes || null]);

    return queryOne('SELECT * FROM gifts WHERE id = ?', [lastId]);
  }

  // 更新礼物记录
  updateGift(id: number, gift: Partial<Gift>): Gift | null {
    const existing = queryOne('SELECT * FROM gifts WHERE id = ?', [id]);
    if (!existing) return null;

    const updated = { ...existing, ...gift };
    execSql(`
      UPDATE gifts SET gift_type = ?, gift_name = ?, gift_date = ?,
      value = ?, occasion = ?, notes = ? WHERE id = ?
    `, [updated.gift_type, updated.gift_name, updated.gift_date,
        updated.value, updated.occasion, updated.notes, id]);

    return queryOne('SELECT * FROM gifts WHERE id = ?', [id]);
  }

  // 删除礼物记录
  deleteGift(id: number): boolean {
    execSql('DELETE FROM gifts WHERE id = ?', [id]);
    return true;
  }

  // 获取礼物统计
  getGiftStats() {
    const sentCount = queryOne('SELECT COUNT(*) as count, SUM(value) as total FROM gifts WHERE gift_type = ?', ['sent']);
    const receivedCount = queryOne('SELECT COUNT(*) as count, SUM(value) as total FROM gifts WHERE gift_type = ?', ['received']);
    const recentGifts = queryAll(`
      SELECT g.*, c.name as contact_name FROM gifts g
      LEFT JOIN contacts c ON g.contact_id = c.id
      ORDER BY g.gift_date DESC LIMIT 5
    `);

    return {
      sent: { count: sentCount?.count || 0, total: sentCount?.total || 0 },
      received: { count: receivedCount?.count || 0, total: receivedCount?.total || 0 },
      recentGifts
    };
  }
}

export const giftService = new GiftService();
