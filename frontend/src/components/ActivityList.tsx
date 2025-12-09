import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, Tag, message, Card, Row, Col, Upload, Image, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, PictureOutlined, UploadOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Activity, Contact, ACTIVITY_TYPES, ACTIVITY_TYPE_COLORS } from '../types';
import * as api from '../services/api';

const { TextArea } = Input;

const ActivityList: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadActivities();
    loadContacts();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.getActivities();
      setActivities(data.data || data);
    } catch {
      message.error('加载活动失败');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await api.getContacts({ limit: 1000 });
      setContacts(data.data || []);
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        activity_date: values.activity_date.format('YYYY-MM-DD'),
      };
      if (selectedActivity) {
        await api.updateActivity(selectedActivity.id!, data);
        message.success('更新成功');
      } else {
        await api.createActivity(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setSelectedActivity(null);
      loadActivities();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteActivity(id);
      message.success('删除成功');
      loadActivities();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAddParticipants = async (contactIds: number[]) => {
    if (!selectedActivity) return;
    try {
      await api.addActivityParticipants(selectedActivity.id!, contactIds);
      message.success('添加参与者成功');
      setParticipantModalVisible(false);
      loadActivities();
    } catch {
      message.error('添加参与者失败');
    }
  };

  const handleRemoveParticipant = async (contactId: number) => {
    if (!selectedActivity) return;
    try {
      await api.removeActivityParticipant(selectedActivity.id!, contactId);
      message.success('移除成功');
      loadActivities();
    } catch {
      message.error('移除失败');
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!selectedActivity) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      await api.uploadActivityPhoto(selectedActivity.id!, formData);
      message.success('上传成功');
      loadActivities();
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!selectedActivity) return;
    try {
      await api.deleteActivityPhoto(selectedActivity.id!, photoId);
      message.success('删除成功');
      loadActivities();
    } catch {
      message.error('删除失败');
    }
  };

  const showDetail = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Activity) => (
        <Button type="link" onClick={() => showDetail(record)}>{text}</Button>
      ),
    },
    {
      title: '类型',
      dataIndex: 'activity_type',
      key: 'activity_type',
      render: (type: string) => (
        <Tag color={ACTIVITY_TYPE_COLORS[type] || 'default'}>{type}</Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'activity_date',
      key: 'activity_date',
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '参与人数',
      key: 'participants',
      render: (_: any, record: Activity) => (
        <Space>
          <TeamOutlined />
          {record.participants?.length || 0} 人
        </Space>
      ),
    },
    {
      title: '照片',
      key: 'photos',
      render: (_: any, record: Activity) => (
        <Space>
          <PictureOutlined />
          {record.photos?.length || 0} 张
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Activity) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => {
              setSelectedActivity(record);
              form.setFieldsValue({
                ...record,
                activity_date: dayjs(record.activity_date),
              });
              setModalVisible(true);
            }} />
          </Tooltip>
          <Tooltip title="添加参与者">
            <Button type="text" icon={<UserOutlined />} onClick={() => {
              setSelectedActivity(record);
              setParticipantModalVisible(true);
            }} />
          </Tooltip>
          <Tooltip title="上传照片">
            <Button type="text" icon={<PictureOutlined />} onClick={() => {
              setSelectedActivity(record);
              setPhotoModalVisible(true);
            }} />
          </Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id!)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setSelectedActivity(null);
          form.resetFields();
          setModalVisible(true);
        }}>
          新建活动
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={activities}
        rowKey="id"
        loading={loading}
      />

      {/* Activity Form Modal */}
      <Modal
        title={selectedActivity ? '编辑活动' : '新建活动'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedActivity(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="活动名称" name="title" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input placeholder="活动名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="活动类型" name="activity_type" rules={[{ required: true, message: '请选择活动类型' }]}>
                <Select placeholder="选择类型">
                  {ACTIVITY_TYPES.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="活动日期" name="activity_date" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="地点" name="location">
            <Input placeholder="活动地点" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="活动描述" />
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <TextArea rows={2} placeholder="备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Participants Modal */}
      <Modal
        title="添加参与者"
        open={participantModalVisible}
        onCancel={() => setParticipantModalVisible(false)}
        footer={null}
        width={500}
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择参与者"
          onChange={(values: number[]) => handleAddParticipants(values)}
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {contacts.map(c => (
            <Select.Option key={c.id} value={c.id!}>{c.name}</Select.Option>
          ))}
        </Select>
        {selectedActivity?.participants && selectedActivity.participants.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>当前参与者：</div>
            {selectedActivity.participants.map(p => (
              <Tag
                key={p.contact_id}
                closable
                onClose={() => handleRemoveParticipant(p.contact_id)}
                style={{ marginBottom: 8 }}
              >
                {p.contact_name}
              </Tag>
            ))}
          </div>
        )}
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        title="活动照片"
        open={photoModalVisible}
        onCancel={() => setPhotoModalVisible(false)}
        footer={null}
        width={700}
      >
        <Upload
          beforeUpload={handleUploadPhoto}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />}>上传照片</Button>
        </Upload>
        <div style={{ marginTop: 16 }}>
          <Image.PreviewGroup>
            <Row gutter={[8, 8]}>
              {selectedActivity?.photos?.map(photo => (
                <Col span={8} key={photo.id}>
                  <div style={{ position: 'relative' }}>
                    <Image
                      src={`/uploads/activities/${photo.filename}`}
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(255,255,255,0.8)' }}
                      onClick={() => handleDeletePhoto(photo.id!)}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Image.PreviewGroup>
        </div>
      </Modal>

      {/* Activity Detail Modal */}
      <Modal
        title="活动详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedActivity && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <h3>{selectedActivity.title}</h3>
              <p><Tag color={ACTIVITY_TYPE_COLORS[selectedActivity.activity_type]}>{selectedActivity.activity_type}</Tag></p>
              <p><strong>日期:</strong> {selectedActivity.activity_date}</p>
              <p><strong>地点:</strong> {selectedActivity.location || '-'}</p>
              <p><strong>描述:</strong> {selectedActivity.description || '-'}</p>
              <p><strong>备注:</strong> {selectedActivity.notes || '-'}</p>
            </Card>

            <Card title="参与者" size="small" style={{ marginBottom: 16 }}>
              {selectedActivity.participants && selectedActivity.participants.length > 0 ? (
                <Space wrap>
                  {selectedActivity.participants.map(p => (
                    <Tag key={p.contact_id} icon={<UserOutlined />}>{p.contact_name}</Tag>
                  ))}
                </Space>
              ) : (
                <span style={{ color: '#999' }}>暂无参与者</span>
              )}
            </Card>

            <Card title="照片" size="small">
              {selectedActivity.photos && selectedActivity.photos.length > 0 ? (
                <Image.PreviewGroup>
                  <Row gutter={[8, 8]}>
                    {selectedActivity.photos.map(photo => (
                      <Col span={6} key={photo.id}>
                        <Image
                          src={`/uploads/activities/${photo.filename}`}
                          style={{ width: '100%', height: 120, objectFit: 'cover' }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              ) : (
                <span style={{ color: '#999' }}>暂无照片</span>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActivityList;
