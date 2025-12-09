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

export interface ContactGroup {
  id?: number;
  name: string;
  color?: string;
  description?: string;
  sort_order?: number;
  created_at?: string;
  contact_count?: number;
}

export class GroupService {
  getAllGroups(): ContactGroup[] {
    const groups = queryAll('SELECT * FROM contact_groups ORDER BY sort_order, name');
    return groups.map(group => {
      const countResult = queryOne(
        'SELECT COUNT(*) as count FROM contacts WHERE group_id = ?', [group.id]
      );
      return { ...group, contact_count: countResult?.count || 0 };
    });
  }

  getGroupById(id: number): ContactGroup | null {
    const group = queryOne('SELECT * FROM contact_groups WHERE id = ?', [id]);
    if (!group) return null;

    const countResult = queryOne(
      'SELECT COUNT(*) as count FROM contacts WHERE group_id = ?', [id]
    );
    return { ...group, contact_count: countResult?.count || 0 };
  }

  createGroup(group: ContactGroup): ContactGroup {
    const lastId = runSql(`
      INSERT INTO contact_groups (name, color, description, sort_order, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [group.name, group.color || '#1890ff', group.description || null, group.sort_order || 0]);

    return queryOne('SELECT * FROM contact_groups WHERE id = ?', [lastId]);
  }

  updateGroup(id: number, group: Partial<ContactGroup>): ContactGroup | null {
    const existing = queryOne('SELECT * FROM contact_groups WHERE id = ?', [id]);
    if (!existing) return null;

    const updated = { ...existing, ...group };
    execSql(`
      UPDATE contact_groups SET name = ?, color = ?, description = ?, sort_order = ?
      WHERE id = ?
    `, [updated.name, updated.color, updated.description, updated.sort_order, id]);

    return this.getGroupById(id);
  }

  deleteGroup(id: number): boolean {
    // 将该分组的联系人移出分组
    execSql('UPDATE contacts SET group_id = NULL WHERE group_id = ?', [id]);
    execSql('DELETE FROM contact_groups WHERE id = ?', [id]);
    return true;
  }

  getGroupContacts(groupId: number) {
    return queryAll('SELECT * FROM contacts WHERE group_id = ? ORDER BY is_pinned DESC, name', [groupId]);
  }

  addContactToGroup(contactId: number, groupId: number): boolean {
    execSql('UPDATE contacts SET group_id = ?, updated_at = datetime(\'now\') WHERE id = ?',
            [groupId, contactId]);
    return true;
  }

  removeContactFromGroup(contactId: number): boolean {
    execSql('UPDATE contacts SET group_id = NULL, updated_at = datetime(\'now\') WHERE id = ?',
            [contactId]);
    return true;
  }
}

export const groupService = new GroupService();
