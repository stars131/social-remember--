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

export interface Reminder {
  id?: number;
  contact_id?: number;
  reminder_type: string;
  title: string;
  reminder_date: string;
  is_read?: number;
  created_at?: string;
  contact_name?: string;
}

export class ReminderService {
  // 获取所有提醒
  getReminders(includeRead: boolean = false): Reminder[] {
    let query = `
      SELECT r.*, c.name as contact_name FROM reminders r
      LEFT JOIN contacts c ON r.contact_id = c.id
    `;
    if (!includeRead) {
      query += ' WHERE r.is_read = 0';
    }
    query += ' ORDER BY r.reminder_date ASC';
    return queryAll(query);
  }

  // 获取未读提醒数量
  getUnreadCount(): number {
    const result = queryOne('SELECT COUNT(*) as count FROM reminders WHERE is_read = 0');
    return result?.count || 0;
  }

  // 创建提醒
  createReminder(reminder: Reminder): Reminder {
    const lastId = runSql(`
      INSERT INTO reminders (contact_id, reminder_type, title, reminder_date, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `, [reminder.contact_id || null, reminder.reminder_type, reminder.title, reminder.reminder_date]);

    return queryOne('SELECT * FROM reminders WHERE id = ?', [lastId]);
  }

  // 标记为已读
  markAsRead(id: number): void {
    execSql('UPDATE reminders SET is_read = 1 WHERE id = ?', [id]);
  }

  // 标记所有为已读
  markAllAsRead(): void {
    execSql('UPDATE reminders SET is_read = 1');
  }

  // 删除提醒
  deleteReminder(id: number): void {
    execSql('DELETE FROM reminders WHERE id = ?', [id]);
  }

  // 生成生日提醒
  generateBirthdayReminders(): number {
    const today = new Date();
    const contacts = queryAll('SELECT * FROM contacts WHERE birthday IS NOT NULL');
    let count = 0;

    contacts.forEach(contact => {
      if (!contact.birthday) return;

      const birthday = new Date(contact.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      const diffTime = thisYearBirthday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 7) {
        const existing = queryOne(`
          SELECT * FROM reminders WHERE contact_id = ? AND reminder_type = 'birthday'
          AND reminder_date = ?
        `, [contact.id, thisYearBirthday.toISOString().split('T')[0]]);

        if (!existing) {
          this.createReminder({
            contact_id: contact.id,
            reminder_type: 'birthday',
            title: `${contact.name}的生日即将到来 (${diffDays === 0 ? '今天' : diffDays + '天后'})`,
            reminder_date: thisYearBirthday.toISOString().split('T')[0]
          });
          count++;
        }
      }
    });

    // 长期未联系提醒
    const inactiveContacts = queryAll(`
      SELECT * FROM contacts
      WHERE last_contact_date IS NOT NULL
      AND julianday('now') - julianday(last_contact_date) > 90
    `);

    inactiveContacts.forEach(contact => {
      const existing = queryOne(`
        SELECT * FROM reminders WHERE contact_id = ? AND reminder_type = 'inactive'
        AND is_read = 0
      `, [contact.id]);

      if (!existing) {
        this.createReminder({
          contact_id: contact.id,
          reminder_type: 'inactive',
          title: `已超过90天未与${contact.name}联系`,
          reminder_date: new Date().toISOString().split('T')[0]
        });
        count++;
      }
    });

    return count;
  }

  // 获取重要日期提醒
  getImportantDateReminders(): any[] {
    const today = new Date();
    const dates = queryAll(`
      SELECT id.*, c.name as contact_name FROM important_dates id
      LEFT JOIN contacts c ON id.contact_id = c.id
    `);

    return dates.filter(d => {
      const dateValue = new Date(d.date_value);
      const thisYearDate = new Date(today.getFullYear(), dateValue.getMonth(), dateValue.getDate());

      if (thisYearDate < today) {
        thisYearDate.setFullYear(today.getFullYear() + 1);
      }

      const diffTime = thisYearDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 0 && diffDays <= (d.remind_before_days || 7);
    });
  }
}

export const reminderService = new ReminderService();
