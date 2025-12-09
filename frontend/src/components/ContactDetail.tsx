import React, { useState, useEffect } from 'react';
import { Descriptions, Tag, Tabs, List, Button, Modal, Form, Input, DatePicker, Select, Space, message, Empty, Upload, Image, Row, Col, Avatar, InputNumber, Timeline, Card } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, GiftOutlined, CalendarOutlined, UserOutlined, PictureOutlined, UploadOutlined, SendOutlined, InboxOutlined, HistoryOutlined, PhoneOutlined, BulbOutlined, ShareAltOutlined, SwapOutlined } from '@ant-design/icons';
import { Contact, ContactDetail as ContactDetailType, SocialInteraction, ImportantDate, ContactPhoto, Gift, TYPE_COLORS, RELATIONSHIP_COLORS } from '../types';
import * as api from '../services/api';

const { TextArea } = Input;

interface Props {
  contact: Contact;
  onEdit: () => void;
  onRefresh?: () => void;
}

const ContactDetail: React.FC<Props> = ({ contact, onEdit, onRefresh }) => {
  const [details, setDetails] = useState<ContactDetailType[]>([]);
  const [interactions, setInteractions] = useState<SocialInteraction[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [photos, setPhotos] = useState<ContactPhoto[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [giftRecommendations, setGiftRecommendations] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [interactionModalVisible, setInteractionModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [commModalVisible, setCommModalVisible] = useState(false);
  const [detailForm] = Form.useForm();
  const [interactionForm] = Form.useForm();
  const [dateForm] = Form.useForm();
  const [giftForm] = Form.useForm();
  const [commForm] = Form.useForm();

  useEffect(() => {
    if (contact.id) {
      loadData();
    }
  }, [contact.id]);

  const loadData = async () => {
    if (!contact.id) return;
    try {
      const [detailsRes, interactionsRes, datesRes, photosRes, giftsRes, timelineRes, commsRes, relsRes, loansRes, recsRes] = await Promise.all([
        api.getContactDetails(contact.id),
        api.getInteractions(contact.id),
        api.getImportantDates(contact.id),
        api.getContactPhotos(contact.id),
        api.getContactGifts(contact.id),
        api.getContactTimeline(contact.id).catch(() => []),
        api.getContactCommunications(contact.id).catch(() => []),
        api.getContactRelationships(contact.id).catch(() => []),
        api.getContactLoans(contact.id).catch(() => []),
        api.getGiftRecommendations(contact.id).catch(() => []),
      ]);
      setDetails(detailsRes);
      setInteractions(interactionsRes);
      setImportantDates(datesRes);
      setPhotos(photosRes);
      setGifts(giftsRes);
      setTimeline(timelineRes);
      setCommunications(commsRes);
      setRelationships(relsRes);
      setLoans(loansRes);
      setGiftRecommendations(recsRes);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const handleAddDetail = async (values: any) => {
    try {
      await api.addContactDetail(contact.id!, values);
      message.success('添加成功');
      setDetailModalVisible(false);
      detailForm.resetFields();
      loadData();
    } catch {
      message.error('添加失败');
    }
  };

  const handleDeleteDetail = async (id: number) => {
    try {
      await api.deleteContactDetail(contact.id!, id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAddInteraction = async (values: any) => {
    try {
      await api.addInteraction(contact.id!, {
        ...values,
        interaction_date: values.interaction_date.format('YYYY-MM-DD'),
      });
      message.success('添加成功');
      setInteractionModalVisible(false);
      interactionForm.resetFields();
      loadData();
      onRefresh?.();
    } catch {
      message.error('添加失败');
    }
  };

  const handleDeleteInteraction = async (id: number) => {
    try {
      await api.deleteInteraction(contact.id!, id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAddDate = async (values: any) => {
    try {
      await api.addImportantDate(contact.id!, {
        ...values,
        date_value: values.date_value.format('YYYY-MM-DD'),
      });
      message.success('添加成功');
      setDateModalVisible(false);
      dateForm.resetFields();
      loadData();
    } catch {
      message.error('添加失败');
    }
  };

  const handleDeleteDate = async (id: number) => {
    try {
      await api.deleteImportantDate(contact.id!, id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleUploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    try {
      await api.uploadContactPhoto(contact.id!, formData);
      message.success('上传成功');
      loadData();
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await api.deleteContactPhoto(contact.id!, photoId);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAddGift = async (values: any) => {
    try {
      await api.addGift({
        ...values,
        contact_id: contact.id,
        gift_date: values.gift_date.format('YYYY-MM-DD'),
      });
      message.success('添加成功');
      setGiftModalVisible(false);
      giftForm.resetFields();
      loadData();
    } catch {
      message.error('添加失败');
    }
  };

  const handleDeleteGift = async (id: number) => {
    try {
      await api.deleteGift(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleAddCommunication = async (values: any) => {
    try {
      await api.addCommunication({
        ...values,
        contact_id: contact.id,
        comm_date: values.comm_date.format('YYYY-MM-DD'),
      });
      message.success('添加成功');
      setCommModalVisible(false);
      commForm.resetFields();
      loadData();
    } catch {
      message.error('添加失败');
    }
  };

  const handleDeleteCommunication = async (id: number) => {
    try {
      await api.deleteCommunication(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'interaction': return <CalendarOutlined style={{ color: '#1890ff' }} />;
      case 'gift': return <GiftOutlined style={{ color: '#52c41a' }} />;
      case 'loan': return <SwapOutlined style={{ color: '#fa8c16' }} />;
      case 'communication': return <PhoneOutlined style={{ color: '#722ed1' }} />;
      default: return <HistoryOutlined />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'interaction': return 'blue';
      case 'gift': return 'green';
      case 'loan': return 'orange';
      case 'communication': return 'purple';
      default: return 'gray';
    }
  };

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span><UserOutlined />基本信息</span>
      ),
      children: (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="姓名">
            <Space>
              <Avatar src={contact.avatar} icon={!contact.avatar && <UserOutlined />} />
              {contact.name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag color={TYPE_COLORS[contact.type]}>{contact.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="性别">{contact.gender || '-'}</Descriptions.Item>
          <Descriptions.Item label="生日">{contact.birthday || '-'}</Descriptions.Item>
          <Descriptions.Item label="关系等级">
            {contact.relationship_level ? (
              <Tag color={RELATIONSHIP_COLORS[contact.relationship_level]}>{contact.relationship_level}</Tag>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="电话">{contact.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="微信">{contact.wechat || '-'}</Descriptions.Item>
          <Descriptions.Item label="QQ">{contact.qq || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱" span={2}>{contact.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="公司/单位">{contact.company || '-'}</Descriptions.Item>
          <Descriptions.Item label="职位">{contact.position || '-'}</Descriptions.Item>
          <Descriptions.Item label="地址" span={2}>{contact.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="籍贯">{contact.hometown || '-'}</Descriptions.Item>
          <Descriptions.Item label="标签">
            {contact.tags?.split(',').filter(Boolean).map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            )) || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{contact.notes || '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'details',
      label: '详细信息',
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDetailModalVisible(true)} style={{ marginBottom: 16 }}>
            添加信息
          </Button>
          {details.length > 0 ? (
            <List
              dataSource={details}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDetail(item.id!)} />
                  ]}
                >
                  <List.Item.Meta
                    title={<Tag color="purple">{item.category}</Tag>}
                    description={item.content}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无详细信息" />
          )}
        </>
      ),
    },
    {
      key: 'interactions',
      label: (
        <span><CalendarOutlined />互动记录</span>
      ),
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInteractionModalVisible(true)} style={{ marginBottom: 16 }}>
            添加互动
          </Button>
          {interactions.length > 0 ? (
            <List
              dataSource={interactions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteInteraction(item.id!)} />
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.interaction_date}</span>
                        {item.interaction_type && <Tag color="green">{item.interaction_type}</Tag>}
                        {item.location && <Tag color="blue">{item.location}</Tag>}
                      </Space>
                    }
                    description={item.notes}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无互动记录" />
          )}
        </>
      ),
    },
    {
      key: 'dates',
      label: (
        <span><CalendarOutlined />重要日期</span>
      ),
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDateModalVisible(true)} style={{ marginBottom: 16 }}>
            添加日期
          </Button>
          {importantDates.length > 0 ? (
            <List
              dataSource={importantDates}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDate(item.id!)} />
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="red">{item.date_name}</Tag>
                        <span>{item.date_value}</span>
                        <Tag color="orange">提前{item.remind_before_days}天提醒</Tag>
                      </Space>
                    }
                    description={item.notes}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无重要日期" />
          )}
        </>
      ),
    },
    {
      key: 'photos',
      label: (
        <span><PictureOutlined />照片相册 ({photos.length})</span>
      ),
      children: (
        <>
          <Upload
            beforeUpload={handleUploadPhoto}
            showUploadList={false}
            accept="image/*"
          >
            <Button type="primary" icon={<UploadOutlined />} style={{ marginBottom: 16 }}>
              上传照片
            </Button>
          </Upload>
          {photos.length > 0 ? (
            <Image.PreviewGroup>
              <Row gutter={[16, 16]}>
                {photos.map(photo => (
                  <Col span={6} key={photo.id}>
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={`/uploads/photos/${photo.filename}`}
                        style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(255,255,255,0.8)' }}
                        onClick={() => handleDeletePhoto(photo.id!)}
                      />
                    </div>
                    {photo.description && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{photo.description}</div>}
                  </Col>
                ))}
              </Row>
            </Image.PreviewGroup>
          ) : (
            <Empty description="暂无照片" />
          )}
        </>
      ),
    },
    {
      key: 'gifts',
      label: (
        <span><GiftOutlined />礼物记录 ({gifts.length})</span>
      ),
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setGiftModalVisible(true)} style={{ marginBottom: 16 }}>
            添加礼物
          </Button>
          {gifts.length > 0 ? (
            <List
              dataSource={gifts}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteGift(item.id!)} />
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.gift_type === 'sent' ? <SendOutlined style={{ color: '#1890ff', fontSize: 24 }} /> : <InboxOutlined style={{ color: '#52c41a', fontSize: 24 }} />}
                    title={
                      <Space>
                        <span>{item.gift_name}</span>
                        <Tag color={item.gift_type === 'sent' ? 'blue' : 'green'}>
                          {item.gift_type === 'sent' ? '送出' : '收到'}
                        </Tag>
                        {item.value && <Tag color="orange">¥{item.value}</Tag>}
                      </Space>
                    }
                    description={
                      <Space>
                        <span>{item.gift_date}</span>
                        {item.occasion && <Tag>{item.occasion}</Tag>}
                        {item.notes && <span style={{ color: '#999' }}>{item.notes}</span>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无礼物记录" />
          )}
        </>
      ),
    },
    {
      key: 'timeline',
      label: (
        <span><HistoryOutlined />时间线</span>
      ),
      children: (
        <>
          {timeline.length > 0 ? (
            <Timeline
              items={timeline.slice(0, 20).map((item: any) => ({
                dot: getTimelineIcon(item.type),
                color: getTimelineColor(item.type),
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {item.date?.slice(0, 10)}
                      <Tag style={{ marginLeft: 8 }}>{item.type === 'interaction' ? '互动' : item.type === 'gift' ? '礼物' : item.type === 'loan' ? '借还' : '通讯'}</Tag>
                      {item.subtype && <Tag color="blue">{item.subtype}</Tag>}
                    </div>
                    <div style={{ color: '#666' }}>{item.content}</div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无时间线数据" />
          )}
        </>
      ),
    },
    {
      key: 'communications',
      label: (
        <span><PhoneOutlined />通讯记录 ({communications.length})</span>
      ),
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCommModalVisible(true)} style={{ marginBottom: 16 }}>
            添加记录
          </Button>
          {communications.length > 0 ? (
            <List
              dataSource={communications}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCommunication(item.id)} />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<PhoneOutlined style={{ fontSize: 24, color: item.comm_type === '电话' ? '#1890ff' : '#52c41a' }} />}
                    title={
                      <Space>
                        <span>{item.comm_date?.slice(0, 10)}</span>
                        <Tag color={item.comm_type === '电话' ? 'blue' : item.comm_type === '微信' ? 'green' : 'purple'}>{item.comm_type}</Tag>
                        {item.duration && <Tag>时长: {item.duration}分钟</Tag>}
                        {item.mood && <Tag color={item.mood === '愉快' ? 'green' : item.mood === '一般' ? 'default' : 'red'}>{item.mood}</Tag>}
                      </Space>
                    }
                    description={
                      <>
                        {item.summary && <div>{item.summary}</div>}
                        {item.important_points && <div style={{ color: '#f5222d' }}>重点: {item.important_points}</div>}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无通讯记录" />
          )}
        </>
      ),
    },
    {
      key: 'loans',
      label: (
        <span><SwapOutlined />借还记录 ({loans.length})</span>
      ),
      children: (
        <>
          {loans.length > 0 ? (
            <List
              dataSource={loans}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={item.loan_type === 'lent' ? 'orange' : 'blue'}>
                          {item.loan_type === 'lent' ? '借出' : '借入'}
                        </Tag>
                        <span>{item.item_name}</span>
                        {item.amount && <span style={{ color: '#f5222d' }}>¥{item.amount}</span>}
                      </Space>
                    }
                    description={
                      <Space>
                        <span>日期: {item.loan_date?.slice(0, 10)}</span>
                        <Tag color={item.status === 'returned' ? 'green' : 'gold'}>
                          {item.status === 'returned' ? '已归还' : '待归还'}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无借还记录" />
          )}
        </>
      ),
    },
    {
      key: 'relationships',
      label: (
        <span><ShareAltOutlined />人际关系 ({relationships.length})</span>
      ),
      children: (
        <>
          {relationships.length > 0 ? (
            <List
              dataSource={relationships}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <span>{item.contact_id_1 === contact.id ? item.contact_name_2 : item.contact_name_1}</span>
                        <Tag color="purple">{item.relationship_type}</Tag>
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无关联关系" />
          )}
        </>
      ),
    },
    {
      key: 'recommendations',
      label: (
        <span><BulbOutlined />送礼推荐</span>
      ),
      children: (
        <>
          {giftRecommendations.length > 0 ? (
            <Row gutter={[16, 16]}>
              {giftRecommendations.map((rec: any, index: number) => (
                <Col xs={24} sm={12} key={index}>
                  <Card size="small" title={rec.category}>
                    <div style={{ color: '#999', marginBottom: 8 }}>推荐理由: {rec.reason}</div>
                    <div>
                      {rec.suggestions?.map((s: string, i: number) => (
                        <Tag key={i} color="blue" style={{ marginBottom: 4 }}>{s}</Tag>
                      ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无推荐（添加更多联系人信息可获得推荐）" />
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
          编辑联系人
        </Button>
      </div>

      <Tabs items={tabItems} />

      <Modal title="添加详细信息" open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} footer={null}>
        <Form form={detailForm} layout="vertical" onFinish={handleAddDetail}>
          <Form.Item label="类别" name="category" rules={[{ required: true, message: '请选择或输入类别' }]}>
            <Select mode="tags" placeholder="如：爱好、习惯、禁忌等">
              <Select.Option value="爱好">爱好</Select.Option>
              <Select.Option value="习惯">习惯</Select.Option>
              <Select.Option value="禁忌">禁忌</Select.Option>
              <Select.Option value="特长">特长</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={3} placeholder="输入详细内容" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setDetailModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加互动记录" open={interactionModalVisible} onCancel={() => setInteractionModalVisible(false)} footer={null}>
        <Form form={interactionForm} layout="vertical" onFinish={handleAddInteraction}>
          <Form.Item label="日期" name="interaction_date" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="类型" name="interaction_type">
            <Select placeholder="选择互动类型">
              <Select.Option value="聚餐">聚餐</Select.Option>
              <Select.Option value="会议">会议</Select.Option>
              <Select.Option value="礼物">礼物</Select.Option>
              <Select.Option value="电话">电话</Select.Option>
              <Select.Option value="拜访">拜访</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="地点" name="location">
            <Input placeholder="互动地点" />
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="互动详情" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setInteractionModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加重要日期" open={dateModalVisible} onCancel={() => setDateModalVisible(false)} footer={null}>
        <Form form={dateForm} layout="vertical" onFinish={handleAddDate} initialValues={{ remind_before_days: 7 }}>
          <Form.Item label="名称" name="date_name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：结婚纪念日" />
          </Form.Item>
          <Form.Item label="日期" name="date_value" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="提前提醒天数" name="remind_before_days">
            <Select>
              <Select.Option value={1}>1天</Select.Option>
              <Select.Option value={3}>3天</Select.Option>
              <Select.Option value={7}>7天</Select.Option>
              <Select.Option value={14}>14天</Select.Option>
              <Select.Option value={30}>30天</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setDateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加礼物记录" open={giftModalVisible} onCancel={() => setGiftModalVisible(false)} footer={null}>
        <Form form={giftForm} layout="vertical" onFinish={handleAddGift}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="礼物名称" name="gift_name" rules={[{ required: true, message: '请输入礼物名称' }]}>
                <Input placeholder="礼物名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="类型" name="gift_type" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="选择类型">
                  <Select.Option value="sent">送出</Select.Option>
                  <Select.Option value="received">收到</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="日期" name="gift_date" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="场合" name="occasion">
                <Select placeholder="选择场合" allowClear>
                  <Select.Option value="生日">生日</Select.Option>
                  <Select.Option value="节日">节日</Select.Option>
                  <Select.Option value="纪念日">纪念日</Select.Option>
                  <Select.Option value="拜访">拜访</Select.Option>
                  <Select.Option value="感谢">感谢</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="价值" name="value">
            <InputNumber style={{ width: '100%' }} placeholder="价值(元)" min={0} />
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <TextArea rows={2} placeholder="备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setGiftModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加通讯记录" open={commModalVisible} onCancel={() => setCommModalVisible(false)} footer={null}>
        <Form form={commForm} layout="vertical" onFinish={handleAddCommunication}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="日期" name="comm_date" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="类型" name="comm_type" rules={[{ required: true }]}>
                <Select placeholder="选择通讯类型">
                  <Select.Option value="电话">电话</Select.Option>
                  <Select.Option value="微信">微信</Select.Option>
                  <Select.Option value="短信">短信</Select.Option>
                  <Select.Option value="QQ">QQ</Select.Option>
                  <Select.Option value="邮件">邮件</Select.Option>
                  <Select.Option value="视频">视频</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="时长(分钟)" name="duration">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="通话时长" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="氛围" name="mood">
                <Select placeholder="选择氛围" allowClear>
                  <Select.Option value="愉快">愉快</Select.Option>
                  <Select.Option value="一般">一般</Select.Option>
                  <Select.Option value="紧张">紧张</Select.Option>
                  <Select.Option value="不愉快">不愉快</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="内容摘要" name="summary">
            <TextArea rows={2} placeholder="通讯主要内容" />
          </Form.Item>
          <Form.Item label="重要事项" name="important_points">
            <TextArea rows={2} placeholder="需要记住的重要信息" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setCommModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContactDetail;
