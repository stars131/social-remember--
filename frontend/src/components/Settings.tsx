import React, { useState, useEffect } from 'react';
import { Card, Switch, Form, Input, Button, Space, message, Divider, Modal, Tag, List, Popconfirm } from 'antd';
import { LockOutlined, SunOutlined, MoonOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { ContactGroup } from '../types';
import * as api from '../services/api';

interface Props {
  darkMode: boolean;
  onThemeChange: () => void;
}

const Settings: React.FC<Props> = ({ darkMode, onThemeChange }) => {
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [passwordForm] = Form.useForm();
  const [groupForm] = Form.useForm();

  useEffect(() => {
    loadPasswordStatus();
    loadGroups();
  }, []);

  const loadPasswordStatus = async () => {
    try {
      const res = await api.isPasswordEnabled();
      setPasswordEnabled(res.enabled);
    } catch {
      // Ignore
    }
  };

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch {
      // Ignore
    }
  };

  const handleSetPassword = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次密码输入不一致');
      return;
    }
    try {
      await api.setPassword(values.password);
      message.success('密码设置成功');
      setPasswordEnabled(true);
      passwordForm.resetFields();
    } catch {
      message.error('设置密码失败');
    }
  };

  const handleDisablePassword = async () => {
    try {
      await api.disablePassword();
      message.success('密码已禁用');
      setPasswordEnabled(false);
    } catch {
      message.error('禁用密码失败');
    }
  };

  const handleSaveGroup = async (values: any) => {
    try {
      if (selectedGroup) {
        await api.updateGroup(selectedGroup.id!, values);
        message.success('更新成功');
      } else {
        await api.createGroup(values);
        message.success('创建成功');
      }
      setGroupModalVisible(false);
      groupForm.resetFields();
      setSelectedGroup(null);
      loadGroups();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await api.deleteGroup(id);
      message.success('删除成功');
      loadGroups();
    } catch {
      message.error('删除失败');
    }
  };

  const colorOptions = [
    { value: '#1890ff', label: '蓝色' },
    { value: '#52c41a', label: '绿色' },
    { value: '#faad14', label: '黄色' },
    { value: '#f5222d', label: '红色' },
    { value: '#722ed1', label: '紫色' },
    { value: '#eb2f96', label: '粉色' },
    { value: '#13c2c2', label: '青色' },
    { value: '#fa8c16', label: '橙色' },
  ];

  return (
    <div>
      {/* Theme Settings */}
      <Card title="主题设置" style={{ marginBottom: 16 }}>
        <Space>
          <span>深色模式:</span>
          <Switch
            checked={darkMode}
            onChange={onThemeChange}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </Space>
      </Card>

      {/* Password Settings */}
      <Card title="密码保护" style={{ marginBottom: 16 }}>
        {passwordEnabled ? (
          <div>
            <Tag color="green" icon={<LockOutlined />}>密码保护已启用</Tag>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form form={passwordForm} layout="inline" onFinish={handleSetPassword}>
                <Form.Item name="password" rules={[{ required: true, message: '请输入新密码' }]}>
                  <Input.Password placeholder="新密码" style={{ width: 150 }} />
                </Form.Item>
                <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
                  <Input.Password placeholder="确认密码" style={{ width: 150 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">修改密码</Button>
                </Form.Item>
              </Form>
              <Popconfirm
                title="确定要禁用密码保护吗?"
                onConfirm={handleDisablePassword}
              >
                <Button danger>禁用密码</Button>
              </Popconfirm>
            </Space>
          </div>
        ) : (
          <div>
            <Tag color="default">密码保护未启用</Tag>
            <Divider />
            <Form form={passwordForm} layout="inline" onFinish={handleSetPassword}>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="设置密码" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
                <Input.Password placeholder="确认密码" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">启用密码</Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Card>

      {/* Group Management */}
      <Card
        title="联系人分组"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setSelectedGroup(null);
            groupForm.resetFields();
            setGroupModalVisible(true);
          }}>
            新建分组
          </Button>
        }
      >
        <List
          dataSource={groups}
          renderItem={(group) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  onClick={() => {
                    setSelectedGroup(group);
                    groupForm.setFieldsValue(group);
                    setGroupModalVisible(true);
                  }}
                >
                  编辑
                </Button>,
                <Popconfirm
                  title="确定删除此分组?"
                  onConfirm={() => handleDeleteGroup(group.id!)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: group.color || '#1890ff',
                    }}
                  />
                }
                title={group.name}
                description={group.description || '无描述'}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无分组' }}
        />
      </Card>

      {/* Group Modal */}
      <Modal
        title={selectedGroup ? '编辑分组' : '新建分组'}
        open={groupModalVisible}
        onCancel={() => {
          setGroupModalVisible(false);
          groupForm.resetFields();
          setSelectedGroup(null);
        }}
        footer={null}
      >
        <Form form={groupForm} layout="vertical" onFinish={handleSaveGroup}>
          <Form.Item label="分组名称" name="name" rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input placeholder="分组名称" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="分组描述" />
          </Form.Item>
          <Form.Item label="颜色" name="color">
            <Space wrap>
              {colorOptions.map(color => (
                <div
                  key={color.value}
                  onClick={() => groupForm.setFieldsValue({ color: color.value })}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: color.value,
                    cursor: 'pointer',
                    border: groupForm.getFieldValue('color') === color.value ? '3px solid #333' : '1px solid #ddd',
                  }}
                  title={color.label}
                />
              ))}
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setGroupModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
