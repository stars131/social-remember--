import { getDatabase, saveDatabase } from '../config/database';
import { Contact, ContactFilter } from '../models/Contact';
import { ContactDetail, SocialInteraction, ImportantDate } from '../models/ContactDetail';
import { pinyin } from 'pinyin-pro';

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

function getPinyinInitial(name: string): string {
  try {
    const py = pinyin(name, { pattern: 'first', toneType: 'none' });
    return py.toUpperCase().charAt(0);
  } catch {
    return name.charAt(0).toUpperCase();
  }
}

export class ContactService {
  getAllContacts(filter: ContactFilter = {}) {
    const { type, relationship_level, search, page = 1, limit = 20, group_id, is_favorite, tag } = filter as any;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM contacts WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE 1=1';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      countQuery += ' AND type = ?';
      params.push(type);
    }

    if (relationship_level) {
      query += ' AND relationship_level = ?';
      countQuery += ' AND relationship_level = ?';
      params.push(relationship_level);
    }

    if (group_id) {
      query += ' AND group_id = ?';
      countQuery += ' AND group_id = ?';
      params.push(group_id);
    }

    if (is_favorite) {
      query += ' AND is_favorite = 1';
      countQuery += ' AND is_favorite = 1';
    }

    if (tag) {
      query += ' AND tags LIKE ?';
      countQuery += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ? OR tags LIKE ? OR pinyin LIKE ?)';
      countQuery += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ? OR tags LIKE ? OR pinyin LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const countResult = queryOne(countQuery, params);
    const total = countResult?.total || 0;

    query += ' ORDER BY is_pinned DESC, is_favorite DESC, pinyin ASC, updated_at DESC LIMIT ? OFFSET ?';
    const contacts = queryAll(query, [...params, limit, offset]);

    return { data: contacts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  getContactById(id: number): Contact | undefined {
    return queryOne('SELECT * FROM contacts WHERE id = ?', [id]);
  }

  createContact(contact: Contact): Contact {
    const { name, type, relationship_level = '一般', gender = '未知', birthday, age, phone, email, wechat, qq, company, position, address, hometown, tags, notes, avatar, group_id } = contact as any;
    const pinyinInitial = getPinyinInitial(name);

    const lastId = runSql(`
      INSERT INTO contacts (name, type, relationship_level, gender, birthday, age, phone, email, wechat, qq, company, position, address, hometown, tags, notes, avatar, group_id, pinyin, is_favorite, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))
    `, [name, type, relationship_level, gender, birthday || null, age || null, phone || null, email || null, wechat || null, qq || null, company || null, position || null, address || null, hometown || null, tags || null, notes || null, avatar || null, group_id || null, pinyinInitial]);

    return this.getContactById(lastId)!;
  }

  updateContact(id: number, contact: Partial<Contact>): Contact | undefined {
    const existing = this.getContactById(id);
    if (!existing) return undefined;

    const updated: any = { ...existing, ...contact };
    if (contact.name && contact.name !== existing.name) {
      updated.pinyin = getPinyinInitial(contact.name);
    }

    execSql(`
      UPDATE contacts SET name = ?, type = ?, relationship_level = ?, gender = ?, birthday = ?, age = ?, phone = ?, email = ?, wechat = ?, qq = ?, company = ?, position = ?, address = ?, hometown = ?, tags = ?, notes = ?, avatar = ?, group_id = ?, pinyin = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [updated.name, updated.type, updated.relationship_level, updated.gender, updated.birthday || null, updated.age || null, updated.phone || null, updated.email || null, updated.wechat || null, updated.qq || null, updated.company || null, updated.position || null, updated.address || null, updated.hometown || null, updated.tags || null, updated.notes || null, updated.avatar || null, updated.group_id || null, updated.pinyin || null, id]);

    return this.getContactById(id);
  }

  deleteContact(id: number): boolean {
    if (!this.getContactById(id)) return false;
    execSql('DELETE FROM contact_details WHERE contact_id = ?', [id]);
    execSql('DELETE FROM social_interactions WHERE contact_id = ?', [id]);
    execSql('DELETE FROM important_dates WHERE contact_id = ?', [id]);
    execSql('DELETE FROM contact_photos WHERE contact_id = ?', [id]);
    execSql('DELETE FROM gifts WHERE contact_id = ?', [id]);
    execSql('DELETE FROM activity_participants WHERE contact_id = ?', [id]);
    execSql('DELETE FROM contacts WHERE id = ?', [id]);
    return true;
  }

  toggleFavorite(id: number): Contact | undefined {
    const contact: any = this.getContactById(id);
    if (!contact) return undefined;
    execSql('UPDATE contacts SET is_favorite = ?, updated_at = datetime(\'now\') WHERE id = ?', [contact.is_favorite ? 0 : 1, id]);
    return this.getContactById(id);
  }

  togglePinned(id: number): Contact | undefined {
    const contact: any = this.getContactById(id);
    if (!contact) return undefined;
    execSql('UPDATE contacts SET is_pinned = ?, updated_at = datetime(\'now\') WHERE id = ?', [contact.is_pinned ? 0 : 1, id]);
    return this.getContactById(id);
  }

  updateLastContactDate(id: number): void {
    execSql('UPDATE contacts SET last_contact_date = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?', [id]);
  }

  updateAvatar(id: number, avatar: string): Contact | undefined {
    execSql('UPDATE contacts SET avatar = ?, updated_at = datetime(\'now\') WHERE id = ?', [avatar, id]);
    return this.getContactById(id);
  }

  getContactsByPinyin() {
    const contacts = queryAll('SELECT * FROM contacts ORDER BY pinyin ASC, name ASC');
    const grouped: Record<string, any[]> = {};
    contacts.forEach(c => {
      const initial = c.pinyin || '#';
      if (!grouped[initial]) grouped[initial] = [];
      grouped[initial].push(c);
    });
    return grouped;
  }

  getAllTags(): string[] {
    const contacts = queryAll('SELECT tags FROM contacts WHERE tags IS NOT NULL AND tags != \'\'');
    const tagSet = new Set<string>();
    contacts.forEach(c => {
      if (c.tags) c.tags.split(',').forEach((t: string) => { if (t.trim()) tagSet.add(t.trim()); });
    });
    return Array.from(tagSet).sort();
  }

  getFavorites() { return queryAll('SELECT * FROM contacts WHERE is_favorite = 1 ORDER BY pinyin ASC'); }
  getPinnedContacts() { return queryAll('SELECT * FROM contacts WHERE is_pinned = 1 ORDER BY updated_at DESC'); }
  getContactsByType(type: string) { return queryAll('SELECT * FROM contacts WHERE type = ? ORDER BY pinyin ASC, name', [type]); }

  getUpcomingBirthdays(days: number = 30) {
    const today = new Date();
    const contacts = queryAll('SELECT * FROM contacts WHERE birthday IS NOT NULL');
    return contacts.filter(c => {
      if (!c.birthday) return false;
      const bd = new Date(c.birthday);
      const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= days;
    }).sort((a, b) => {
      const ad = new Date(a.birthday), bd = new Date(b.birthday);
      return ad.getMonth() * 31 + ad.getDate() - (bd.getMonth() * 31 + bd.getDate());
    });
  }

  getStatistics() {
    const totalContacts = queryOne('SELECT COUNT(*) as count FROM contacts')?.count || 0;
    const favoriteCount = queryOne('SELECT COUNT(*) as count FROM contacts WHERE is_favorite = 1')?.count || 0;
    const typeStats = queryAll('SELECT type, COUNT(*) as count FROM contacts GROUP BY type');
    const relationshipStats = queryAll('SELECT relationship_level, COUNT(*) as count FROM contacts GROUP BY relationship_level');
    const genderStats = queryAll('SELECT gender, COUNT(*) as count FROM contacts GROUP BY gender');
    const recentContacts = queryAll('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5');
    const groupStats = queryAll('SELECT cg.name, cg.color, COUNT(c.id) as count FROM contact_groups cg LEFT JOIN contacts c ON c.group_id = cg.id GROUP BY cg.id');
    return { totalContacts, favoriteCount, typeStats, relationshipStats, genderStats, groupStats, recentContacts, upcomingBirthdays: this.getUpcomingBirthdays(7) };
  }

  getContactPhotos(contactId: number) { return queryAll('SELECT * FROM contact_photos WHERE contact_id = ? ORDER BY created_at DESC', [contactId]); }

  addContactPhoto(contactId: number, filename: string, originalName?: string, description?: string) {
    const lastId = runSql('INSERT INTO contact_photos (contact_id, filename, original_name, description, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))', [contactId, filename, originalName || null, description || null]);
    return queryOne('SELECT * FROM contact_photos WHERE id = ?', [lastId]);
  }

  deleteContactPhoto(photoId: number): boolean { execSql('DELETE FROM contact_photos WHERE id = ?', [photoId]); return true; }

  getContactDetails(contactId: number) { return queryAll('SELECT * FROM contact_details WHERE contact_id = ?', [contactId]); }
  addContactDetail(detail: ContactDetail) {
    const lastId = runSql('INSERT INTO contact_details (contact_id, category, content, created_at) VALUES (?, ?, ?, datetime(\'now\'))', [detail.contact_id, detail.category, detail.content]);
    return queryOne('SELECT * FROM contact_details WHERE id = ?', [lastId]);
  }
  updateContactDetail(id: number, detail: Partial<ContactDetail>) {
    execSql('UPDATE contact_details SET category = ?, content = ? WHERE id = ?', [detail.category, detail.content, id]);
    return queryOne('SELECT * FROM contact_details WHERE id = ?', [id]);
  }
  deleteContactDetail(id: number): boolean { execSql('DELETE FROM contact_details WHERE id = ?', [id]); return true; }

  getInteractions(contactId: number) { return queryAll('SELECT * FROM social_interactions WHERE contact_id = ? ORDER BY interaction_date DESC', [contactId]); }
  addInteraction(interaction: SocialInteraction) {
    const lastId = runSql('INSERT INTO social_interactions (contact_id, interaction_date, interaction_type, location, notes, follow_up_needed, follow_up_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))', [interaction.contact_id, interaction.interaction_date, interaction.interaction_type || null, interaction.location || null, interaction.notes || null, interaction.follow_up_needed ? 1 : 0, interaction.follow_up_date || null]);
    this.updateLastContactDate(interaction.contact_id);
    return queryOne('SELECT * FROM social_interactions WHERE id = ?', [lastId]);
  }
  deleteInteraction(id: number): boolean { execSql('DELETE FROM social_interactions WHERE id = ?', [id]); return true; }

  getImportantDates(contactId: number) { return queryAll('SELECT * FROM important_dates WHERE contact_id = ?', [contactId]); }
  addImportantDate(date: ImportantDate) {
    const lastId = runSql('INSERT INTO important_dates (contact_id, date_name, date_value, remind_before_days, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))', [date.contact_id, date.date_name, date.date_value, date.remind_before_days || 7, date.notes || null]);
    return queryOne('SELECT * FROM important_dates WHERE id = ?', [lastId]);
  }
  deleteImportantDate(id: number): boolean { execSql('DELETE FROM important_dates WHERE id = ?', [id]); return true; }

  getAllInteractions(startDate?: string, endDate?: string) {
    let query = 'SELECT si.*, c.name as contact_name, c.avatar as contact_avatar FROM social_interactions si LEFT JOIN contacts c ON si.contact_id = c.id WHERE 1=1';
    const params: any[] = [];
    if (startDate) { query += ' AND si.interaction_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND si.interaction_date <= ?'; params.push(endDate); }
    return queryAll(query + ' ORDER BY si.interaction_date DESC', params);
  }

  exportContacts() {
    return {
      contacts: queryAll('SELECT * FROM contacts'),
      details: queryAll('SELECT * FROM contact_details'),
      interactions: queryAll('SELECT * FROM social_interactions'),
      importantDates: queryAll('SELECT * FROM important_dates'),
      photos: queryAll('SELECT * FROM contact_photos'),
      groups: queryAll('SELECT * FROM contact_groups'),
      gifts: queryAll('SELECT * FROM gifts'),
      activities: queryAll('SELECT * FROM activities'),
      activityParticipants: queryAll('SELECT * FROM activity_participants'),
      activityPhotos: queryAll('SELECT * FROM activity_photos'),
      exportedAt: new Date().toISOString(),
    };
  }

  importContacts(data: any) {
    const idMap = new Map<number, number>();
    if (data.contacts) {
      for (const c of data.contacts) {
        const oldId = c.id; delete c.id;
        const newC = this.createContact(c);
        if (oldId && newC.id) idMap.set(oldId, newC.id);
      }
    }
    if (data.details) data.details.forEach((d: any) => { const nid = idMap.get(d.contact_id); if (nid) this.addContactDetail({ ...d, contact_id: nid }); });
    if (data.interactions) data.interactions.forEach((i: any) => { const nid = idMap.get(i.contact_id); if (nid) this.addInteraction({ ...i, contact_id: nid }); });
    if (data.importantDates) data.importantDates.forEach((d: any) => { const nid = idMap.get(d.contact_id); if (nid) this.addImportantDate({ ...d, contact_id: nid }); });
    return { imported: data.contacts?.length || 0 };
  }
}
