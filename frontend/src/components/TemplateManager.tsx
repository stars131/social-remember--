import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, message, Popconfirm, Space, Tabs, Typography, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SendOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const { TextArea } = Input;
const { Paragraph } = Typography;

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [useModalVisible, setUseModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [form] = Form.useForm();
  const [useForm] = Form.useForm();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch {
      message.error('加载模板失败');
    }
    setLoading(false);
  };

  const handleSave = async (values: any) => {
    try {
      const variables = values.content.match(/\{(\w+)\}/g)?.map((v: string) => v.slice(1, -1)) || [];
      const data = { ...values, variables };

      if (editingTemplate) {
        await api.updateTemplate(editingTemplate.id, data);
        message.success('更新成功');
      } else {
        await api.addTemplate(data);
        message.success('添加成功');
      }
      setModalVisible(false);
      setEditingTemplate(null);
      form.resetFields();
      loadTemplates();
    } catch (e: any) {
      message.error(e.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTemplate(id);
      message.success('删除成功');
      loadTemplates();
    } catch {
      message.error('删除失败');
    }
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setGeneratedMessage('');
    useForm.resetFields();
    setUseModalVisible(true);
  };

  const handleGenerateMessage = async (values: any) => {
    try {
      const result = await api.generateMessage(selectedTemplate.id, values);
      setGeneratedMessage(result.message);
    } catch {
      message.error('生成失败');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    message.success('已复制到剪贴板');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '生日祝福': 'magenta',
      '节日问候': 'red',
      '商务': 'blue',
      '感谢': 'green',
      '邀请': 'orange',
      '其他': 'default',
    };
    return colors[category] || 'default';
  };

  const getFilteredTemplates = () => {
    if (activeCategory === 'all') return templates;
    return templates.filter(t => t.category === activeCategory);
  };

  const categories = ['all', '生日祝福', '节日问候', '商务', '感谢', '邀请', '其他'];

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color={getCategoryColor(cat)}>{cat}</Tag>
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <span style={{ color: '#666' }}>{content.length > 50 ? content.slice(0, 50) + '...' : content}</span>
      )
    },
    {
      title: '变量',
      dataIndex: 'variables',
      key: 'variables',
      render: (vars: string) => {
        const parsed = typeof vars === 'string' ? JSON.parse(vars || '[]') : vars || [];
        return parsed.map((v: string) => <Tag key={v}>{`{${v}}`}</Tag>);
      }
    },
    { title: '使用次数', dataIndex: 'usage_count', key: 'usage_count' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<SendOutlined />} onClick={() => handleUseTemplate(record)}>使用</Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTemplate(record);
              form.setFieldsValue(record);
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
      <Card
        title="消息模板管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTemplate(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            添加模板
          </Button>
        }
      >
        <Tabs
          activeKey={activeCategory}
          onChange={setActiveCategory}
          items={categories.map(cat => ({
            key: cat,
            label: cat === 'all' ? '全部' : cat
          }))}
        />
        <Table
          dataSource={getFilteredTemplates()}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑模板' : '添加模板'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingTemplate(null); form.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="如: 生日快乐" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="生日祝福">生日祝福</Select.Option>
              <Select.Option value="节日问候">节日问候</Select.Option>
              <Select.Option value="商务">商务</Select.Option>
              <Select.Option value="感谢">感谢</Select.Option>
              <Select.Option value="邀请">邀请</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
            extra="使用 {变量名} 表示可替换的变量，如 {name}、{date} 等"
          >
            <TextArea rows={4} placeholder="亲爱的{name}，祝你生日快乐！愿你的每一天都充满阳光和欢笑。" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`使用模板: ${selectedTemplate?.name}`}
        open={useModalVisible}
        onCancel={() => { setUseModalVisible(false); setSelectedTemplate(null); setGeneratedMessage(''); }}
        footer={null}
        width={600}
      >
        {selectedTemplate && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <strong>模板内容:</strong>
              <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{selectedTemplate.content}</Paragraph>
            </div>

            <Form form={useForm} onFinish={handleGenerateMessage} layout="vertical">
              {(() => {
                const vars = typeof selectedTemplate.variables === 'string'
                  ? JSON.parse(selectedTemplate.variables || '[]')
                  : selectedTemplate.variables || [];
                return vars.map((v: string) => (
                  <Form.Item key={v} name={v} label={`变量: {${v}}`} rules={[{ required: true }]}>
                    <Input placeholder={`请输入 ${v} 的值`} />
                  </Form.Item>
                ));
              })()}
              <Form.Item>
                <Button type="primary" htmlType="submit" block>生成消息</Button>
              </Form.Item>
            </Form>

            {generatedMessage && (
              <>
                <Divider />
                <div style={{ marginBottom: 8 }}><strong>生成的消息:</strong></div>
                <div style={{ padding: 16, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
                  <Paragraph copyable style={{ marginBottom: 0 }}>{generatedMessage}</Paragraph>
                </div>
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={copyToClipboard}
                  style={{ marginTop: 16 }}
                  block
                >
                  复制到剪贴板
                </Button>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default TemplateManager;
