import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Contacts
export const getContacts = (params?: any) => api.get('/contacts', { params }).then(r => r.data);
export const getContact = (id: number) => api.get(`/contacts/${id}`).then(r => r.data);
export const createContact = (data: any) => api.post('/contacts', data).then(r => r.data);
export const updateContact = (id: number, data: any) => api.put(`/contacts/${id}`, data).then(r => r.data);
export const deleteContact = (id: number) => api.delete(`/contacts/${id}`);
export const toggleFavorite = (id: number) => api.post(`/contacts/${id}/favorite`).then(r => r.data);
export const togglePinned = (id: number) => api.post(`/contacts/${id}/pin`).then(r => r.data);
export const getContactsByPinyin = () => api.get('/contacts/pinyin').then(r => r.data);
export const getAllTags = () => api.get('/contacts/tags').then(r => r.data);
export const getFavorites = () => api.get('/contacts/favorites').then(r => r.data);
export const getPinnedContacts = () => api.get('/contacts/pinned').then(r => r.data);
export const getUpcomingBirthdays = (days?: number) => api.get('/contacts/upcoming-birthdays', { params: { days } }).then(r => r.data);
export const getContactsByType = (type: string) => api.get(`/contacts/type/${type}`).then(r => r.data);

// Contact Photos
export const getContactPhotos = (contactId: number) => api.get(`/contacts/${contactId}/photos`).then(r => r.data);
export const uploadContactPhoto = (contactId: number, formData: FormData) => api.post(`/contacts/${contactId}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const deleteContactPhoto = (contactId: number, photoId: number) => api.delete(`/contacts/${contactId}/photos/${photoId}`);
export const uploadAvatar = (contactId: number, formData: FormData) => api.post(`/contacts/${contactId}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

// Contact Details
export const getContactDetails = (contactId: number) => api.get(`/contacts/${contactId}/details`).then(r => r.data);
export const addContactDetail = (contactId: number, data: any) => api.post(`/contacts/${contactId}/details`, data).then(r => r.data);
export const updateContactDetail = (contactId: number, detailId: number, data: any) => api.put(`/contacts/${contactId}/details/${detailId}`, data).then(r => r.data);
export const deleteContactDetail = (contactId: number, detailId: number) => api.delete(`/contacts/${contactId}/details/${detailId}`);

// Interactions
export const getInteractions = (contactId: number) => api.get(`/contacts/${contactId}/interactions`).then(r => r.data);
export const addInteraction = (contactId: number, data: any) => api.post(`/contacts/${contactId}/interactions`, data).then(r => r.data);
export const deleteInteraction = (contactId: number, interactionId: number) => api.delete(`/contacts/${contactId}/interactions/${interactionId}`);
export const getAllInteractions = (start?: string, end?: string) => api.get('/interactions', { params: { start, end } }).then(r => r.data);

// Important Dates
export const getImportantDates = (contactId: number) => api.get(`/contacts/${contactId}/important-dates`).then(r => r.data);
export const addImportantDate = (contactId: number, data: any) => api.post(`/contacts/${contactId}/important-dates`, data).then(r => r.data);
export const deleteImportantDate = (contactId: number, dateId: number) => api.delete(`/contacts/${contactId}/important-dates/${dateId}`);

// Statistics
export const getStatistics = () => api.get('/statistics').then(r => r.data);

// Export/Import
export const exportContacts = () => api.get('/export').then(r => r.data);
export const importContacts = (data: any) => api.post('/import', data).then(r => r.data);

// Groups
export const getGroups = () => api.get('/groups').then(r => r.data);
export const getGroup = (id: number) => api.get(`/groups/${id}`).then(r => r.data);
export const createGroup = (data: any) => api.post('/groups', data).then(r => r.data);
export const updateGroup = (id: number, data: any) => api.put(`/groups/${id}`, data).then(r => r.data);
export const deleteGroup = (id: number) => api.delete(`/groups/${id}`);
export const getGroupContacts = (id: number) => api.get(`/groups/${id}/contacts`).then(r => r.data);

// Activities
export const getActivities = (params?: any) => api.get('/activities', { params }).then(r => r.data);
export const getActivity = (id: number) => api.get(`/activities/${id}`).then(r => r.data);
export const createActivity = (data: any) => api.post('/activities', data).then(r => r.data);
export const updateActivity = (id: number, data: any) => api.put(`/activities/${id}`, data).then(r => r.data);
export const deleteActivity = (id: number) => api.delete(`/activities/${id}`);
export const getActivityStats = () => api.get('/activities/stats').then(r => r.data);
export const addActivityParticipants = (activityId: number, contactIds: number[]) => api.post(`/activities/${activityId}/participants`, { contactIds }).then(r => r.data);
export const removeActivityParticipant = (activityId: number, contactId: number) => api.delete(`/activities/${activityId}/participants/${contactId}`);
export const uploadActivityPhoto = (activityId: number, formData: FormData) => api.post(`/activities/${activityId}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const deleteActivityPhoto = (activityId: number, photoId: number) => api.delete(`/activities/${activityId}/photos/${photoId}`);

// Gifts
export const getGifts = (params?: any) => api.get('/gifts', { params }).then(r => r.data);
export const getContactGifts = (contactId: number) => api.get(`/contacts/${contactId}/gifts`).then(r => r.data);
export const addGift = (data: any) => api.post('/gifts', data).then(r => r.data);
export const updateGift = (id: number, data: any) => api.put(`/gifts/${id}`, data).then(r => r.data);
export const deleteGift = (id: number) => api.delete(`/gifts/${id}`);
export const getGiftStats = () => api.get('/gifts/stats').then(r => r.data);

// Reminders
export const getReminders = (includeRead = false) => api.get('/reminders', { params: { includeRead } }).then(r => r.data);
export const getReminderCount = () => api.get('/reminders/count').then(r => r.data);
export const generateReminders = () => api.post('/reminders/generate').then(r => r.data);
export const markReminderAsRead = (id: number) => api.post(`/reminders/${id}/read`);
export const markAllRemindersAsRead = () => api.post('/reminders/read-all');
export const deleteReminder = (id: number) => api.delete(`/reminders/${id}`);

// Settings
export const getSettings = () => api.get('/settings').then(r => r.data);
export const getTheme = () => api.get('/settings/theme').then(r => r.data);
export const setTheme = (theme: string) => api.post('/settings/theme', { theme }).then(r => r.data);
export const isPasswordEnabled = () => api.get('/settings/password-enabled').then(r => r.data);
export const setPassword = (password: string) => api.post('/settings/password', { password }).then(r => r.data);
export const verifyPassword = (password: string) => api.post('/settings/password/verify', { password }).then(r => r.data);
export const disablePassword = () => api.post('/settings/password/disable').then(r => r.data);

// Generic upload
export const uploadFile = (type: string, formData: FormData) => api.post(`/upload/${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

// ==================== 新功能 API ====================

// 1-2. 关系图谱和联系人关联
export const getRelationshipGraph = () => api.get('/relationships/graph').then(r => r.data);
export const getRelationships = () => api.get('/relationships').then(r => r.data);
export const getContactRelationships = (contactId: number) => api.get(`/contacts/${contactId}/relationships`).then(r => r.data);
export const addRelationship = (data: any) => api.post('/relationships', data).then(r => r.data);
export const deleteRelationship = (id: number) => api.delete(`/relationships/${id}`);

// 3. 社交圈分析
export const getSocialCircleAnalysis = () => api.get('/analysis/social-circle').then(r => r.data);

// 4. 联系频率报告
export const getContactFrequencyReport = () => api.get('/analysis/contact-frequency').then(r => r.data);

// 5. 周期性联系提醒
export const getPeriodicReminders = () => api.get('/periodic-reminders').then(r => r.data);
export const addPeriodicReminder = (data: any) => api.post('/periodic-reminders', data).then(r => r.data);
export const updatePeriodicReminder = (id: number, data: any) => api.put(`/periodic-reminders/${id}`, data).then(r => r.data);
export const deletePeriodicReminder = (id: number) => api.delete(`/periodic-reminders/${id}`);
export const generatePeriodicReminders = () => api.post('/periodic-reminders/generate').then(r => r.data);

// 6. 节日问候
export const getHolidays = () => api.get('/holidays').then(r => r.data);
export const getUpcomingHolidays = (days?: number) => api.get('/holidays/upcoming', { params: { days } }).then(r => r.data);
export const addHoliday = (data: any) => api.post('/holidays', data).then(r => r.data);
export const updateHoliday = (id: number, data: any) => api.put(`/holidays/${id}`, data).then(r => r.data);
export const deleteHoliday = (id: number) => api.delete(`/holidays/${id}`);

// 7. 消息模板
export const getTemplates = () => api.get('/templates').then(r => r.data);
export const getTemplatesByCategory = (category: string) => api.get(`/templates/category/${category}`).then(r => r.data);
export const addTemplate = (data: any) => api.post('/templates', data).then(r => r.data);
export const updateTemplate = (id: number, data: any) => api.put(`/templates/${id}`, data).then(r => r.data);
export const deleteTemplate = (id: number) => api.delete(`/templates/${id}`);
export const generateMessage = (templateId: number, variables: Record<string, string>) => api.post(`/templates/${templateId}/generate`, { variables }).then(r => r.data);

// 8. 借还记录
export const getLoans = (params?: any) => api.get('/loans', { params }).then(r => r.data);
export const getLoanStats = () => api.get('/loans/stats').then(r => r.data);
export const getContactLoans = (contactId: number) => api.get(`/contacts/${contactId}/loans`).then(r => r.data);
export const addLoan = (data: any) => api.post('/loans', data).then(r => r.data);
export const updateLoan = (id: number, data: any) => api.put(`/loans/${id}`, data).then(r => r.data);
export const markLoanReturned = (id: number) => api.post(`/loans/${id}/return`).then(r => r.data);
export const deleteLoan = (id: number) => api.delete(`/loans/${id}`);

// 9. 时间线
export const getContactTimeline = (contactId: number) => api.get(`/contacts/${contactId}/timeline`).then(r => r.data);

// 10. 通话/聊天记录
export const getContactCommunications = (contactId: number) => api.get(`/contacts/${contactId}/communications`).then(r => r.data);
export const addCommunication = (data: any) => api.post('/communications', data).then(r => r.data);
export const deleteCommunication = (id: number) => api.delete(`/communications/${id}`);

// 11-12. 地图视图和附近的人
export const getMapContacts = () => api.get('/map/contacts').then(r => r.data);
export const getNearbyContacts = (lat: number, lng: number, radius?: number) => api.get('/map/nearby', { params: { lat, lng, radius } }).then(r => r.data);
export const updateContactLocation = (contactId: number, latitude: number, longitude: number) => api.put(`/contacts/${contactId}/location`, { latitude, longitude }).then(r => r.data);

// 13. Excel导入导出
export const exportToExcel = () => api.get('/export/excel').then(r => r.data);
export const importFromExcel = (data: any[]) => api.post('/import/excel', { data }).then(r => r.data);

// 14. vCard导入导出
export const exportToVCard = () => api.get('/export/vcard', { responseType: 'text' }).then(r => r.data);
export const exportContactVCard = (contactId: number) => api.get(`/contacts/${contactId}/vcard`, { responseType: 'text' }).then(r => r.data);
export const importFromVCard = (vcard: string) => api.post('/import/vcard', { vcard }).then(r => r.data);

// 15. 名片OCR
export const parseBusinessCard = (image: string) => api.post('/ocr/business-card', { image }).then(r => r.data);
export const createContactFromCard = (data: any) => api.post('/contacts/from-card', data).then(r => r.data);

// 16. AI送礼推荐
export const getGiftRecommendations = (contactId: number) => api.get(`/contacts/${contactId}/gift-recommendations`).then(r => r.data);

// 17. 智能去重
export const findDuplicates = () => api.get('/duplicates').then(r => r.data);
export const mergeContacts = (keepId: number, mergeIds: number[]) => api.post('/duplicates/merge', { keepId, mergeIds }).then(r => r.data);

// 18. 智能标签
export const getSuggestedTags = (contactId: number) => api.get(`/contacts/${contactId}/suggested-tags`).then(r => r.data);
export const autoTagAll = () => api.post('/auto-tag').then(r => r.data);

// 19. 批量操作
export const batchUpdateGroup = (contactIds: number[], groupId: number | null) => api.post('/batch/update-group', { contactIds, groupId }).then(r => r.data);
export const batchAddTags = (contactIds: number[], tags: string[]) => api.post('/batch/add-tags', { contactIds, tags }).then(r => r.data);
export const batchDelete = (contactIds: number[]) => api.post('/batch/delete', { contactIds }).then(r => r.data);
export const batchRestore = (contactIds: number[]) => api.post('/batch/restore', { contactIds }).then(r => r.data);

// 20. 自定义字段
export const getCustomFieldDefinitions = () => api.get('/custom-fields').then(r => r.data);
export const addCustomFieldDefinition = (data: any) => api.post('/custom-fields', data).then(r => r.data);
export const updateCustomFieldDefinition = (id: number, data: any) => api.put(`/custom-fields/${id}`, data).then(r => r.data);
export const deleteCustomFieldDefinition = (id: number) => api.delete(`/custom-fields/${id}`);
export const getContactCustomFields = (contactId: number) => api.get(`/contacts/${contactId}/custom-fields`).then(r => r.data);
export const setContactCustomField = (contactId: number, fieldId: number, value: string) => api.post(`/contacts/${contactId}/custom-fields`, { fieldId, value }).then(r => r.data);

// 21. 回收站
export const getTrash = () => api.get('/trash').then(r => r.data);
export const restoreFromTrash = (id: number) => api.post(`/trash/${id}/restore`).then(r => r.data);
export const permanentDelete = (id: number) => api.delete(`/trash/${id}`);
export const emptyTrash = () => api.delete('/trash').then(r => r.data);

// 22. 操作日志
export const getOperationLogs = (limit?: number, offset?: number) => api.get('/operation-logs', { params: { limit, offset } }).then(r => r.data);
export const clearOldLogs = (days?: number) => api.delete('/operation-logs/old', { params: { days } }).then(r => r.data);

// 23. 登录认证
export const login = (username: string, password: string) => api.post('/auth/login', { username, password }).then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const checkAuth = () => api.get('/auth/check').then(r => r.data);
export const changePassword = (oldPassword: string, newPassword: string) => api.post('/auth/change-password', { oldPassword, newPassword }).then(r => r.data);

// 添加请求拦截器，自动携带token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加响应拦截器，处理401错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
