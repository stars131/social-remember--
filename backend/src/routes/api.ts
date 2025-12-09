import { Router, Request, Response } from 'express';
import path from 'path';
import { ContactService } from '../services/contactService';
import { activityService } from '../services/activityService';
import { groupService } from '../services/groupService';
import { giftService } from '../services/giftService';
import { settingsService } from '../services/settingsService';
import { reminderService } from '../services/reminderService';
import { upload, deleteFile } from '../services/uploadService';
import { authService } from '../services/authService';
import {
  relationshipService,
  analysisService,
  periodicReminderService,
  holidayService,
  templateService,
  loanService,
  timelineService,
  communicationService,
  mapService,
  deduplicationService,
  smartTagService,
  batchService,
  customFieldService,
  trashService,
  operationLogService,
  giftRecommendationService,
  excelService,
  vcardService,
  ocrService
} from '../services/newFeaturesService';

const router = Router();
const contactService = new ContactService();

// ==================== 认证 ====================
router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    const result = authService.login(username, password);
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json({ error: result.message });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auth/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      authService.logout(token);
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/auth/check', (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (!token) {
      return res.json({ authenticated: false });
    }
    res.json(authService.checkAuth(token));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auth/change-password', (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }
    const { valid, username } = authService.verifyToken(token);
    if (!valid || !username) {
      return res.status(401).json({ error: '未授权' });
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入原密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少6位' });
    }
    const result = authService.changePassword(username, oldPassword, newPassword);
    if (result.success) {
      res.json({ success: true, message: '密码修改成功，请重新登录' });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== Contacts ====================
router.get('/contacts', (req, res) => {
  try {
    const result = contactService.getAllContacts(req.query as any);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/pinyin', (req, res) => {
  try { res.json(contactService.getContactsByPinyin()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/tags', (req, res) => {
  try { res.json(contactService.getAllTags()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/favorites', (req, res) => {
  try { res.json(contactService.getFavorites()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/pinned', (req, res) => {
  try { res.json(contactService.getPinnedContacts()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/upcoming-birthdays', (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    res.json(contactService.getUpcomingBirthdays(days));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/type/:type', (req, res) => {
  try { res.json(contactService.getContactsByType(req.params.type)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id', (req, res) => {
  try {
    const contact = contactService.getContactById(parseInt(req.params.id));
    if (!contact) return res.status(404).json({ error: '联系人不存在' });
    res.json(contact);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts', (req, res) => {
  try {
    if (!req.body.name || !req.body.type) return res.status(400).json({ error: '姓名和类型是必填项' });
    res.status(201).json(contactService.createContact(req.body));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/contacts/:id', (req, res) => {
  try {
    const contact = contactService.updateContact(parseInt(req.params.id), req.body);
    if (!contact) return res.status(404).json({ error: '联系人不存在' });
    res.json(contact);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/contacts/:id', (req, res) => {
  try {
    // 使用软删除
    trashService.getDeletedContacts(); // 测试服务是否可用
    const db = require('../config/database').getDatabase();
    db.run('UPDATE contacts SET is_deleted = 1, deleted_at = datetime("now") WHERE id = ?', [parseInt(req.params.id)]);
    require('../config/database').saveDatabase();
    res.status(204).send();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/favorite', (req, res) => {
  try {
    const contact = contactService.toggleFavorite(parseInt(req.params.id));
    if (!contact) return res.status(404).json({ error: '联系人不存在' });
    res.json(contact);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/pin', (req, res) => {
  try {
    const contact = contactService.togglePinned(parseInt(req.params.id));
    if (!contact) return res.status(404).json({ error: '联系人不存在' });
    res.json(contact);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Contact Photos
router.get('/contacts/:id/photos', (req, res) => {
  try { res.json(contactService.getContactPhotos(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/photos', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择图片' });
    const photo = contactService.addContactPhoto(parseInt(req.params.id), req.file.filename, req.file.originalname, req.body.description);
    res.status(201).json(photo);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/contacts/:id/photos/:photoId', (req, res) => {
  try {
    contactService.deleteContactPhoto(parseInt(req.params.photoId));
    res.status(204).send();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Contact Avatar
router.post('/contacts/:id/avatar', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择图片' });
    const contact = contactService.updateAvatar(parseInt(req.params.id), `/uploads/avatars/${req.file.filename}`);
    res.json(contact);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// Contact Details
router.get('/contacts/:id/details', (req, res) => {
  try { res.json(contactService.getContactDetails(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/details', (req, res) => {
  try { res.status(201).json(contactService.addContactDetail({ ...req.body, contact_id: parseInt(req.params.id) })); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/contacts/:id/details/:detailId', (req, res) => {
  try { contactService.deleteContactDetail(parseInt(req.params.detailId)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Interactions
router.get('/contacts/:id/interactions', (req, res) => {
  try { res.json(contactService.getInteractions(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/interactions', (req, res) => {
  try { res.status(201).json(contactService.addInteraction({ ...req.body, contact_id: parseInt(req.params.id) })); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/contacts/:id/interactions/:interactionId', (req, res) => {
  try { contactService.deleteInteraction(parseInt(req.params.interactionId)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/interactions', (req, res) => {
  try { res.json(contactService.getAllInteractions(req.query.start as string, req.query.end as string)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Important Dates
router.get('/contacts/:id/important-dates', (req, res) => {
  try { res.json(contactService.getImportantDates(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/important-dates', (req, res) => {
  try { res.status(201).json(contactService.addImportantDate({ ...req.body, contact_id: parseInt(req.params.id) })); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/contacts/:id/important-dates/:dateId', (req, res) => {
  try { contactService.deleteImportantDate(parseInt(req.params.dateId)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Statistics
router.get('/statistics', (req, res) => {
  try { res.json(contactService.getStatistics()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Export/Import
router.get('/export', (req, res) => {
  try { res.json(contactService.exportContacts()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/import', (req, res) => {
  try { res.json(contactService.importContacts(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== Groups ====================
router.get('/groups', (req, res) => {
  try { res.json(groupService.getAllGroups()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/groups', (req, res) => {
  try { res.status(201).json(groupService.createGroup(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/groups/:id', (req, res) => {
  try {
    const group = groupService.updateGroup(parseInt(req.params.id), req.body);
    res.json(group);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/groups/:id', (req, res) => {
  try { groupService.deleteGroup(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== Activities ====================
router.get('/activities', (req, res) => {
  try { res.json(activityService.getAllActivities(req.query as any)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/activities/:id', (req, res) => {
  try {
    const activity = activityService.getActivityById(parseInt(req.params.id));
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    res.json(activity);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/activities', (req, res) => {
  try { res.status(201).json(activityService.createActivity(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/activities/:id', (req, res) => {
  try {
    const activity = activityService.updateActivity(parseInt(req.params.id), req.body);
    res.json(activity);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/activities/:id', (req, res) => {
  try { activityService.deleteActivity(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/activities/:id/participants', (req, res) => {
  try {
    const { contactIds } = req.body;
    if (Array.isArray(contactIds)) {
      res.json(activityService.addParticipants(parseInt(req.params.id), contactIds));
    } else {
      res.status(201).json(activityService.addParticipant(parseInt(req.params.id), req.body.contact_id, req.body.role, req.body.notes));
    }
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/activities/:id/participants/:contactId', (req, res) => {
  try { activityService.removeParticipant(parseInt(req.params.id), parseInt(req.params.contactId)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/activities/:id/photos', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择图片' });
    res.status(201).json(activityService.addPhoto(parseInt(req.params.id), req.file.filename, req.file.originalname, req.body.description));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/activities/:id/photos/:photoId', (req, res) => {
  try { activityService.deletePhoto(parseInt(req.params.photoId)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== Gifts ====================
router.get('/gifts', (req, res) => {
  try { res.json(giftService.getAllGifts(req.query as any)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/gifts/stats', (req, res) => {
  try { res.json(giftService.getGiftStats()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id/gifts', (req, res) => {
  try { res.json(giftService.getContactGifts(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/gifts', (req, res) => {
  try { res.status(201).json(giftService.addGift(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/gifts/:id', (req, res) => {
  try { res.json(giftService.updateGift(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/gifts/:id', (req, res) => {
  try { giftService.deleteGift(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== Reminders ====================
router.get('/reminders', (req, res) => {
  try { res.json(reminderService.getReminders(req.query.includeRead === 'true')); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/reminders/count', (req, res) => {
  try { res.json({ count: reminderService.getUnreadCount() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/reminders/generate', (req, res) => {
  try { res.json({ generated: reminderService.generateBirthdayReminders() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/reminders/:id/read', (req, res) => {
  try { reminderService.markAsRead(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/reminders/read-all', (req, res) => {
  try { reminderService.markAllAsRead(); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/reminders/:id', (req, res) => {
  try { reminderService.deleteReminder(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== Settings ====================
router.get('/settings/theme', (req, res) => {
  try { res.json({ theme: settingsService.getTheme() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/settings/theme', (req, res) => {
  try { settingsService.setTheme(req.body.theme); res.json({ theme: req.body.theme }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/settings/password-enabled', (req, res) => {
  try { res.json({ enabled: settingsService.isPasswordEnabled() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/settings/password', (req, res) => {
  try {
    if (!req.body.password) return res.status(400).json({ error: '请输入密码' });
    settingsService.setPassword(req.body.password);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/settings/password/disable', (req, res) => {
  try { settingsService.disablePassword(); res.json({ success: true }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 1-2. 关系图谱和联系人关联 ====================
router.get('/relationships/graph', (req, res) => {
  try { res.json(relationshipService.getGraphData()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/relationships', (req, res) => {
  try { res.json(relationshipService.getAllRelationships()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id/relationships', (req, res) => {
  try { res.json(relationshipService.getContactRelationships(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/relationships', (req, res) => {
  try { res.status(201).json(relationshipService.addRelationship(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/relationships/:id', (req, res) => {
  try { relationshipService.deleteRelationship(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 3. 社交圈分析 ====================
router.get('/analysis/social-circle', (req, res) => {
  try { res.json(analysisService.getSocialCircleAnalysis()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 4. 联系频率报告 ====================
router.get('/analysis/contact-frequency', (req, res) => {
  try { res.json(analysisService.getContactFrequencyReport()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 5. 周期性联系提醒 ====================
router.get('/periodic-reminders', (req, res) => {
  try { res.json(periodicReminderService.getAll()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/periodic-reminders', (req, res) => {
  try { res.status(201).json(periodicReminderService.add(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/periodic-reminders/:id', (req, res) => {
  try { res.json(periodicReminderService.update(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/periodic-reminders/:id', (req, res) => {
  try { periodicReminderService.delete(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/periodic-reminders/generate', (req, res) => {
  try { res.json({ generated: periodicReminderService.generateReminders() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 6. 节日问候 ====================
router.get('/holidays', (req, res) => {
  try { res.json(holidayService.getAll()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/holidays/upcoming', (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    res.json(holidayService.getUpcoming(days));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/holidays', (req, res) => {
  try { res.status(201).json(holidayService.add(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/holidays/:id', (req, res) => {
  try { res.json(holidayService.update(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/holidays/:id', (req, res) => {
  try { holidayService.delete(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 7. 消息模板 ====================
router.get('/templates', (req, res) => {
  try { res.json(templateService.getAll()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/templates/category/:category', (req, res) => {
  try { res.json(templateService.getByCategory(req.params.category)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/templates', (req, res) => {
  try { res.status(201).json(templateService.add(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/templates/:id', (req, res) => {
  try { res.json(templateService.update(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/templates/:id', (req, res) => {
  try { templateService.delete(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/templates/:id/generate', (req, res) => {
  try {
    const message = templateService.generateMessage(parseInt(req.params.id), req.body.variables || {});
    res.json({ message });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 8. 借还记录 ====================
router.get('/loans', (req, res) => {
  try { res.json(loanService.getAll(req.query)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/loans/stats', (req, res) => {
  try { res.json(loanService.getStats()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id/loans', (req, res) => {
  try { res.json(loanService.getByContact(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/loans', (req, res) => {
  try { res.status(201).json(loanService.add(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/loans/:id', (req, res) => {
  try { res.json(loanService.update(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/loans/:id/return', (req, res) => {
  try { res.json(loanService.markReturned(parseInt(req.params.id))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/loans/:id', (req, res) => {
  try { loanService.delete(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 9. 时间线 ====================
router.get('/contacts/:id/timeline', (req, res) => {
  try { res.json(timelineService.getContactTimeline(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 10. 通话/聊天记录 ====================
router.get('/contacts/:id/communications', (req, res) => {
  try { res.json(communicationService.getByContact(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/communications', (req, res) => {
  try { res.status(201).json(communicationService.add(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/communications/:id', (req, res) => {
  try { communicationService.delete(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 11-12. 地图视图 ====================
router.get('/map/contacts', (req, res) => {
  try { res.json(mapService.getContactsWithLocation()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/map/nearby', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;
    res.json(mapService.getNearbyContacts(lat, lng, radius));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/contacts/:id/location', (req, res) => {
  try { res.json(mapService.updateLocation(parseInt(req.params.id), req.body.latitude, req.body.longitude)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 13. Excel导入导出 ====================
router.get('/export/excel', (req, res) => {
  try { res.json(excelService.exportContacts()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/import/excel', (req, res) => {
  try { res.json(excelService.importContacts(req.body.data || req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 14. vCard导入导出 ====================
router.get('/export/vcard', (req, res) => {
  try {
    const vcard = vcardService.exportAllVCards();
    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.vcf');
    res.send(vcard);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id/vcard', (req, res) => {
  try {
    const vcard = vcardService.exportVCard(parseInt(req.params.id));
    if (!vcard) return res.status(404).json({ error: '联系人不存在' });
    res.setHeader('Content-Type', 'text/vcard');
    res.send(vcard);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/import/vcard', (req, res) => {
  try { res.json(vcardService.importVCards(req.body.vcard || req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 15. 名片OCR ====================
router.post('/ocr/business-card', (req, res) => {
  try { res.json(ocrService.parseBusinessCard(req.body.image)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/contacts/from-card', (req, res) => {
  try { res.status(201).json(ocrService.createFromCard(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 16. AI送礼推荐 ====================
router.get('/contacts/:id/gift-recommendations', (req, res) => {
  try { res.json(giftRecommendationService.getRecommendations(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 17. 智能去重 ====================
router.get('/duplicates', (req, res) => {
  try { res.json(deduplicationService.findDuplicates()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/duplicates/merge', (req, res) => {
  try { res.json(deduplicationService.mergeContacts(req.body.keepId, req.body.mergeIds)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 18. 智能标签 ====================
router.get('/contacts/:id/suggested-tags', (req, res) => {
  try { res.json(smartTagService.suggestTags(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/auto-tag', (req, res) => {
  try { res.json({ updated: smartTagService.autoTagAll() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 19. 批量操作 ====================
router.post('/batch/update-group', (req, res) => {
  try { res.json({ affected: batchService.batchUpdateGroup(req.body.contactIds, req.body.groupId) }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/batch/add-tags', (req, res) => {
  try { res.json({ affected: batchService.batchAddTags(req.body.contactIds, req.body.tags) }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/batch/delete', (req, res) => {
  try { res.json({ affected: batchService.batchDelete(req.body.contactIds) }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/batch/restore', (req, res) => {
  try { res.json({ affected: batchService.batchRestore(req.body.contactIds) }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 20. 自定义字段 ====================
router.get('/custom-fields', (req, res) => {
  try { res.json(customFieldService.getDefinitions()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/custom-fields', (req, res) => {
  try { res.status(201).json(customFieldService.addDefinition(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/custom-fields/:id', (req, res) => {
  try { res.json(customFieldService.updateDefinition(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/custom-fields/:id', (req, res) => {
  try { customFieldService.deleteDefinition(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id/custom-fields', (req, res) => {
  try { res.json(customFieldService.getContactCustomFields(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/custom-fields', (req, res) => {
  try {
    customFieldService.setContactCustomField(parseInt(req.params.id), req.body.fieldId, req.body.value);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ==================== 21. 回收站 ====================
router.get('/trash', (req, res) => {
  try { res.json(trashService.getDeletedContacts()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/trash/:id/restore', (req, res) => {
  try { res.json(trashService.restoreContact(parseInt(req.params.id))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/trash/:id', (req, res) => {
  try { trashService.permanentDelete(parseInt(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/trash', (req, res) => {
  try { res.json({ deleted: trashService.emptyTrash() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== 22. 操作日志 ====================
router.get('/operation-logs', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    res.json(operationLogService.getAll(limit, offset));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/operation-logs/old', (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 90;
    operationLogService.clearOld(days);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// File upload
router.post('/upload/:type', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择文件' });
    res.json({ filename: req.file.filename, path: `/uploads/${req.params.type}/${req.file.filename}` });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
