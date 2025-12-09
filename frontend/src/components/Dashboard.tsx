import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Spin, Avatar, Progress } from 'antd';
import { UserOutlined, TeamOutlined, GiftOutlined, HeartOutlined, StarOutlined, PushpinOutlined } from '@ant-design/icons';
import { Statistics, Contact, TYPE_COLORS } from '../types';
import * as api from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return <div>加载失败</div>;
  }

  const totalByType = stats.typeStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="联系人总数"
              value={stats.totalContacts}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="收藏联系人"
              value={stats.favoriteCount || 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="近期生日"
              value={stats.upcomingBirthdays.length}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="亲密关系"
              value={stats.relationshipStats.find(r => r.relationship_level === '亲密')?.count || 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="类型分布" size="small">
            {stats.typeStats.map(item => (
              <div key={item.type} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tag color={TYPE_COLORS[item.type]}>{item.type}</Tag>
                  <span>{item.count} 人 ({totalByType > 0 ? Math.round(item.count / totalByType * 100) : 0}%)</span>
                </div>
                <Progress
                  percent={totalByType > 0 ? Math.round(item.count / totalByType * 100) : 0}
                  strokeColor={TYPE_COLORS[item.type] === 'default' ? '#d9d9d9' : TYPE_COLORS[item.type]}
                  showInfo={false}
                  size="small"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="关系等级分布" size="small">
            {stats.relationshipStats.map(item => {
              const color = item.relationship_level === '亲密' ? '#f5222d' :
                item.relationship_level === '熟悉' ? '#fa8c16' :
                item.relationship_level === '一般' ? '#1890ff' : '#d9d9d9';
              return (
                <div key={item.relationship_level} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Tag color={color}>{item.relationship_level}</Tag>
                    <span>{item.count} 人</span>
                  </div>
                  <Progress
                    percent={stats.totalContacts > 0 ? Math.round(item.count / stats.totalContacts * 100) : 0}
                    strokeColor={color}
                    showInfo={false}
                    size="small"
                  />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>

      {stats.groupStats && stats.groupStats.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="分组统计" size="small">
              <Row gutter={[16, 16]}>
                {stats.groupStats.map((group, index) => (
                  <Col xs={12} sm={8} md={6} lg={4} key={index}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: group.color || '#1890ff',
                          margin: '0 auto 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                        }}
                      >
                        {group.count}
                      </div>
                      <div>{group.name}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<><GiftOutlined /> 近期生日提醒</>} size="small">
            {stats.upcomingBirthdays.length > 0 ? (
              <List
                dataSource={stats.upcomingBirthdays}
                renderItem={(item: Contact) => {
                  const birthday = new Date(item.birthday!);
                  const today = new Date();
                  const thisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
                  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
                  const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={item.avatar}
                            icon={!item.avatar && <UserOutlined />}
                            style={{ backgroundColor: TYPE_COLORS[item.type] === 'default' ? '#87d068' : TYPE_COLORS[item.type] }}
                          />
                        }
                        title={
                          <span>
                            {item.name}
                            {daysUntil === 0 && <Tag color="red" style={{ marginLeft: 8 }}>今天</Tag>}
                            {daysUntil > 0 && daysUntil <= 3 && <Tag color="orange" style={{ marginLeft: 8 }}>{daysUntil}天后</Tag>}
                          </span>
                        }
                        description={
                          <span>
                            生日: {item.birthday}
                            <Tag color={TYPE_COLORS[item.type]} style={{ marginLeft: 8 }}>{item.type}</Tag>
                          </span>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                近7天内没有生日提醒
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近添加的联系人" size="small">
            {stats.recentContacts.length > 0 ? (
              <List
                dataSource={stats.recentContacts}
                renderItem={(item: Contact) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={item.avatar}
                          icon={!item.avatar && <UserOutlined />}
                          style={{ backgroundColor: TYPE_COLORS[item.type] === 'default' ? '#87d068' : TYPE_COLORS[item.type] }}
                        />
                      }
                      title={
                        <span>
                          {item.name}
                          {item.is_favorite ? <StarOutlined style={{ color: '#faad14', marginLeft: 8 }} /> : null}
                          {item.is_pinned ? <PushpinOutlined style={{ color: '#1890ff', marginLeft: 4 }} /> : null}
                        </span>
                      }
                      description={
                        <span>
                          {item.company && `${item.company} `}
                          {item.position && `- ${item.position}`}
                          <Tag color={TYPE_COLORS[item.type]} style={{ marginLeft: 8 }}>{item.type}</Tag>
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无联系人
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
