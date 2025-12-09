import React, { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Space, Tag, Modal, message, Tooltip, Avatar, Badge } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, StarOutlined, StarFilled, PushpinOutlined, PushpinFilled, UserOutlined } from '@ant-design/icons';
import { Contact, ContactGroup, CONTACT_TYPES, TYPE_COLORS, RELATIONSHIP_COLORS } from '../types';
import ContactForm from './ContactForm';
import ContactDetail from './ContactDetail';
import { useContacts } from '../hooks/useContacts';
import * as api from '../services/api';

const { Search } = Input;

const ContactList: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedGroup, setSelectedGroup] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [groups, setGroups] = useState<ContactGroup[]>([]);

  const { contacts, loading, pagination, fetchContacts, deleteContact } = useContacts();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch {
      // Ignore
    }
  };

  const handleToggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleFavorite(id);
      fetchContacts({ search: searchText, type: selectedType, group_id: selectedGroup });
    } catch {
      message.error('操作失败');
    }
  };

  const handleTogglePinned = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.togglePinned(id);
      fetchContacts({ search: searchText, type: selectedType, group_id: selectedGroup });
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Contact) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={!record.avatar && <UserOutlined />}
            style={{ backgroundColor: TYPE_COLORS[record.type] === 'default' ? '#87d068' : TYPE_COLORS[record.type] }}
          />
          <Button type="link" onClick={() => handleViewDetail(record)}>
            {record.is_pinned ? <Badge dot color="blue">{text}</Badge> : text}
          </Button>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={TYPE_COLORS[type] || 'default'}>{type}</Tag>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '公司/职位',
      key: 'company',
      render: (_: any, record: Contact) => (
        <span>{record.company}{record.position ? ` - ${record.position}` : ''}</span>
      ),
    },
    {
      title: '关系等级',
      dataIndex: 'relationship_level',
      key: 'relationship_level',
      render: (level: string) => level ? (
        <Tag color={RELATIONSHIP_COLORS[level] || 'default'}>{level}</Tag>
      ) : null,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string) => (
        <div>
          {tags?.split(',').filter(Boolean).slice(0, 3).map((tag: string) => (
            <Tag key={tag} color="cyan" style={{ marginBottom: 2 }}>{tag}</Tag>
          ))}
          {tags?.split(',').filter(Boolean).length > 3 && (
            <Tag>+{tags.split(',').filter(Boolean).length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Contact) => (
        <Space>
          <Tooltip title={record.is_favorite ? '取消收藏' : '收藏'}>
            <Button
              type="text"
              icon={record.is_favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={(e) => handleToggleFavorite(record.id!, e)}
            />
          </Tooltip>
          <Tooltip title={record.is_pinned ? '取消置顶' : '置顶'}>
            <Button
              type="text"
              icon={record.is_pinned ? <PushpinFilled style={{ color: '#1890ff' }} /> : <PushpinOutlined />}
              onClick={(e) => handleTogglePinned(record.id!, e)}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchContacts({ search: value, type: selectedType, group_id: selectedGroup });
  };

  const handleTypeChange = (value: string | undefined) => {
    setSelectedType(value);
    fetchContacts({ type: value, search: searchText, group_id: selectedGroup });
  };

  const handleGroupChange = (value: number | undefined) => {
    setSelectedGroup(value);
    fetchContacts({ type: selectedType, search: searchText, group_id: value });
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个联系人吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteContact(id);
          message.success('删除成功');
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormModalVisible(true);
  };

  const handleViewDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailModalVisible(true);
  };

  const handleFormSubmit = async (values: Omit<Contact, 'id'>) => {
    try {
      if (selectedContact) {
        await api.updateContact(selectedContact.id!, values);
        message.success('更新成功');
      } else {
        await api.createContact(values);
        message.success('创建成功');
      }
      setIsFormModalVisible(false);
      setSelectedContact(null);
      fetchContacts({ type: selectedType, search: searchText, group_id: selectedGroup });
    } catch {
      message.error(selectedContact ? '更新失败' : '创建失败');
    }
  };

  const handleTableChange = (paginationConfig: any) => {
    fetchContacts({
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
      type: selectedType,
      search: searchText,
      group_id: selectedGroup,
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Search
            placeholder="搜索联系人"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 250 }}
          />
          <Select
            placeholder="按类型筛选"
            style={{ width: 120 }}
            allowClear
            onChange={handleTypeChange}
            value={selectedType}
          >
            {CONTACT_TYPES.map(type => (
              <Select.Option key={type} value={type}>{type}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="按分组筛选"
            style={{ width: 120 }}
            allowClear
            onChange={handleGroupChange}
            value={selectedGroup}
          >
            {groups.map(group => (
              <Select.Option key={group.id} value={group.id!}>{group.name}</Select.Option>
            ))}
          </Select>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedContact(null);
            setIsFormModalVisible(true);
          }}
        >
          添加联系人
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={contacts}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={selectedContact ? '编辑联系人' : '添加联系人'}
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false);
          setSelectedContact(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ContactForm
          initialValues={selectedContact || undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormModalVisible(false);
            setSelectedContact(null);
          }}
          loading={loading}
          groups={groups}
        />
      </Modal>

      <Modal
        title="联系人详情"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedContact(null);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {selectedContact && (
          <ContactDetail
            contact={selectedContact}
            onEdit={() => {
              setIsDetailModalVisible(false);
              setIsFormModalVisible(true);
            }}
            onRefresh={() => fetchContacts({ type: selectedType, search: searchText, group_id: selectedGroup })}
          />
        )}
      </Modal>
    </div>
  );
};

export default ContactList;
