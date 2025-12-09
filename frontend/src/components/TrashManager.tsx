import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, message, Popconfirm, Space, Empty, Avatar, Alert } from 'antd';
import { UndoOutlined, DeleteOutlined, ClearOutlined, UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const TrashManager: React.FC = () => {
  const [deletedContacts, setDeletedContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const data = await api.getTrash();
      setDeletedContacts(data);
    } catch {
      message.error('加载回收站失败');
    }
    setLoading(false);
  };

  const handleRestore = async (id: number) => {
    try {
      await api.restoreFromTrash(id);
      message.success('恢复成功');
      loadTrash();
    } catch {
      message.error('恢复失败');
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await api.permanentDelete(id);
      message.success('已永久删除');
      loadTrash();
    } catch {
      message.error('删除失败');
    }
  };

  const handleBatchRestore = async () => {
    try {
      await api.batchRestore(selectedRowKeys as number[]);
      message.success(`已恢复 ${selectedRowKeys.length} 位联系人`);
      setSelectedRowKeys([]);
      loadTrash();
    } catch {
      message.error('批量恢复失败');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const result = await api.emptyTrash();
      message.success(`已清空回收站，永久删除 ${result.deleted} 位联系人`);
      loadTrash();
    } catch {
      message.error('清空失败');
    }
  };

  const columns = [
    {
      title: '联系人',
      key: 'name',
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <div>
            <div>{record.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.phone}</div>
          </div>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>
    },
    {
      title: '删除时间',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      render: (date: string) => date?.replace('T', ' ').slice(0, 19)
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<UndoOutlined />}
            onClick={() => handleRestore(record.id)}
          >
            恢复
          </Button>
          <Popconfirm
            title="永久删除后无法恢复，确定删除?"
            icon={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="永久删除"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>永久删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys)
  };

  return (
    <Card
      title={<><DeleteOutlined /> 回收站 ({deletedContacts.length})</>}
      extra={
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button
              icon={<UndoOutlined />}
              onClick={handleBatchRestore}
            >
              批量恢复 ({selectedRowKeys.length})
            </Button>
          )}
          {deletedContacts.length > 0 && (
            <Popconfirm
              title="确定要清空回收站吗？此操作不可撤销！"
              icon={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              onConfirm={handleEmptyTrash}
              okText="清空"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<ClearOutlined />}>清空回收站</Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      {deletedContacts.length > 0 && (
        <Alert
          message="回收站中的联系人可以恢复或永久删除"
          description="永久删除后将无法恢复，相关的互动记录、礼物记录等数据也会一并删除"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {deletedContacts.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="回收站为空"
        />
      ) : (
        <Table
          dataSource={deletedContacts}
          columns={columns}
          rowSelection={rowSelection}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}
    </Card>
  );
};

export default TrashManager;
