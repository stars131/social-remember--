import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';

const contactService = new ContactService();

export class ContactController {
  // Get all contacts
  async getAllContacts(req: Request, res: Response) {
    try {
      const { page, limit, type, relationship_level, search } = req.query;
      const result = contactService.getAllContacts({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        type: type as string,
        relationship_level: relationship_level as string,
        search: search as string,
      });
      res.json(result);
    } catch (error) {
      console.error('Error getting contacts:', error);
      res.status(500).json({ error: '获取联系人失败' });
    }
  }

  // Get contact by ID
  async getContactById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const contact = contactService.getContactById(id);
      if (!contact) {
        return res.status(404).json({ error: '联系人不存在' });
      }
      res.json(contact);
    } catch (error) {
      console.error('Error getting contact:', error);
      res.status(500).json({ error: '获取联系人详情失败' });
    }
  }

  // Create contact
  async createContact(req: Request, res: Response) {
    try {
      if (!req.body.name || !req.body.type) {
        return res.status(400).json({ error: '姓名和类型是必填项' });
      }
      const contact = contactService.createContact(req.body);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(400).json({ error: '创建联系人失败' });
    }
  }

  // Update contact
  async updateContact(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const contact = contactService.updateContact(id, req.body);
      if (!contact) {
        return res.status(404).json({ error: '联系人不存在' });
      }
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(400).json({ error: '更新联系人失败' });
    }
  }

  // Delete contact
  async deleteContact(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = contactService.deleteContact(id);
      if (!success) {
        return res.status(404).json({ error: '联系人不存在' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: '删除联系人失败' });
    }
  }

  // Get contacts by type
  async getContactsByType(req: Request, res: Response) {
    try {
      const type = req.params.type;
      const contacts = contactService.getContactsByType(type);
      res.json(contacts);
    } catch (error) {
      console.error('Error getting contacts by type:', error);
      res.status(500).json({ error: '获取联系人失败' });
    }
  }

  // Get upcoming birthdays
  async getUpcomingBirthdays(req: Request, res: Response) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const contacts = contactService.getUpcomingBirthdays(days);
      res.json(contacts);
    } catch (error) {
      console.error('Error getting birthdays:', error);
      res.status(500).json({ error: '获取生日提醒失败' });
    }
  }

  // Get statistics
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = contactService.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ error: '获取统计数据失败' });
    }
  }

  // Get contact details
  async getContactDetails(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      const details = contactService.getContactDetails(contactId);
      res.json(details);
    } catch (error) {
      console.error('Error getting contact details:', error);
      res.status(500).json({ error: '获取详细信息失败' });
    }
  }

  // Add contact detail
  async addContactDetail(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      const detail = contactService.addContactDetail({ ...req.body, contact_id: contactId });
      res.status(201).json(detail);
    } catch (error) {
      console.error('Error adding contact detail:', error);
      res.status(400).json({ error: '添加详细信息失败' });
    }
  }

  // Update contact detail
  async updateContactDetail(req: Request, res: Response) {
    try {
      const detailId = parseInt(req.params.detailId);
      const detail = contactService.updateContactDetail(detailId, req.body);
      res.json(detail);
    } catch (error) {
      console.error('Error updating contact detail:', error);
      res.status(400).json({ error: '更新详细信息失败' });
    }
  }

  // Delete contact detail
  async deleteContactDetail(req: Request, res: Response) {
    try {
      const detailId = parseInt(req.params.detailId);
      const success = contactService.deleteContactDetail(detailId);
      if (!success) {
        return res.status(404).json({ error: '详细信息不存在' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting contact detail:', error);
      res.status(500).json({ error: '删除详细信息失败' });
    }
  }

  // Get interactions
  async getInteractions(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      const interactions = contactService.getInteractions(contactId);
      res.json(interactions);
    } catch (error) {
      console.error('Error getting interactions:', error);
      res.status(500).json({ error: '获取互动记录失败' });
    }
  }

  // Add interaction
  async addInteraction(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      const interaction = contactService.addInteraction({ ...req.body, contact_id: contactId });
      res.status(201).json(interaction);
    } catch (error) {
      console.error('Error adding interaction:', error);
      res.status(400).json({ error: '添加互动记录失败' });
    }
  }

  // Delete interaction
  async deleteInteraction(req: Request, res: Response) {
    try {
      const interactionId = parseInt(req.params.interactionId);
      const success = contactService.deleteInteraction(interactionId);
      if (!success) {
        return res.status(404).json({ error: '互动记录不存在' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting interaction:', error);
      res.status(500).json({ error: '删除互动记录失败' });
    }
  }

  // Get important dates
  async getImportantDates(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      const dates = contactService.getImportantDates(contactId);
      res.json(dates);
    } catch (error) {
      console.error('Error getting important dates:', error);
      res.status(500).json({ error: '获取重要日期失败' });
    }
  }

  // Add important date
  async addImportantDate(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      const date = contactService.addImportantDate({ ...req.body, contact_id: contactId });
      res.status(201).json(date);
    } catch (error) {
      console.error('Error adding important date:', error);
      res.status(400).json({ error: '添加重要日期失败' });
    }
  }

  // Delete important date
  async deleteImportantDate(req: Request, res: Response) {
    try {
      const dateId = parseInt(req.params.dateId);
      const success = contactService.deleteImportantDate(dateId);
      if (!success) {
        return res.status(404).json({ error: '重要日期不存在' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting important date:', error);
      res.status(500).json({ error: '删除重要日期失败' });
    }
  }

  // Export contacts
  async exportContacts(req: Request, res: Response) {
    try {
      const data = contactService.exportContacts();
      res.json(data);
    } catch (error) {
      console.error('Error exporting contacts:', error);
      res.status(500).json({ error: '导出联系人失败' });
    }
  }

  // Import contacts
  async importContacts(req: Request, res: Response) {
    try {
      const result = contactService.importContacts(req.body);
      res.json(result);
    } catch (error) {
      console.error('Error importing contacts:', error);
      res.status(400).json({ error: '导入联系人失败' });
    }
  }
}

export const contactController = new ContactController();
