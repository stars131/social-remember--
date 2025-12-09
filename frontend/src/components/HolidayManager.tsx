import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Tag, message, Popconfirm, Switch, Row, Col, List, Avatar, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, GiftOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const HolidayManager: React.FC = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [all, upcoming] = await Promise.all([
        api.getHolidays(),
        api.getUpcomingHolidays(60)
      ]);
      setHolidays(all);
      setUpcomingHolidays(upcoming);
    } catch {
      message.error('加载节日数据失败');
    }
    setLoading(false);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingHoliday) {
        await api.updateHoliday(editingHoliday.id, values);
        message.success('更新成功');
      } else {
        await api.addHoliday(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      setEditingHoliday(null);
      form.resetFields();
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteHoliday(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '节日名称', dataIndex: 'name', key: 'name' },
    {
      title: '日期类型',
      dataIndex: 'date_type',
      key: 'date_type',
      render: (type: string) => (
        <Tag color={type === 'solar' ? 'blue' : 'orange'}>
          {type === 'solar' ? '公历' : '农历'}
        </Tag>
      )
    },
    {
      title: '日期',
      key: 'date',
      render: (_: any, record: any) => {
        if (record.date_type === 'solar') {
          return `${record.month}月${record.day}日`;
        }
        return `农历${record.lunar_month}月${record.lunar_day}日`;
      }
    },
    {
      title: '提前提醒',
      dataIndex: 'remind_before_days',
      key: 'remind',
      render: (days: number) => `${days}天`
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? '启用' : '禁用'}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingHoliday(record);
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
        </>
      )
    }
  ];

  const getDaysUntilColor = (days: number) => {
    if (days <= 3) return '#f5222d';
    if (days <= 7) return '#fa8c16';
    if (days <= 14) return '#faad14';
    return '#52c41a';
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Card
          title={<><CalendarOutlined /> 即将到来的节日</>}
          style={{ height: '100%' }}
        >
          {upcomingHolidays.length > 0 ? (
            <List
              dataSource={upcomingHolidays}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge count={`${item.daysUntil}天`} style={{ backgroundColor: getDaysUntilColor(item.daysUntil) }}>
                        <Avatar icon={<GiftOutlined />} style={{ backgroundColor: '#1890ff' }} />
                      </Badge>
                    }
                    title={item.name}
                    description={
                      <>
                        <div>{item.date}</div>
                        {item.greeting_template && (
                          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                            模板: {item.greeting_template.slice(0, 30)}...
                          </div>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
              近期没有节日
            </div>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={16}>
        <Card
          title="节日管理"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingHoliday(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              添加节日
            </Button>
          }
        >
          <Table
            dataSource={holidays}
            columns={columns}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Col>

      <Modal
        title={editingHoliday ? '编辑节日' : '添加节日'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingHoliday(null); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} onFinish={handleSave} layout="vertical" initialValues={{ date_type: 'solar', remind_before_days: 3, is_active: true }}>
          <Form.Item name="name" label="节日名称" rules={[{ required: true, message: '请输入节日名称' }]}>
            <Input placeholder="如: 中秋节" />
          </Form.Item>
          <Form.Item name="date_type" label="日期类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="solar">公历</Select.Option>
              <Select.Option value="lunar">农历</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.date_type !== curr.date_type}>
            {({ getFieldValue }) => {
              const dateType = getFieldValue('date_type');
              return dateType === 'solar' ? (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="month" label="月" rules={[{ required: true }]}>
                      <InputNumber min={1} max={12} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="day" label="日" rules={[{ required: true }]}>
                      <InputNumber min={1} max={31} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="lunar_month" label="农历月" rules={[{ required: true }]}>
                      <InputNumber min={1} max={12} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="lunar_day" label="农历日" rules={[{ required: true }]}>
                      <InputNumber min={1} max={30} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>
          <Form.Item name="remind_before_days" label="提前提醒天数">
            <InputNumber min={0} max={30} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="greeting_template" label="问候模板">
            <Input.TextArea rows={3} placeholder="可选，用于生成节日问候消息" />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default HolidayManager;
