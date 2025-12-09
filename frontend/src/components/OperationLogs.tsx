import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Popconfirm, Select, message, Space, Typography, Tooltip } from 'antd';
import { DeleteOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const { Text } = Typography;

const OperationLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    loadLogs();
  }, [pagination.current, pagination.pageSize]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const offset = (pagination.current - 1) * pagination.pageSize;
      const data = await api.getOperationLogs(pagination.pageSize, offset);
      setLogs(data);
      // 假设后端返回了总数，否则需要调整
      setPagination(prev => ({ ...prev, total: data.length >= pagination.pageSize ? prev.total + 1 : prev.total }));
    } catch {
      message.error('加载操作日志失败');
    }
    setLoading(false);
  };

  const handleClearOld = async (days: number) => {
    try {
      await api.clearOldLogs(days);
      message.success(`已清理 ${days} 天前的日志`);
      loadLogs();
    } catch {
      message.error('清理失败');
    }
  };

  const getOperationColor = (type: string) => {
    const colors: Record<string, string> = {
      create: 'green',
      update: 'blue',
      delete: 'red',
      merge: 'purple',
      restore: 'cyan',
      import: 'orange',
      import_vcard: 'orange',
      batch_update: 'geekblue',
      batch_delete: 'volcano',
      batch_restore: 'lime',
      permanent_delete: 'magenta',
      empty_trash: 'red',
      create_from_card: 'green',
    };
    return colors[type] || 'default';
  };

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      merge: '合并',
      restore: '恢复',
      import: '导入',
      import_vcard: 'vCard导入',
      batch_update: '批量更新',
      batch_delete: '批量删除',
      batch_restore: '批量恢复',
      permanent_delete: '永久删除',
      empty_trash: '清空回收站',
      create_from_card: '名片创建',
    };
    return labels[type] || type;
  };

  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contact: '联系人',
      contacts: '联系人',
      group: '分组',
      activity: '活动',
      gift: '礼物',
      relationship: '关系',
    };
    return labels[type] || type;
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => date?.replace('T', ' ').slice(0, 19)
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 120,
      render: (type: string) => (
        <Tag color={getOperationColor(type)}>{getOperationLabel(type)}</Tag>
      )
    },
    {
      title: '目标类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 100,
      render: (type: string) => getTargetTypeLabel(type)
    },
    {
      title: '目标',
      key: 'target',
      width: 150,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          {record.target_name && <Text strong>{record.target_name}</Text>}
          {record.target_id && <Text type="secondary">ID: {record.target_id}</Text>}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <span>{desc}</span>
        </Tooltip>
      )
    },
    {
      title: '变更详情',
      key: 'changes',
      width: 200,
      render: (_: any, record: any) => {
        if (!record.old_value && !record.new_value) return '-';
        return (
          <Space direction="vertical" size={0}>
            {record.old_value && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                旧值: {typeof record.old_value === 'string' ? record.old_value.slice(0, 30) : JSON.stringify(record.old_value).slice(0, 30)}...
              </Text>
            )}
            {record.new_value && (
              <Text style={{ fontSize: 12 }}>
                新值: {typeof record.new_value === 'string' ? record.new_value.slice(0, 30) : JSON.stringify(record.new_value).slice(0, 30)}...
              </Text>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <Card
      title={<><HistoryOutlined /> 操作日志</>}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadLogs}>刷新</Button>
          <Popconfirm
            title={
              <div>
                <p>清理多少天前的日志？</p>
                <Select
                  defaultValue={90}
                  style={{ width: 120 }}
                  options={[
                    { value: 30, label: '30天' },
                    { value: 60, label: '60天' },
                    { value: 90, label: '90天' },
                    { value: 180, label: '180天' },
                    { value: 365, label: '1年' },
                  ]}
                  onChange={(value) => handleClearOld(value)}
                />
              </div>
            }
            onConfirm={() => {}}
            showCancel={false}
          >
            <Button danger icon={<DeleteOutlined />}>清理旧日志</Button>
          </Popconfirm>
        </Space>
      }
    >
      <Table
        dataSource={logs}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }))
        }}
        scroll={{ x: 1000 }}
        size="small"
      />
    </Card>
  );
};

export default OperationLogs;
