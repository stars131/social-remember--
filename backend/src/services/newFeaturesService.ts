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

// ====== 1-2. 关系图谱和联系人关联 ======
export const relationshipService = {
  // 获取所有关系
  getAllRelationships() {
    return queryAll(`
      SELECT cr.*,
        c1.name as contact_name_1, c1.avatar as avatar_1, c1.type as type_1,
        c2.name as contact_name_2, c2.avatar as avatar_2, c2.type as type_2
      FROM contact_relationships cr
      LEFT JOIN contacts c1 ON cr.contact_id_1 = c1.id
      LEFT JOIN contacts c2 ON cr.contact_id_2 = c2.id
    `);
  },

  // 获取关系图谱数据
  getGraphData() {
    const contacts = queryAll('SELECT id, name, type, avatar, company, is_favorite FROM contacts WHERE is_deleted = 0');
    const relationships = this.getAllRelationships();

    const nodes = contacts.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      avatar: c.avatar,
      company: c.company,
      isFavorite: c.is_favorite
    }));

    const edges = relationships.map(r => ({
      source: r.contact_id_1,
      target: r.contact_id_2,
      type: r.relationship_type,
      strength: r.strength
    }));

    return { nodes, edges };
  },

  // 添加关系
  addRelationship(data: any) {
    const id = runSql(`
      INSERT INTO contact_relationships (contact_id_1, contact_id_2, relationship_type, description, strength)
      VALUES (?, ?, ?, ?, ?)
    `, [data.contact_id_1, data.contact_id_2, data.relationship_type, data.description || null, data.strength || 50]);
    return queryOne('SELECT * FROM contact_relationships WHERE id = ?', [id]);
  },

  // 删除关系
  deleteRelationship(id: number) {
    execSql('DELETE FROM contact_relationships WHERE id = ?', [id]);
  },

  // 获取联系人的所有关系
  getContactRelationships(contactId: number) {
    return queryAll(`
      SELECT cr.*,
        c1.name as contact_name_1, c2.name as contact_name_2
      FROM contact_relationships cr
      LEFT JOIN contacts c1 ON cr.contact_id_1 = c1.id
      LEFT JOIN contacts c2 ON cr.contact_id_2 = c2.id
      WHERE cr.contact_id_1 = ? OR cr.contact_id_2 = ?
    `, [contactId, contactId]);
  }
};

// ====== 3. 社交圈分析 ======
export const analysisService = {
  // 获取社交圈分析
  getSocialCircleAnalysis() {
    const byType = queryAll('SELECT type, COUNT(*) as count FROM contacts WHERE is_deleted = 0 GROUP BY type');
    const byCompany = queryAll('SELECT company, COUNT(*) as count FROM contacts WHERE is_deleted = 0 AND company IS NOT NULL AND company != "" GROUP BY company ORDER BY count DESC LIMIT 10');
    const byRelationship = queryAll('SELECT relationship_level, COUNT(*) as count FROM contacts WHERE is_deleted = 0 GROUP BY relationship_level');
    const byGroup = queryAll(`
      SELECT cg.name, cg.color, COUNT(c.id) as count
      FROM contact_groups cg
      LEFT JOIN contacts c ON c.group_id = cg.id AND c.is_deleted = 0
      GROUP BY cg.id
    `);
    const totalContacts = queryOne('SELECT COUNT(*) as count FROM contacts WHERE is_deleted = 0')?.count || 0;
    const favoriteCount = queryOne('SELECT COUNT(*) as count FROM contacts WHERE is_deleted = 0 AND is_favorite = 1')?.count || 0;

    return {
      byType,
      byCompany,
      byRelationship,
      byGroup,
      totalContacts,
      favoriteCount,
      diversityScore: Math.min(100, byType.length * 15 + byCompany.length * 5)
    };
  },

  // 4. 联系频率报告
  getContactFrequencyReport() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const recentlyContacted = queryAll(`
      SELECT c.*, MAX(si.interaction_date) as last_interaction
      FROM contacts c
      LEFT JOIN social_interactions si ON c.id = si.contact_id
      WHERE c.is_deleted = 0
      GROUP BY c.id
      HAVING last_interaction >= ?
      ORDER BY last_interaction DESC
    `, [thirtyDaysAgo]);

    const needsAttention = queryAll(`
      SELECT c.*, MAX(si.interaction_date) as last_interaction
      FROM contacts c
      LEFT JOIN social_interactions si ON c.id = si.contact_id
      WHERE c.is_deleted = 0 AND c.is_favorite = 1
      GROUP BY c.id
      HAVING last_interaction < ? OR last_interaction IS NULL
    `, [thirtyDaysAgo]);

    const neverContacted = queryAll(`
      SELECT c.*
      FROM contacts c
      LEFT JOIN social_interactions si ON c.id = si.contact_id
      WHERE c.is_deleted = 0
      GROUP BY c.id
      HAVING COUNT(si.id) = 0
    `);

    const interactionsByMonth = queryAll(`
      SELECT strftime('%Y-%m', interaction_date) as month, COUNT(*) as count
      FROM social_interactions
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);

    return {
      recentlyContacted,
      needsAttention,
      neverContacted,
      interactionsByMonth,
      summary: {
        totalInteractions: queryOne('SELECT COUNT(*) as count FROM social_interactions')?.count || 0,
        avgInteractionsPerContact: 0
      }
    };
  }
};

// ====== 5. 周期性联系提醒 ======
export const periodicReminderService = {
  getAll() {
    return queryAll(`
      SELECT pr.*, c.name as contact_name, c.avatar as contact_avatar
      FROM periodic_reminders pr
      LEFT JOIN contacts c ON pr.contact_id = c.id
      WHERE pr.is_active = 1
    `);
  },

  add(data: any) {
    const id = runSql(`
      INSERT INTO periodic_reminders (contact_id, frequency_days, notes)
      VALUES (?, ?, ?)
    `, [data.contact_id, data.frequency_days, data.notes || null]);
    return queryOne('SELECT * FROM periodic_reminders WHERE id = ?', [id]);
  },

  update(id: number, data: any) {
    execSql(`
      UPDATE periodic_reminders SET frequency_days = ?, notes = ?, is_active = ?
      WHERE id = ?
    `, [data.frequency_days, data.notes || null, data.is_active ? 1 : 0, id]);
    return queryOne('SELECT * FROM periodic_reminders WHERE id = ?', [id]);
  },

  delete(id: number) {
    execSql('DELETE FROM periodic_reminders WHERE id = ?', [id]);
  },

  // 检查并生成周期性提醒
  generateReminders() {
    const reminders = queryAll(`
      SELECT pr.*, c.name as contact_name
      FROM periodic_reminders pr
      LEFT JOIN contacts c ON pr.contact_id = c.id
      WHERE pr.is_active = 1
    `);

    let count = 0;
    const today = new Date().toISOString().split('T')[0];

    reminders.forEach(pr => {
      const lastReminded = pr.last_reminded_at ? new Date(pr.last_reminded_at) : new Date(0);
      const daysSince = Math.floor((Date.now() - lastReminded.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince >= pr.frequency_days) {
        // 检查是否已存在未读提醒
        const existing = queryOne(`
          SELECT * FROM reminders WHERE contact_id = ? AND reminder_type = 'periodic' AND is_read = 0
        `, [pr.contact_id]);

        if (!existing) {
          runSql(`
            INSERT INTO reminders (contact_id, reminder_type, title, reminder_date)
            VALUES (?, 'periodic', ?, ?)
          `, [pr.contact_id, `该联系${pr.contact_name}了（${pr.frequency_days}天周期）`, today]);

          execSql('UPDATE periodic_reminders SET last_reminded_at = ? WHERE id = ?', [today, pr.id]);
          count++;
        }
      }
    });

    return count;
  }
};

// ====== 6. 节日问候提醒 ======
export const holidayService = {
  getAll() {
    return queryAll('SELECT * FROM holidays ORDER BY month, day');
  },

  add(data: any) {
    const id = runSql(`
      INSERT INTO holidays (name, date_type, month, day, lunar_month, lunar_day, remind_before_days, greeting_template, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.name, data.date_type, data.month || null, data.day || null, data.lunar_month || null, data.lunar_day || null, data.remind_before_days || 3, data.greeting_template || null, data.is_active !== false ? 1 : 0]);
    return queryOne('SELECT * FROM holidays WHERE id = ?', [id]);
  },

  update(id: number, data: any) {
    execSql(`
      UPDATE holidays SET name = ?, month = ?, day = ?, remind_before_days = ?, greeting_template = ?, is_active = ?
      WHERE id = ?
    `, [data.name, data.month, data.day, data.remind_before_days, data.greeting_template, data.is_active ? 1 : 0, id]);
    return queryOne('SELECT * FROM holidays WHERE id = ?', [id]);
  },

  delete(id: number) {
    execSql('DELETE FROM holidays WHERE id = ?', [id]);
  },

  // 获取即将到来的节日
  getUpcoming(days: number = 30) {
    const today = new Date();
    const holidays = queryAll('SELECT * FROM holidays WHERE is_active = 1 AND date_type = "solar"');

    return holidays.filter(h => {
      const holidayDate = new Date(today.getFullYear(), h.month - 1, h.day);
      if (holidayDate < today) holidayDate.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= days;
    }).map(h => {
      const holidayDate = new Date(today.getFullYear(), h.month - 1, h.day);
      if (holidayDate < today) holidayDate.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...h, daysUntil, date: holidayDate.toISOString().split('T')[0] };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }
};

// ====== 7. 消息模板 ======
export const templateService = {
  getAll() {
    return queryAll('SELECT * FROM message_templates WHERE is_active = 1 ORDER BY category, usage_count DESC');
  },

  getByCategory(category: string) {
    return queryAll('SELECT * FROM message_templates WHERE is_active = 1 AND category = ? ORDER BY usage_count DESC', [category]);
  },

  add(data: any) {
    const id = runSql(`
      INSERT INTO message_templates (name, category, content, variables)
      VALUES (?, ?, ?, ?)
    `, [data.name, data.category, data.content, JSON.stringify(data.variables || [])]);
    return queryOne('SELECT * FROM message_templates WHERE id = ?', [id]);
  },

  update(id: number, data: any) {
    execSql(`
      UPDATE message_templates SET name = ?, category = ?, content = ?, variables = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [data.name, data.category, data.content, JSON.stringify(data.variables || []), id]);
    return queryOne('SELECT * FROM message_templates WHERE id = ?', [id]);
  },

  delete(id: number) {
    execSql('UPDATE message_templates SET is_active = 0 WHERE id = ?', [id]);
  },

  // 使用模板生成消息
  generateMessage(templateId: number, variables: Record<string, string>) {
    const template = queryOne('SELECT * FROM message_templates WHERE id = ?', [templateId]);
    if (!template) return null;

    let content = template.content;
    Object.keys(variables).forEach(key => {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), variables[key]);
    });

    execSql('UPDATE message_templates SET usage_count = usage_count + 1 WHERE id = ?', [templateId]);
    return content;
  }
};

// ====== 8. 借还记录 ======
export const loanService = {
  getAll(filter: any = {}) {
    let query = `
      SELECT l.*, c.name as contact_name, c.avatar as contact_avatar
      FROM loans l
      LEFT JOIN contacts c ON l.contact_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.status) {
      query += ' AND l.status = ?';
      params.push(filter.status);
    }
    if (filter.loan_type) {
      query += ' AND l.loan_type = ?';
      params.push(filter.loan_type);
    }

    query += ' ORDER BY l.loan_date DESC';
    return queryAll(query, params);
  },

  getByContact(contactId: number) {
    return queryAll(`
      SELECT * FROM loans WHERE contact_id = ? ORDER BY loan_date DESC
    `, [contactId]);
  },

  add(data: any) {
    const id = runSql(`
      INSERT INTO loans (contact_id, loan_type, item_name, amount, loan_date, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [data.contact_id, data.loan_type, data.item_name, data.amount || null, data.loan_date, data.due_date || null, data.notes || null]);
    return queryOne('SELECT * FROM loans WHERE id = ?', [id]);
  },

  update(id: number, data: any) {
    execSql(`
      UPDATE loans SET item_name = ?, amount = ?, due_date = ?, status = ?, return_date = ?, notes = ?
      WHERE id = ?
    `, [data.item_name, data.amount, data.due_date, data.status, data.return_date || null, data.notes, id]);
    return queryOne('SELECT * FROM loans WHERE id = ?', [id]);
  },

  markReturned(id: number) {
    const today = new Date().toISOString().split('T')[0];
    execSql('UPDATE loans SET status = "returned", return_date = ? WHERE id = ?', [today, id]);
    return queryOne('SELECT * FROM loans WHERE id = ?', [id]);
  },

  delete(id: number) {
    execSql('DELETE FROM loans WHERE id = ?', [id]);
  },

  getStats() {
    const lentOut = queryOne('SELECT COUNT(*) as count, SUM(amount) as total FROM loans WHERE loan_type = "lent" AND status = "pending"');
    const borrowed = queryOne('SELECT COUNT(*) as count, SUM(amount) as total FROM loans WHERE loan_type = "borrowed" AND status = "pending"');
    const overdue = queryAll(`
      SELECT l.*, c.name as contact_name FROM loans l
      LEFT JOIN contacts c ON l.contact_id = c.id
      WHERE l.status = 'pending' AND l.due_date < date('now')
    `);

    return {
      lentOut: { count: lentOut?.count || 0, total: lentOut?.total || 0 },
      borrowed: { count: borrowed?.count || 0, total: borrowed?.total || 0 },
      overdue
    };
  }
};

// ====== 9. 时间线视图 ======
export const timelineService = {
  getContactTimeline(contactId: number) {
    const interactions = queryAll(`
      SELECT 'interaction' as type, id, interaction_date as date, interaction_type as subtype, notes as content, location
      FROM social_interactions WHERE contact_id = ?
    `, [contactId]);

    const gifts = queryAll(`
      SELECT 'gift' as type, id, gift_date as date, gift_type as subtype, gift_name as content, value, occasion
      FROM gifts WHERE contact_id = ?
    `, [contactId]);

    const loans = queryAll(`
      SELECT 'loan' as type, id, loan_date as date, loan_type as subtype, item_name as content, amount, status
      FROM loans WHERE contact_id = ?
    `, [contactId]);

    const communications = queryAll(`
      SELECT 'communication' as type, id, comm_date as date, comm_type as subtype, summary as content, duration, mood
      FROM communication_logs WHERE contact_id = ?
    `, [contactId]);

    const all = [...interactions, ...gifts, ...loans, ...communications]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return all;
  }
};

// ====== 10. 通话/聊天记录 ======
export const communicationService = {
  getByContact(contactId: number) {
    return queryAll('SELECT * FROM communication_logs WHERE contact_id = ? ORDER BY comm_date DESC', [contactId]);
  },

  add(data: any) {
    const id = runSql(`
      INSERT INTO communication_logs (contact_id, comm_type, comm_date, duration, summary, mood, important_points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [data.contact_id, data.comm_type, data.comm_date, data.duration || null, data.summary || null, data.mood || null, data.important_points || null]);

    // 更新联系人的最后联系时间
    execSql('UPDATE contacts SET last_contact_date = ?, updated_at = datetime("now") WHERE id = ?', [data.comm_date, data.contact_id]);

    return queryOne('SELECT * FROM communication_logs WHERE id = ?', [id]);
  },

  delete(id: number) {
    execSql('DELETE FROM communication_logs WHERE id = ?', [id]);
  }
};

// ====== 11-12. 地图视图和附近的人 ======
export const mapService = {
  getContactsWithLocation() {
    return queryAll(`
      SELECT id, name, type, avatar, address, latitude, longitude
      FROM contacts
      WHERE is_deleted = 0 AND (latitude IS NOT NULL OR address IS NOT NULL AND address != '')
    `);
  },

  updateLocation(contactId: number, latitude: number, longitude: number) {
    execSql('UPDATE contacts SET latitude = ?, longitude = ?, updated_at = datetime("now") WHERE id = ?', [latitude, longitude, contactId]);
    return queryOne('SELECT * FROM contacts WHERE id = ?', [contactId]);
  },

  getNearbyContacts(latitude: number, longitude: number, radiusKm: number = 50) {
    const contacts = queryAll(`
      SELECT id, name, type, avatar, address, latitude, longitude
      FROM contacts
      WHERE is_deleted = 0 AND latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    return contacts.filter(c => {
      const distance = this.calculateDistance(latitude, longitude, c.latitude, c.longitude);
      return distance <= radiusKm;
    }).map(c => ({
      ...c,
      distance: this.calculateDistance(latitude, longitude, c.latitude, c.longitude)
    })).sort((a, b) => a.distance - b.distance);
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }
};

// ====== 17. 智能去重 ======
export const deduplicationService = {
  findDuplicates() {
    // 按姓名查找
    const byName = queryAll(`
      SELECT name, GROUP_CONCAT(id) as ids, COUNT(*) as count
      FROM contacts WHERE is_deleted = 0
      GROUP BY name HAVING count > 1
    `);

    // 按电话查找
    const byPhone = queryAll(`
      SELECT phone, GROUP_CONCAT(id) as ids, COUNT(*) as count
      FROM contacts WHERE is_deleted = 0 AND phone IS NOT NULL AND phone != ''
      GROUP BY phone HAVING count > 1
    `);

    // 按邮箱查找
    const byEmail = queryAll(`
      SELECT email, GROUP_CONCAT(id) as ids, COUNT(*) as count
      FROM contacts WHERE is_deleted = 0 AND email IS NOT NULL AND email != ''
      GROUP BY email HAVING count > 1
    `);

    const duplicates: any[] = [];

    byName.forEach(d => {
      const ids = d.ids.split(',').map(Number);
      const contacts = queryAll(`SELECT * FROM contacts WHERE id IN (${ids.join(',')})`);
      duplicates.push({ type: 'name', value: d.name, contacts });
    });

    byPhone.forEach(d => {
      const ids = d.ids.split(',').map(Number);
      const contacts = queryAll(`SELECT * FROM contacts WHERE id IN (${ids.join(',')})`);
      if (!duplicates.find(dup => dup.contacts.some((c: any) => ids.includes(c.id)))) {
        duplicates.push({ type: 'phone', value: d.phone, contacts });
      }
    });

    byEmail.forEach(d => {
      const ids = d.ids.split(',').map(Number);
      const contacts = queryAll(`SELECT * FROM contacts WHERE id IN (${ids.join(',')})`);
      if (!duplicates.find(dup => dup.contacts.some((c: any) => ids.includes(c.id)))) {
        duplicates.push({ type: 'email', value: d.email, contacts });
      }
    });

    return duplicates;
  },

  mergeContacts(keepId: number, mergeIds: number[]) {
    const keep = queryOne('SELECT * FROM contacts WHERE id = ?', [keepId]);
    if (!keep) return null;

    // 合并关联数据
    mergeIds.forEach(id => {
      execSql('UPDATE social_interactions SET contact_id = ? WHERE contact_id = ?', [keepId, id]);
      execSql('UPDATE gifts SET contact_id = ? WHERE contact_id = ?', [keepId, id]);
      execSql('UPDATE loans SET contact_id = ? WHERE contact_id = ?', [keepId, id]);
      execSql('UPDATE communication_logs SET contact_id = ? WHERE contact_id = ?', [keepId, id]);
      execSql('UPDATE contact_photos SET contact_id = ? WHERE contact_id = ?', [keepId, id]);
      execSql('UPDATE contact_details SET contact_id = ? WHERE contact_id = ?', [keepId, id]);
      execSql('UPDATE important_dates SET contact_id = ? WHERE contact_id = ?', [keepId, id]);

      // 软删除合并的联系人
      execSql('UPDATE contacts SET is_deleted = 1, deleted_at = datetime("now") WHERE id = ?', [id]);
    });

    logOperation('merge', 'contact', keepId, keep.name, `合并了 ${mergeIds.length} 个重复联系人`);
    return queryOne('SELECT * FROM contacts WHERE id = ?', [keepId]);
  }
};

// ====== 18. 智能标签 ======
export const smartTagService = {
  suggestTags(contactId: number) {
    const contact = queryOne('SELECT * FROM contacts WHERE id = ?', [contactId]);
    if (!contact) return [];

    const suggestions: string[] = [];

    // 基于公司
    if (contact.company) {
      const count = queryOne('SELECT COUNT(*) as count FROM contacts WHERE company = ? AND is_deleted = 0', [contact.company])?.count || 0;
      if (count > 1) suggestions.push(contact.company);
    }

    // 基于类型
    suggestions.push(contact.type);

    // 基于关系等级
    if (contact.relationship_level) {
      suggestions.push(contact.relationship_level);
    }

    // 基于互动频率
    const interactionCount = queryOne('SELECT COUNT(*) as count FROM social_interactions WHERE contact_id = ?', [contactId])?.count || 0;
    if (interactionCount > 10) suggestions.push('常联系');
    else if (interactionCount === 0) suggestions.push('待联系');

    // 基于礼物
    const giftCount = queryOne('SELECT COUNT(*) as count FROM gifts WHERE contact_id = ?', [contactId])?.count || 0;
    if (giftCount > 0) suggestions.push('有礼物往来');

    return [...new Set(suggestions)];
  },

  autoTagAll() {
    const contacts = queryAll('SELECT id FROM contacts WHERE is_deleted = 0');
    let updated = 0;

    contacts.forEach(c => {
      const suggestions = this.suggestTags(c.id);
      const contact = queryOne('SELECT tags FROM contacts WHERE id = ?', [c.id]);
      const existingTags = contact?.tags ? contact.tags.split(',').filter(Boolean) : [];
      const newTags = [...new Set([...existingTags, ...suggestions])];

      if (newTags.length > existingTags.length) {
        execSql('UPDATE contacts SET tags = ? WHERE id = ?', [newTags.join(','), c.id]);
        updated++;
      }
    });

    return updated;
  }
};

// ====== 19. 批量操作 ======
export const batchService = {
  batchUpdateGroup(contactIds: number[], groupId: number | null) {
    contactIds.forEach(id => {
      execSql('UPDATE contacts SET group_id = ?, updated_at = datetime("now") WHERE id = ?', [groupId, id]);
    });
    logOperation('batch_update', 'contacts', null, null, `批量更新 ${contactIds.length} 个联系人的分组`);
    return contactIds.length;
  },

  batchAddTags(contactIds: number[], tags: string[]) {
    contactIds.forEach(id => {
      const contact = queryOne('SELECT tags FROM contacts WHERE id = ?', [id]);
      const existingTags = contact?.tags ? contact.tags.split(',').filter(Boolean) : [];
      const newTags = [...new Set([...existingTags, ...tags])];
      execSql('UPDATE contacts SET tags = ?, updated_at = datetime("now") WHERE id = ?', [newTags.join(','), id]);
    });
    logOperation('batch_update', 'contacts', null, null, `批量为 ${contactIds.length} 个联系人添加标签`);
    return contactIds.length;
  },

  batchDelete(contactIds: number[]) {
    const now = new Date().toISOString();
    contactIds.forEach(id => {
      execSql('UPDATE contacts SET is_deleted = 1, deleted_at = ? WHERE id = ?', [now, id]);
    });
    logOperation('batch_delete', 'contacts', null, null, `批量删除 ${contactIds.length} 个联系人`);
    return contactIds.length;
  },

  batchRestore(contactIds: number[]) {
    contactIds.forEach(id => {
      execSql('UPDATE contacts SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [id]);
    });
    logOperation('batch_restore', 'contacts', null, null, `批量恢复 ${contactIds.length} 个联系人`);
    return contactIds.length;
  }
};

// ====== 20. 自定义字段 ======
export const customFieldService = {
  getDefinitions() {
    return queryAll('SELECT * FROM custom_field_definitions WHERE is_active = 1 ORDER BY sort_order');
  },

  addDefinition(data: any) {
    const id = runSql(`
      INSERT INTO custom_field_definitions (field_name, field_label, field_type, options, is_required, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.field_name, data.field_label, data.field_type, data.options || null, data.is_required ? 1 : 0, data.sort_order || 0]);
    return queryOne('SELECT * FROM custom_field_definitions WHERE id = ?', [id]);
  },

  updateDefinition(id: number, data: any) {
    execSql(`
      UPDATE custom_field_definitions SET field_label = ?, options = ?, is_required = ?, sort_order = ?
      WHERE id = ?
    `, [data.field_label, data.options, data.is_required ? 1 : 0, data.sort_order || 0, id]);
    return queryOne('SELECT * FROM custom_field_definitions WHERE id = ?', [id]);
  },

  deleteDefinition(id: number) {
    execSql('UPDATE custom_field_definitions SET is_active = 0 WHERE id = ?', [id]);
    execSql('DELETE FROM custom_field_values WHERE field_id = ?', [id]);
  },

  getContactCustomFields(contactId: number) {
    return queryAll(`
      SELECT cfd.*, cfv.field_value
      FROM custom_field_definitions cfd
      LEFT JOIN custom_field_values cfv ON cfd.id = cfv.field_id AND cfv.contact_id = ?
      WHERE cfd.is_active = 1
      ORDER BY cfd.sort_order
    `, [contactId]);
  },

  setContactCustomField(contactId: number, fieldId: number, value: string) {
    const existing = queryOne('SELECT * FROM custom_field_values WHERE contact_id = ? AND field_id = ?', [contactId, fieldId]);
    if (existing) {
      execSql('UPDATE custom_field_values SET field_value = ? WHERE id = ?', [value, existing.id]);
    } else {
      runSql('INSERT INTO custom_field_values (contact_id, field_id, field_value) VALUES (?, ?, ?)', [contactId, fieldId, value]);
    }
  }
};

// ====== 21. 回收站 ======
export const trashService = {
  getDeletedContacts() {
    return queryAll('SELECT * FROM contacts WHERE is_deleted = 1 ORDER BY deleted_at DESC');
  },

  restoreContact(id: number) {
    execSql('UPDATE contacts SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [id]);
    const contact = queryOne('SELECT * FROM contacts WHERE id = ?', [id]);
    logOperation('restore', 'contact', id, contact?.name, '从回收站恢复');
    return contact;
  },

  permanentDelete(id: number) {
    const contact = queryOne('SELECT * FROM contacts WHERE id = ?', [id]);
    logOperation('permanent_delete', 'contact', id, contact?.name, '永久删除');

    execSql('DELETE FROM contact_details WHERE contact_id = ?', [id]);
    execSql('DELETE FROM social_interactions WHERE contact_id = ?', [id]);
    execSql('DELETE FROM important_dates WHERE contact_id = ?', [id]);
    execSql('DELETE FROM contact_photos WHERE contact_id = ?', [id]);
    execSql('DELETE FROM gifts WHERE contact_id = ?', [id]);
    execSql('DELETE FROM loans WHERE contact_id = ?', [id]);
    execSql('DELETE FROM communication_logs WHERE contact_id = ?', [id]);
    execSql('DELETE FROM contacts WHERE id = ?', [id]);
  },

  emptyTrash() {
    const deleted = queryAll('SELECT id FROM contacts WHERE is_deleted = 1');
    deleted.forEach(c => this.permanentDelete(c.id));
    logOperation('empty_trash', 'contacts', null, null, `清空回收站，删除 ${deleted.length} 个联系人`);
    return deleted.length;
  }
};

// ====== 22. 操作日志 ======
function logOperation(operationType: string, targetType: string, targetId: number | null, targetName: string | null, description: string, oldValue?: any, newValue?: any) {
  runSql(`
    INSERT INTO operation_logs (operation_type, target_type, target_id, target_name, old_value, new_value, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [operationType, targetType, targetId, targetName, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null, description]);
}

export const operationLogService = {
  getAll(limit: number = 100, offset: number = 0) {
    return queryAll('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  },

  getByTarget(targetType: string, targetId: number) {
    return queryAll('SELECT * FROM operation_logs WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC', [targetType, targetId]);
  },

  log: logOperation,

  clearOld(days: number = 90) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    execSql('DELETE FROM operation_logs WHERE created_at < ?', [cutoff]);
  }
};

// ====== 13. Excel导入导出 ======
export const excelService = {
  exportContacts() {
    const contacts = queryAll(`
      SELECT c.*, cg.name as group_name
      FROM contacts c
      LEFT JOIN contact_groups cg ON c.group_id = cg.id
      WHERE c.is_deleted = 0
      ORDER BY c.pinyin, c.name
    `);

    // 返回可导出的数据格式
    return contacts.map(c => ({
      姓名: c.name,
      类型: c.type,
      关系等级: c.relationship_level,
      性别: c.gender,
      生日: c.birthday,
      电话: c.phone,
      邮箱: c.email,
      微信: c.wechat,
      QQ: c.qq,
      公司: c.company,
      职位: c.position,
      地址: c.address,
      籍贯: c.hometown,
      标签: c.tags,
      备注: c.notes,
      分组: c.group_name
    }));
  },

  importContacts(data: any[]) {
    let imported = 0;
    let skipped = 0;

    data.forEach(row => {
      const name = row['姓名'] || row['name'] || row['Name'];
      if (!name) {
        skipped++;
        return;
      }

      // 检查是否已存在
      const existing = queryOne('SELECT id FROM contacts WHERE name = ? AND is_deleted = 0', [name]);
      if (existing) {
        skipped++;
        return;
      }

      const type = row['类型'] || row['type'] || '其他';
      runSql(`
        INSERT INTO contacts (name, type, relationship_level, gender, birthday, phone, email, wechat, qq, company, position, address, hometown, tags, notes, pinyin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        type,
        row['关系等级'] || row['relationship_level'] || '一般',
        row['性别'] || row['gender'] || '未知',
        row['生日'] || row['birthday'] || null,
        row['电话'] || row['phone'] || null,
        row['邮箱'] || row['email'] || null,
        row['微信'] || row['wechat'] || null,
        row['QQ'] || row['qq'] || null,
        row['公司'] || row['company'] || null,
        row['职位'] || row['position'] || null,
        row['地址'] || row['address'] || null,
        row['籍贯'] || row['hometown'] || null,
        row['标签'] || row['tags'] || null,
        row['备注'] || row['notes'] || null,
        name.charAt(0).toUpperCase()
      ]);
      imported++;
    });

    logOperation('import', 'contacts', null, null, `导入 ${imported} 个联系人，跳过 ${skipped} 个`);
    return { imported, skipped };
  }
};

// ====== 14. vCard导入 ======
export const vcardService = {
  parseVCard(vcardText: string) {
    const contacts: any[] = [];
    const vcards = vcardText.split('END:VCARD').filter(v => v.includes('BEGIN:VCARD'));

    vcards.forEach(vcard => {
      const contact: any = {};

      // 解析姓名
      const fnMatch = vcard.match(/FN:(.+)/);
      if (fnMatch) contact.name = fnMatch[1].trim();

      // 解析电话
      const telMatch = vcard.match(/TEL[^:]*:(.+)/);
      if (telMatch) contact.phone = telMatch[1].trim().replace(/[\s-]/g, '');

      // 解析邮箱
      const emailMatch = vcard.match(/EMAIL[^:]*:(.+)/);
      if (emailMatch) contact.email = emailMatch[1].trim();

      // 解析公司
      const orgMatch = vcard.match(/ORG:(.+)/);
      if (orgMatch) contact.company = orgMatch[1].trim().split(';')[0];

      // 解析职位
      const titleMatch = vcard.match(/TITLE:(.+)/);
      if (titleMatch) contact.position = titleMatch[1].trim();

      // 解析地址
      const adrMatch = vcard.match(/ADR[^:]*:(.+)/);
      if (adrMatch) {
        const parts = adrMatch[1].split(';').filter(Boolean);
        contact.address = parts.join(' ').trim();
      }

      // 解析生日
      const bdayMatch = vcard.match(/BDAY:(\d{4})-?(\d{2})-?(\d{2})/);
      if (bdayMatch) {
        contact.birthday = `${bdayMatch[1]}-${bdayMatch[2]}-${bdayMatch[3]}`;
      }

      // 解析备注
      const noteMatch = vcard.match(/NOTE:(.+)/);
      if (noteMatch) contact.notes = noteMatch[1].trim();

      if (contact.name) contacts.push(contact);
    });

    return contacts;
  },

  importVCards(vcardText: string) {
    const contacts = this.parseVCard(vcardText);
    let imported = 0;
    let skipped = 0;

    contacts.forEach(c => {
      const existing = queryOne('SELECT id FROM contacts WHERE name = ? AND is_deleted = 0', [c.name]);
      if (existing) {
        skipped++;
        return;
      }

      runSql(`
        INSERT INTO contacts (name, type, phone, email, company, position, address, birthday, notes, pinyin)
        VALUES (?, '其他', ?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.name, c.phone || null, c.email || null, c.company || null, c.position || null, c.address || null, c.birthday || null, c.notes || null, c.name.charAt(0).toUpperCase()]);
      imported++;
    });

    logOperation('import_vcard', 'contacts', null, null, `从vCard导入 ${imported} 个联系人，跳过 ${skipped} 个`);
    return { imported, skipped, total: contacts.length };
  },

  exportVCard(contactId: number) {
    const contact = queryOne('SELECT * FROM contacts WHERE id = ?', [contactId]);
    if (!contact) return null;

    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcard += `FN:${contact.name}\n`;
    vcard += `N:${contact.name};;;;\n`;
    if (contact.phone) vcard += `TEL;TYPE=CELL:${contact.phone}\n`;
    if (contact.email) vcard += `EMAIL:${contact.email}\n`;
    if (contact.company) vcard += `ORG:${contact.company}\n`;
    if (contact.position) vcard += `TITLE:${contact.position}\n`;
    if (contact.address) vcard += `ADR;TYPE=HOME:;;${contact.address};;;;\n`;
    if (contact.birthday) vcard += `BDAY:${contact.birthday.replace(/-/g, '')}\n`;
    if (contact.notes) vcard += `NOTE:${contact.notes}\n`;
    vcard += 'END:VCARD';

    return vcard;
  },

  exportAllVCards() {
    const contacts = queryAll('SELECT * FROM contacts WHERE is_deleted = 0');
    return contacts.map(c => this.exportVCard(c.id)).join('\n\n');
  }
};

// ====== 15. 名片OCR扫描 (模拟) ======
export const ocrService = {
  // 模拟 OCR 解析名片 (实际需要接入 OCR API)
  parseBusinessCard(imageBase64: string) {
    // 这是一个模拟实现，实际应用需要接入 OCR 服务如百度AI、腾讯云等
    return {
      success: false,
      message: 'OCR服务需要配置第三方API密钥',
      data: null
    };
  },

  // 提供手动输入接口
  createFromCard(data: any) {
    const id = runSql(`
      INSERT INTO contacts (name, type, phone, email, company, position, address, pinyin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.type || '其他',
      data.phone || null,
      data.email || null,
      data.company || null,
      data.position || null,
      data.address || null,
      data.name ? data.name.charAt(0).toUpperCase() : 'A'
    ]);

    logOperation('create_from_card', 'contact', id, data.name, '从名片创建联系人');
    return queryOne('SELECT * FROM contacts WHERE id = ?', [id]);
  }
};

// ====== 16. AI送礼推荐 ======
export const giftRecommendationService = {
  getRecommendations(contactId: number) {
    const contact = queryOne('SELECT * FROM contacts WHERE id = ?', [contactId]);
    if (!contact) return [];

    const recommendations: any[] = [];
    const details = queryAll('SELECT * FROM contact_details WHERE contact_id = ?', [contactId]);
    const pastGifts = queryAll('SELECT * FROM gifts WHERE contact_id = ?', [contactId]);

    // 基于爱好推荐
    const hobbies = details.filter(d => d.category === '爱好');
    hobbies.forEach(h => {
      if (h.content.includes('读书') || h.content.includes('阅读')) {
        recommendations.push({ category: '书籍', reason: `喜欢${h.content}`, suggestions: ['畅销书籍', '经典名著', '专业书籍'] });
      }
      if (h.content.includes('运动') || h.content.includes('健身')) {
        recommendations.push({ category: '运动装备', reason: `喜欢${h.content}`, suggestions: ['运动手环', '运动服饰', '健身器材'] });
      }
      if (h.content.includes('音乐')) {
        recommendations.push({ category: '音乐相关', reason: `喜欢${h.content}`, suggestions: ['耳机', '音乐专辑', '音乐会门票'] });
      }
      if (h.content.includes('美食') || h.content.includes('烹饪')) {
        recommendations.push({ category: '美食相关', reason: `喜欢${h.content}`, suggestions: ['美食礼盒', '餐厅礼券', '厨具'] });
      }
    });

    // 基于性别和年龄推荐
    if (contact.gender === '女') {
      recommendations.push({ category: '通用推荐', reason: '适合女性', suggestions: ['护肤品', '鲜花', '饰品', '香水'] });
    } else if (contact.gender === '男') {
      recommendations.push({ category: '通用推荐', reason: '适合男性', suggestions: ['数码产品', '酒类', '皮具', '手表'] });
    }

    // 基于职业推荐
    if (contact.type === '老师') {
      recommendations.push({ category: '教师节礼物', reason: '适合老师', suggestions: ['精美茶具', '保温杯', '护嗓产品', '书籍'] });
    } else if (contact.type === '领导') {
      recommendations.push({ category: '商务礼品', reason: '适合商务场合', suggestions: ['高档茶叶', '红酒', '工艺品', '高档文具'] });
    }

    // 避免重复送礼
    const avoidItems = pastGifts.map(g => g.gift_name);
    recommendations.forEach(r => {
      r.suggestions = r.suggestions.filter((s: string) => !avoidItems.some(a => a.includes(s)));
    });

    return recommendations.filter(r => r.suggestions.length > 0);
  }
};
