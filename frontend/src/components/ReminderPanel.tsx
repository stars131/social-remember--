import React, { useState, useEffect } from 'react';
import { Drawer, List, Tag, Button, Empty, Space, message, Spin } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, GiftOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Reminder } from '../types';
import * as api from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ReminderPanel: React.FC<Props> = ({ visible, onClose }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRead, setShowRead] = useState(false);

  useEffect(() => {
    if (visible) {
      loadReminders();
    }
  }, [visible, showRead]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await api.getReminders(showRead);
      setReminders(data);
    } catch {
      message.error('加载提醒失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markReminderAsRead(id);
      loadReminders();
    } catch {
      message.error('操作失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllRemindersAsRead();
      message.success('已全部标记为已读');
      loadReminders();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReminder(id);
      loadReminders();
    } catch {
      message.error('删除失败');
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return <GiftOutlined style={{ color: '#f5222d' }} />;
      case 'inactive':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <BellOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'birthday':
        return <Tag color="red">生日</Tag>;
      case 'inactive':
        return <Tag color="orange">长期未联系</Tag>;
      default:
        return <Tag color="blue">提醒</Tag>;
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <BellOutlined />
          提醒中心
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      extra={
        <Space>
          <Button size="small" onClick={() => setShowRead(!showRead)}>
            {showRead ? '隐藏已读' : '显示已读'}
          </Button>
          <Button type="primary" size="small" onClick={handleMarkAllAsRead}>
            全部已读
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin />
        </div>
      ) : reminders.length > 0 ? (
        <List
          dataSource={reminders}
          renderItem={(item) => (
            <List.Item
              style={{
                opacity: item.is_read ? 0.6 : 1,
                background: item.is_read ? 'transparent' : '#e6f7ff',
                padding: '12px',
                marginBottom: 8,
                borderRadius: 4,
              }}
              actions={[
                !item.is_read && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkAsRead(item.id!)}
                  />
                ),
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(item.id!)}
                />,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getReminderIcon(item.reminder_type)}
                title={
                  <Space>
                    {getReminderTypeLabel(item.reminder_type)}
                    {item.contact_name && <span>{item.contact_name}</span>}
                  </Space>
                }
                description={
                  <div>
                    <div>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {item.reminder_date}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无提醒" />
      )}
    </Drawer>
  );
};

export default ReminderPanel;
