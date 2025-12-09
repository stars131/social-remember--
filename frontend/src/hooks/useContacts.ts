import { useState, useEffect, useCallback } from 'react';
import { Contact } from '../types';
import * as api from '../services/api';

export function useContacts(initialParams?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  group_id?: number | null;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchContacts = useCallback(async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    relationship_level?: string;
    search?: string;
    group_id?: number | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getContacts(params);
      setContacts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError('获取联系人失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
    setLoading(true);
    try {
      const newContact = await api.createContact(contact);
      await fetchContacts();
      return newContact;
    } catch (err) {
      setError('创建联系人失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContacts]);

  const updateContact = useCallback(async (id: number, contact: Partial<Contact>) => {
    setLoading(true);
    try {
      const updated = await api.updateContact(id, contact);
      await fetchContacts();
      return updated;
    } catch (err) {
      setError('更新联系人失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContacts]);

  const deleteContact = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.deleteContact(id);
      await fetchContacts();
    } catch (err) {
      setError('删除联系人失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchContacts]);

  useEffect(() => {
    fetchContacts(initialParams);
  }, []);

  return {
    contacts,
    loading,
    error,
    pagination,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
