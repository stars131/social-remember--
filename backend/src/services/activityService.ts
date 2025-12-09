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
  const results = queryAll(sql, params);
  return results[0];
}

function runSql(sql: string, params: any[] = []): number {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  return lastId?.id || 0;
}

function execSql(sql: string, params: any[] = []): void {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
}

export interface Activity {
  id?: number;
  title: string;
  description?: string;
  activity_date: string;
  location?: string;
  activity_type?: string;
  cover_photo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityParticipant {
  id?: number;
  activity_id: number;
  contact_id: number;
  role?: string;
  notes?: string;
  contact_name?: string;
  contact_avatar?: string;
}

export interface ActivityPhoto {
  id?: number;
  activity_id: number;
  filename: string;
  original_name?: string;
  description?: string;
  created_at?: string;
}

export class ActivityService {
  // 获取所有活动
  getAllActivities(params: { page?: number; limit?: number; search?: string; type?: string } = {}) {
    const { page = 1, limit = 20, search, type } = params;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM activities WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM activities WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
      countQuery += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      query += ' AND activity_type = ?';
      countQuery += ' AND activity_type = ?';
      queryParams.push(type);
    }

    const countResult = queryOne(countQuery, queryParams);
    const total = countResult?.total || 0;

    query += ' ORDER BY activity_date DESC LIMIT ? OFFSET ?';
    const activities = queryAll(query, [...queryParams, limit, offset]);

    // 获取每个活动的参与者数量
    const activitiesWithCount = activities.map(activity => {
      const participantCount = queryOne(
        'SELECT COUNT(*) as count FROM activity_participants WHERE activity_id = ?',
        [activity.id]
      );
      return { ...activity, participant_count: participantCount?.count || 0 };
    });

    return {
      data: activitiesWithCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  // 获取单个活动详情
  getActivityById(id: number) {
    const activity = queryOne('SELECT * FROM activities WHERE id = ?', [id]);
    if (!activity) return null;

    const participants = queryAll(`
      SELECT ap.*, c.name as contact_name, c.avatar as contact_avatar, c.type as contact_type
      FROM activity_participants ap
      LEFT JOIN contacts c ON ap.contact_id = c.id
      WHERE ap.activity_id = ?
    `, [id]);

    const photos = queryAll('SELECT * FROM activity_photos WHERE activity_id = ?', [id]);

    return { ...activity, participants, photos };
  }

  // 创建活动
  createActivity(activity: Activity): Activity {
    const lastId = runSql(`
      INSERT INTO activities (title, description, activity_date, location, activity_type, cover_photo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [activity.title, activity.description || null, activity.activity_date,
        activity.location || null, activity.activity_type || null, activity.cover_photo || null]);

    return queryOne('SELECT * FROM activities WHERE id = ?', [lastId]);
  }

  // 更新活动
  updateActivity(id: number, activity: Partial<Activity>) {
    const existing = queryOne('SELECT * FROM activities WHERE id = ?', [id]);
    if (!existing) return null;

    const updated = { ...existing, ...activity };
    execSql(`
      UPDATE activities SET title = ?, description = ?, activity_date = ?,
      location = ?, activity_type = ?, cover_photo = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [updated.title, updated.description, updated.activity_date,
        updated.location, updated.activity_type, updated.cover_photo, id]);

    return queryOne('SELECT * FROM activities WHERE id = ?', [id]);
  }

  // 删除活动
  deleteActivity(id: number): boolean {
    execSql('DELETE FROM activity_photos WHERE activity_id = ?', [id]);
    execSql('DELETE FROM activity_participants WHERE activity_id = ?', [id]);
    execSql('DELETE FROM activities WHERE id = ?', [id]);
    return true;
  }

  // 添加参与者
  addParticipant(activityId: number, contactId: number, role?: string, notes?: string) {
    const existing = queryOne(
      'SELECT * FROM activity_participants WHERE activity_id = ? AND contact_id = ?',
      [activityId, contactId]
    );
    if (existing) return existing;

    const lastId = runSql(`
      INSERT INTO activity_participants (activity_id, contact_id, role, notes, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [activityId, contactId, role || null, notes || null]);

    return queryOne('SELECT * FROM activity_participants WHERE id = ?', [lastId]);
  }

  // 移除参与者
  removeParticipant(activityId: number, contactId: number): boolean {
    execSql('DELETE FROM activity_participants WHERE activity_id = ? AND contact_id = ?',
            [activityId, contactId]);
    return true;
  }

  // 批量添加参与者
  addParticipants(activityId: number, contactIds: number[]) {
    contactIds.forEach(contactId => this.addParticipant(activityId, contactId));
    return queryAll(`
      SELECT ap.*, c.name as contact_name, c.avatar as contact_avatar
      FROM activity_participants ap
      LEFT JOIN contacts c ON ap.contact_id = c.id
      WHERE ap.activity_id = ?
    `, [activityId]);
  }

  // 添加活动照片
  addPhoto(activityId: number, filename: string, originalName?: string, description?: string) {
    const lastId = runSql(`
      INSERT INTO activity_photos (activity_id, filename, original_name, description, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [activityId, filename, originalName || null, description || null]);

    return queryOne('SELECT * FROM activity_photos WHERE id = ?', [lastId]);
  }

  // 删除活动照片
  deletePhoto(photoId: number): boolean {
    execSql('DELETE FROM activity_photos WHERE id = ?', [photoId]);
    return true;
  }

  // 获取联系人参与的活动
  getContactActivities(contactId: number) {
    return queryAll(`
      SELECT a.* FROM activities a
      INNER JOIN activity_participants ap ON a.id = ap.activity_id
      WHERE ap.contact_id = ?
      ORDER BY a.activity_date DESC
    `, [contactId]);
  }

  // 获取活动类型统计
  getActivityStats() {
    const typeStats = queryAll(`
      SELECT activity_type, COUNT(*) as count FROM activities
      WHERE activity_type IS NOT NULL GROUP BY activity_type
    `);
    const totalActivities = queryOne('SELECT COUNT(*) as count FROM activities');
    const totalPhotos = queryOne('SELECT COUNT(*) as count FROM activity_photos');

    return {
      totalActivities: totalActivities?.count || 0,
      totalPhotos: totalPhotos?.count || 0,
      typeStats
    };
  }
}

export const activityService = new ActivityService();
