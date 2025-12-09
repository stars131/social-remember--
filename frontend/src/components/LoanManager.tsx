import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Tag, message, Popconfirm, Statistic, Row, Col, Tabs, Space, Avatar } from 'antd';
import { PlusOutlined, CheckOutlined, DeleteOutlined, DollarOutlined, SwapOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as api from '../services/api';

const LoanManager: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loansData, statsData, contactsData] = await Promise.all([
        api.getLoans(),
        api.getLoanStats(),
        api.getContacts()
      ]);
      setLoans(loansData);
      setStats(statsData);
      setContacts(contactsData.data || contactsData);
    } catch {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleAdd = async (values: any) => {
    try {
      await api.addLoan({
        ...values,
        loan_date: values.loan_date?.format('YYYY-MM-DD'),
        due_date: values.due_date?.format('YYYY-MM-DD'),
      });
      message.success('添加成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.error || '添加失败');
    }
  };

  const handleReturn = async (id: number) => {
    try {
      await api.markLoanReturned(id);
      message.success('已标记为归还');
      loadData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteLoan(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const getFilteredLoans = () => {
    switch (activeTab) {
      case 'lent':
        return loans.filter(l => l.loan_type === 'lent' && l.status === 'pending');
      case 'borrowed':
        return loans.filter(l => l.loan_type === 'borrowed' && l.status === 'pending');
      case 'overdue':
        return loans.filter(l => l.status === 'pending' && l.due_date && new Date(l.due_date) < new Date());
      case 'returned':
        return loans.filter(l => l.status === 'returned');
      default:
        return loans;
    }
  };

  const columns = [
    {
      title: '联系人',
      dataIndex: 'contact_name',
      key: 'contact_name',
      render: (name: string, record: any) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} src={record.contact_avatar} />
          {name}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'loan_type',
      key: 'loan_type',
      render: (type: string) => (
        <Tag color={type === 'lent' ? 'orange' : 'blue'}>
          {type === 'lent' ? '借出' : '借入'}
        </Tag>
      )
    },
    {
      title: '物品/金额',
      key: 'item',
      render: (_: any, record: any) => (
        <div>
          <div>{record.item_name}</div>
          {record.amount && <span style={{ color: '#f5222d' }}>¥{record.amount}</span>}
        </div>
      )
    },
    {
      title: '借出日期',
      dataIndex: 'loan_date',
      key: 'loan_date',
      render: (date: string) => date?.slice(0, 10)
    },
    {
      title: '到期日期',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string, record: any) => {
        if (!date) return '-';
        const isOverdue = record.status === 'pending' && new Date(date) < new Date();
        return (
          <span style={{ color: isOverdue ? '#f5222d' : undefined }}>
            {date.slice(0, 10)}
            {isOverdue && <ExclamationCircleOutlined style={{ marginLeft: 4 }} />}
          </span>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'returned' ? 'green' : 'gold'}>
          {status === 'returned' ? '已归还' : '待归还'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'pending' && (
            <Popconfirm title="确认已归还?" onConfirm={() => handleReturn(record.id)}>
              <Button type="link" icon={<CheckOutlined />}>归还</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="借出未还"
              value={stats?.lentOut?.count || 0}
              suffix={stats?.lentOut?.total ? `(¥${stats.lentOut.total})` : ''}
              prefix={<SwapOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="借入未还"
              value={stats?.borrowed?.count || 0}
              suffix={stats?.borrowed?.total ? `(¥${stats.borrowed.total})` : ''}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="已逾期"
              value={stats?.overdue?.length || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16 }}
        title="借还记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加记录
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: '全部' },
            { key: 'lent', label: '借出' },
            { key: 'borrowed', label: '借入' },
            { key: 'overdue', label: '已逾期' },
            { key: 'returned', label: '已归还' },
          ]}
        />
        <Table
          dataSource={getFilteredLoans()}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="添加借还记录"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item name="contact_id" label="联系人" rules={[{ required: true, message: '请选择联系人' }]}>
            <Select
              showSearch
              placeholder="选择联系人"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={contacts.map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="loan_type" label="类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="lent">借出（我借给别人）</Select.Option>
              <Select.Option value="borrowed">借入（别人借给我）</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="item_name" label="物品名称" rules={[{ required: true, message: '请输入物品名称' }]}>
            <Input placeholder="如: 现金、书籍、工具等" />
          </Form.Item>
          <Form.Item name="amount" label="金额 (可选)">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="如果是金钱，请输入金额" />
          </Form.Item>
          <Form.Item name="loan_date" label="借出日期" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="due_date" label="预计归还日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoanManager;
