import React, { useEffect, useState } from 'react';
import { Card, List, Button, Tag, message, Space, Avatar, Empty, Spin, Radio, Modal, Descriptions } from 'antd';
import { MergeCellsOutlined, UserOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import * as api from '../services/api';

interface DuplicateGroup {
  type: string;
  value: string;
  contacts: any[];
}

const DuplicateManager: React.FC = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [keepId, setKeepId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const data = await api.findDuplicates();
      setDuplicates(data);
    } catch {
      message.error('查找重复联系人失败');
    }
    setLoading(false);
  };

  const handleMerge = async () => {
    if (!selectedGroup || keepId === null) {
      message.error('请选择要保留的联系人');
      return;
    }

    const mergeIds = selectedGroup.contacts
      .filter(c => c.id !== keepId)
      .map(c => c.id);

    if (mergeIds.length === 0) {
      message.error('没有可合并的联系人');
      return;
    }

    setMerging(true);
    try {
      await api.mergeContacts(keepId, mergeIds);
      message.success('合并成功');
      setModalVisible(false);
      setSelectedGroup(null);
      setKeepId(null);
      loadDuplicates();
    } catch (e: any) {
      message.error(e.response?.data?.error || '合并失败');
    }
    setMerging(false);
  };

  const openMergeModal = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setKeepId(group.contacts[0]?.id || null);
    setModalVisible(true);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      name: 'blue',
      phone: 'green',
      email: 'orange',
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      name: '姓名重复',
      phone: '电话重复',
      email: '邮箱重复',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <Card><Spin tip="正在查找重复联系人..." /></Card>;
  }

  return (
    <Card
      title={<><MergeCellsOutlined /> 智能去重</>}
      extra={
        <Button icon={<ReloadOutlined />} onClick={loadDuplicates}>重新扫描</Button>
      }
    >
      {duplicates.length === 0 ? (
        <Empty
          image={<CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />}
          description={
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>太棒了！没有发现重复联系人</div>
              <div style={{ color: '#999', marginTop: 8 }}>您的通讯录保持得很整洁</div>
            </div>
          }
        />
      ) : (
        <>
          <div style={{ marginBottom: 16, color: '#666' }}>
            发现 {duplicates.length} 组可能重复的联系人，请检查并合并
          </div>
          <List
            dataSource={duplicates}
            renderItem={(group: DuplicateGroup) => (
              <Card
                size="small"
                style={{ marginBottom: 16 }}
                title={
                  <Space>
                    <Tag color={getTypeColor(group.type)}>{getTypeLabel(group.type)}</Tag>
                    <span>重复值: {group.value}</span>
                  </Space>
                }
                extra={
                  <Button type="primary" size="small" onClick={() => openMergeModal(group)}>
                    合并
                  </Button>
                }
              >
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                  dataSource={group.contacts}
                  renderItem={(contact: any) => (
                    <List.Item>
                      <Card size="small">
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space>
                            <Avatar icon={<UserOutlined />} src={contact.avatar} />
                            <div>
                              <div style={{ fontWeight: 500 }}>{contact.name}</div>
                              <div style={{ fontSize: 12, color: '#999' }}>{contact.type}</div>
                            </div>
                          </Space>
                          {contact.phone && <div>电话: {contact.phone}</div>}
                          {contact.email && <div>邮箱: {contact.email}</div>}
                          {contact.company && <div>公司: {contact.company}</div>}
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          />
        </>
      )}

      <Modal
        title="合并重复联系人"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setSelectedGroup(null); setKeepId(null); }}
        onOk={handleMerge}
        okText="合并"
        confirmLoading={merging}
        width={700}
      >
        {selectedGroup && (
          <>
            <div style={{ marginBottom: 16 }}>
              <strong>选择要保留的主联系人</strong>（其他联系人将被合并到此联系人）
            </div>
            <Radio.Group
              value={keepId}
              onChange={(e) => setKeepId(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {selectedGroup.contacts.map((contact: any) => (
                  <Card
                    key={contact.id}
                    size="small"
                    style={{ cursor: 'pointer', border: keepId === contact.id ? '2px solid #1890ff' : undefined }}
                    onClick={() => setKeepId(contact.id)}
                  >
                    <Space>
                      <Radio value={contact.id} />
                      <Avatar icon={<UserOutlined />} src={contact.avatar} />
                      <Descriptions size="small" column={2}>
                        <Descriptions.Item label="姓名">{contact.name}</Descriptions.Item>
                        <Descriptions.Item label="类型">{contact.type}</Descriptions.Item>
                        <Descriptions.Item label="电话">{contact.phone || '-'}</Descriptions.Item>
                        <Descriptions.Item label="邮箱">{contact.email || '-'}</Descriptions.Item>
                        <Descriptions.Item label="公司">{contact.company || '-'}</Descriptions.Item>
                        <Descriptions.Item label="创建时间">{contact.created_at?.slice(0, 10) || '-'}</Descriptions.Item>
                      </Descriptions>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Radio.Group>
            <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 8 }}>
              <strong>注意：</strong>合并后，被合并联系人的互动记录、礼物记录、借还记录等关联数据都将转移到保留的联系人名下。被合并的联系人将移至回收站。
            </div>
          </>
        )}
      </Modal>
    </Card>
  );
};

export default DuplicateManager;
