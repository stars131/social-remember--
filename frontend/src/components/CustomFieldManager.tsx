import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, InputNumber, Tag, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const CustomFieldManager: React.FC = () => {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomFieldDefinitions();
      setFields(data);
    } catch {
      message.error('加载自定义字段失败');
    }
    setLoading(false);
  };

  const handleSave = async (values: any) => {
    try {
      const data = {
        ...values,
        options: values.options ? values.options.split(',').map((s: string) => s.trim()).filter(Boolean).join(',') : null
      };

      if (editingField) {
        await api.updateCustomFieldDefinition(editingField.id, data);
        message.success('更新成功');
      } else {
        await api.addCustomFieldDefinition(data);
        message.success('添加成功');
      }
      setModalVisible(false);
      setEditingField(null);
      form.resetFields();
      loadFields();
    } catch (e: any) {
      message.error(e.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteCustomFieldDefinition(id);
      message.success('删除成功');
      loadFields();
    } catch {
      message.error('删除失败');
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: '文本',
      number: '数字',
      date: '日期',
      select: '下拉选择',
      textarea: '多行文本',
    };
    return labels[type] || type;
  };

  const getFieldTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: 'blue',
      number: 'green',
      date: 'orange',
      select: 'purple',
      textarea: 'cyan',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 60,
    },
    {
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
      render: (name: string) => <code>{name}</code>
    },
    {
      title: '显示标签',
      dataIndex: 'field_label',
      key: 'field_label',
    },
    {
      title: '字段类型',
      dataIndex: 'field_type',
      key: 'field_type',
      render: (type: string) => <Tag color={getFieldTypeColor(type)}>{getFieldTypeLabel(type)}</Tag>
    },
    {
      title: '选项',
      dataIndex: 'options',
      key: 'options',
      render: (options: string) => {
        if (!options) return '-';
        return options.split(',').slice(0, 3).map((opt: string, i: number) => (
          <Tag key={i}>{opt}</Tag>
        ));
      }
    },
    {
      title: '必填',
      dataIndex: 'is_required',
      key: 'is_required',
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'}>{required ? '是' : '否'}</Tag>
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
              setEditingField(record);
              form.setFieldsValue({
                ...record,
                is_required: !!record.is_required
              });
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="删除后，所有联系人的该字段数据也会被删除，确定吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title={<><SettingOutlined /> 自定义字段管理</>}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingField(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          添加字段
        </Button>
      }
    >
      <div style={{ marginBottom: 16, color: '#666' }}>
        自定义字段可以为联系人添加额外的信息，如血型、星座、兴趣爱好等。
      </div>
      <Table
        dataSource={fields}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editingField ? '编辑自定义字段' : '添加自定义字段'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingField(null); form.resetFields(); }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSave}
          layout="vertical"
          initialValues={{ field_type: 'text', is_required: false, sort_order: 0 }}
        >
          <Form.Item
            name="field_name"
            label="字段名"
            rules={[
              { required: true, message: '请输入字段名' },
              { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' }
            ]}
            extra="用于存储的唯一标识，只能包含小写字母和下划线"
          >
            <Input placeholder="如: blood_type" disabled={!!editingField} />
          </Form.Item>
          <Form.Item
            name="field_label"
            label="显示标签"
            rules={[{ required: true, message: '请输入显示标签' }]}
          >
            <Input placeholder="如: 血型" />
          </Form.Item>
          <Form.Item
            name="field_type"
            label="字段类型"
            rules={[{ required: true }]}
          >
            <Select disabled={!!editingField}>
              <Select.Option value="text">文本</Select.Option>
              <Select.Option value="number">数字</Select.Option>
              <Select.Option value="date">日期</Select.Option>
              <Select.Option value="select">下拉选择</Select.Option>
              <Select.Option value="textarea">多行文本</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.field_type !== curr.field_type}>
            {({ getFieldValue }) =>
              getFieldValue('field_type') === 'select' ? (
                <Form.Item
                  name="options"
                  label="选项"
                  rules={[{ required: true, message: '请输入选项' }]}
                  extra="多个选项用逗号分隔"
                >
                  <Input placeholder="如: A型,B型,O型,AB型" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_required" label="是否必填" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CustomFieldManager;
