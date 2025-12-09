import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Switch, Tag, message, Popconfirm, Space, Avatar, Statistic, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BellOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const PeriodicReminderManager: React.FC = () => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reminderData, contactData] = await Promise.all([
        api.getPeriodicReminders(),
        api.getContacts()
      ]);
      setReminders(reminderData);
      setContacts(contactData.data || contactData);
    } catch {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingReminder) {
        await api.updatePeriodicReminder(editingReminder.id, values);
        message.success('更新成功');
      } else {
        await api.addPeriodicReminder(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      setEditingReminder(null);
      form.resetFields();
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletePeriodicReminder(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await api.generatePeriodicReminders();
      message.success(`生成了 ${result.generated} 条提醒`);
    } catch {
      message.error('生成失败');
    }
    setGenerating(false);
  };

  const getFrequencyLabel = (days: number) => {
    if (days === 1) return '每天';
    if (days === 7) return '每周';
    if (days === 14) return '每两周';
    if (days === 30) return '每月';
    if (days === 90) return '每季度';
    if (days === 180) return '每半年';
    if (days === 365) return '每年';
    return `每${days}天`;
  };

  const columns = [
    {
      title: '联系人',
      key: 'contact',
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.contact_avatar} />
          <span>{record.contact_name}</span>
        </Space>
      )
    },
    {
      title: '联系频率',
      dataIndex: 'frequency_days',
      key: 'frequency_days',
      render: (days: number) => <Tag color="blue">{getFrequencyLabel(days)}</Tag>
    },
    {
      title: '上次提醒',
      dataIndex: 'last_reminded_at',
      key: 'last_reminded_at',
      render: (date: string) => date?.slice(0, 10) || '从未'
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? '启用' : '暂停'}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingReminder(record);
              form.setFieldsValue({
                ...record,
                is_active: !!record.is_active
              });
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="周期提醒数"
              value={reminders.length}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="启用中"
              value={reminders.filter(r => r.is_active).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="已暂停"
              value={reminders.filter(r => !r.is_active).length}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<><BellOutlined /> 周期性联系提醒</>}
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={handleGenerate} loading={generating}>
              立即检查并生成提醒
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingReminder(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              添加提醒
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={reminders}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingReminder ? '编辑周期提醒' : '添加周期提醒'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingReminder(null); form.resetFields(); }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSave}
          layout="vertical"
          initialValues={{ frequency_days: 30, is_active: true }}
        >
          <Form.Item
            name="contact_id"
            label="联系人"
            rules={[{ required: true, message: '请选择联系人' }]}
          >
            <Select
              showSearch
              placeholder="选择联系人"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={contacts.map(c => ({ value: c.id, label: c.name }))}
              disabled={!!editingReminder}
            />
          </Form.Item>
          <Form.Item
            name="frequency_days"
            label="联系频率"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value={1}>每天</Select.Option>
              <Select.Option value={7}>每周</Select.Option>
              <Select.Option value={14}>每两周</Select.Option>
              <Select.Option value={30}>每月</Select.Option>
              <Select.Option value={90}>每季度</Select.Option>
              <Select.Option value={180}>每半年</Select.Option>
              <Select.Option value={365}>每年</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注，如联系方式、话题等" />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PeriodicReminderManager;
