import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Tag, Space, Upload, Avatar, message } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Contact, ContactGroup, CONTACT_TYPES, RELATIONSHIP_LEVELS, GENDERS } from '../types';
import * as api from '../services/api';

const { TextArea } = Input;

interface ContactFormProps {
  initialValues?: Contact;
  onSubmit: (values: Omit<Contact, 'id'>) => void;
  onCancel?: () => void;
  loading?: boolean;
  groups?: ContactGroup[];
}

const ContactForm: React.FC<ContactFormProps> = ({ initialValues, onSubmit, onCancel, loading, groups = [] }) => {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        birthday: initialValues.birthday ? dayjs(initialValues.birthday) : null,
      });
      setTags(initialValues.tags?.split(',').filter(Boolean) || []);
      setAvatar(initialValues.avatar);
    } else {
      form.resetFields();
      setTags([]);
      setAvatar(undefined);
    }
  }, [initialValues, form]);

  const handleTagClose = (removedTag: string) => {
    setTags(tags.filter(tag => tag !== removedTag));
  };

  const handleTagAdd = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!initialValues?.id) {
      message.warning('请先保存联系人后再上传头像');
      return false;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.uploadAvatar(initialValues.id, formData);
      setAvatar(res.avatar);
      message.success('头像上传成功');
    } catch {
      message.error('头像上传失败');
    }
    return false;
  };

  const handleSubmit = (values: any) => {
    const formData = {
      ...values,
      birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      tags: tags.join(','),
      avatar: avatar,
    };
    onSubmit(formData);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Row gutter={16}>
        <Col span={4}>
          <Form.Item label="头像">
            <Upload
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
              accept="image/*"
            >
              <Avatar
                size={80}
                src={avatar}
                icon={!avatar && <UserOutlined />}
                style={{ cursor: 'pointer' }}
              />
              {initialValues?.id && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>点击上传</div>
              )}
            </Upload>
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择联系人类型">
              {CONTACT_TYPES.map(type => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item label="性别" name="gender">
            <Select placeholder="选择性别">
              {GENDERS.map(gender => (
                <Select.Option key={gender} value={gender}>{gender}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="生日" name="birthday">
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} placeholder="选择生日" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="关系等级" name="relationship_level">
            <Select placeholder="选择关系等级">
              {RELATIONSHIP_LEVELS.map(level => (
                <Select.Option key={level} value={level}>{level}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="分组" name="group_id">
            <Select placeholder="选择分组" allowClear>
              {groups.map(group => (
                <Select.Option key={group.id} value={group.id!}>
                  <Space>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: group.color || '#1890ff',
                        display: 'inline-block',
                      }}
                    />
                    {group.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="标签">
        <div style={{ marginBottom: 8 }}>
          {tags.map(tag => (
            <Tag key={tag} closable onClose={() => handleTagClose(tag)} color="blue">
              {tag}
            </Tag>
          ))}
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onPressEnter={(e) => {
              e.preventDefault();
              handleTagAdd();
            }}
            placeholder="输入标签后按回车添加"
            style={{ width: 'calc(100% - 80px)' }}
          />
          <Button onClick={handleTagAdd} icon={<PlusOutlined />}>添加</Button>
        </Space.Compact>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="电话" name="phone">
            <Input placeholder="电话号码" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="微信" name="wechat">
            <Input placeholder="微信号" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="邮箱地址" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="QQ" name="qq">
            <Input placeholder="QQ号码" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="公司/单位" name="company">
            <Input placeholder="工作单位" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="职位" name="position">
            <Input placeholder="职位" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="地址" name="address">
        <Input placeholder="联系地址" />
      </Form.Item>

      <Form.Item label="籍贯" name="hometown">
        <Input placeholder="籍贯/家乡" />
      </Form.Item>

      <Form.Item label="备注" name="notes">
        <TextArea rows={3} placeholder="其他备注信息" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? '更新联系人' : '创建联系人'}
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>取消</Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ContactForm;
