import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, Tag, message, Card, Row, Col, Statistic, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Gift, Contact } from '../types';
import * as api from '../services/api';

const { TextArea } = Input;

const GiftManager: React.FC = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    loadGifts();
    loadContacts();
    loadStats();
  }, [filterType]);

  const loadGifts = async () => {
    setLoading(true);
    try {
      const params = filterType ? { gift_type: filterType } : {};
      const data = await api.getGifts(params);
      setGifts(data.data || data);
    } catch {
      message.error('加载礼物记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await api.getContacts({ limit: 1000 });
      setContacts(data.data || []);
    } catch {
      // Ignore
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getGiftStats();
      setStats(data);
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        gift_date: values.gift_date.format('YYYY-MM-DD'),
      };
      if (selectedGift) {
        await api.updateGift(selectedGift.id!, data);
        message.success('更新成功');
      } else {
        await api.addGift(data);
        message.success('添加成功');
      }
      setModalVisible(false);
      form.resetFields();
      setSelectedGift(null);
      loadGifts();
      loadStats();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteGift(id);
      message.success('删除成功');
      loadGifts();
      loadStats();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '礼物名称',
      dataIndex: 'gift_name',
      key: 'gift_name',
    },
    {
      title: '类型',
      dataIndex: 'gift_type',
      key: 'gift_type',
      render: (type: string) => (
        <Tag color={type === 'sent' ? 'blue' : 'green'} icon={type === 'sent' ? <SendOutlined /> : <InboxOutlined />}>
          {type === 'sent' ? '送出' : '收到'}
        </Tag>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contact_name',
      key: 'contact_name',
    },
    {
      title: '日期',
      dataIndex: 'gift_date',
      key: 'gift_date',
    },
    {
      title: '场合',
      dataIndex: 'occasion',
      key: 'occasion',
    },
    {
      title: '价值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => value ? `¥${value}` : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Gift) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => {
            setSelectedGift(record);
            form.setFieldsValue({
              ...record,
              gift_date: dayjs(record.gift_date),
            });
            setModalVisible(true);
          }} />
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id!)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="送出礼物"
                value={stats.sentCount || 0}
                prefix={<SendOutlined />}
                suffix="件"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="收到礼物"
                value={stats.receivedCount || 0}
                prefix={<InboxOutlined />}
                suffix="件"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="送出总价值"
                value={stats.sentValue || 0}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="收到总价值"
                value={stats.receivedValue || 0}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Select
            placeholder="筛选类型"
            style={{ width: 120 }}
            allowClear
            value={filterType}
            onChange={setFilterType}
          >
            <Select.Option value="sent">送出</Select.Option>
            <Select.Option value="received">收到</Select.Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setSelectedGift(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          添加记录
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={gifts}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={selectedGift ? '编辑礼物记录' : '添加礼物记录'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedGift(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="礼物名称" name="gift_name" rules={[{ required: true, message: '请输入礼物名称' }]}>
                <Input placeholder="礼物名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="类型" name="gift_type" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="选择类型">
                  <Select.Option value="sent">送出</Select.Option>
                  <Select.Option value="received">收到</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="联系人" name="contact_id" rules={[{ required: true, message: '请选择联系人' }]}>
                <Select
                  placeholder="选择联系人"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {contacts.map(c => (
                    <Select.Option key={c.id} value={c.id!}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="日期" name="gift_date" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="场合" name="occasion">
                <Select placeholder="选择场合" allowClear>
                  <Select.Option value="生日">生日</Select.Option>
                  <Select.Option value="节日">节日</Select.Option>
                  <Select.Option value="纪念日">纪念日</Select.Option>
                  <Select.Option value="拜访">拜访</Select.Option>
                  <Select.Option value="感谢">感谢</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="价值" name="value">
                <InputNumber style={{ width: '100%' }} placeholder="价值(元)" min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GiftManager;
