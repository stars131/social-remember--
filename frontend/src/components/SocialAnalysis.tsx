import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Statistic, Table, Tag, Progress, List, Avatar, Empty } from 'antd';
import { TeamOutlined, HeartOutlined, FireOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const SocialAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [socialData, setSocialData] = useState<any>(null);
  const [frequencyData, setFrequencyData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [social, frequency] = await Promise.all([
        api.getSocialCircleAnalysis(),
        api.getContactFrequencyReport()
      ]);
      setSocialData(social);
      setFrequencyData(frequency);
    } catch {
      // Handle error
    }
    setLoading(false);
  };

  if (loading) {
    return <Card><Spin tip="加载分析数据..." /></Card>;
  }

  const typeColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '数量', dataIndex: 'count', key: 'count' },
    { title: '占比', key: 'percent', render: (_: any, r: any) => (
      <Progress percent={Math.round(r.count / socialData.totalContacts * 100)} size="small" />
    )},
  ];

  const companyColumns = [
    { title: '公司/组织', dataIndex: 'company', key: 'company' },
    { title: '联系人数', dataIndex: 'count', key: 'count' },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="联系人总数"
              value={socialData?.totalContacts || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="收藏联系人"
              value={socialData?.favoriteCount || 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="互动总次数"
              value={frequencyData?.summary?.totalInteractions || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="社交多样性"
              value={socialData?.diversityScore || 0}
              suffix="分"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="联系人类型分布">
            <Table
              dataSource={socialData?.byType || []}
              columns={typeColumns}
              pagination={false}
              size="small"
              rowKey="type"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="公司/组织分布 (Top 10)">
            <Table
              dataSource={socialData?.byCompany || []}
              columns={companyColumns}
              pagination={false}
              size="small"
              rowKey="company"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="关系等级分布">
            <Table
              dataSource={socialData?.byRelationship || []}
              columns={[
                { title: '关系等级', dataIndex: 'relationship_level', key: 'level', render: (l: string) => <Tag color={l === '亲密' ? 'red' : l === '重要' ? 'orange' : l === '一般' ? 'blue' : 'default'}>{l || '未设置'}</Tag> },
                { title: '数量', dataIndex: 'count', key: 'count' },
              ]}
              pagination={false}
              size="small"
              rowKey="relationship_level"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="分组分布">
            {socialData?.byGroup?.length > 0 ? (
              <List
                dataSource={socialData.byGroup}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: item.color || '#1890ff' }}>{item.name?.charAt(0)}</Avatar>}
                      title={item.name}
                      description={`${item.count} 位联系人`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无分组数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card title={<><ClockCircleOutlined /> 最近联系 (30天内)</>}>
            <List
              dataSource={frequencyData?.recentlyContacted?.slice(0, 5) || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} src={item.avatar} />}
                    title={item.name}
                    description={`最后联系: ${item.last_interaction || '无记录'}`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无数据' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<><HeartOutlined style={{ color: '#f5222d' }} /> 需要关注</>}>
            <List
              dataSource={frequencyData?.needsAttention?.slice(0, 5) || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} src={item.avatar} style={{ backgroundColor: '#f5222d' }} />}
                    title={<span style={{ color: '#f5222d' }}>{item.name}</span>}
                    description="长时间未联系的收藏联系人"
                  />
                </List.Item>
              )}
              locale={{ emptyText: '所有收藏联系人都有近期互动' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="从未联系">
            <List
              dataSource={frequencyData?.neverContacted?.slice(0, 5) || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} src={item.avatar} />}
                    title={item.name}
                    description={<Tag>{item.type}</Tag>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '所有联系人都有互动记录' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="月度互动趋势" style={{ marginTop: 16 }}>
        {frequencyData?.interactionsByMonth?.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', height: 150 }}>
            {frequencyData.interactionsByMonth.slice().reverse().map((item: any) => {
              const maxCount = Math.max(...frequencyData.interactionsByMonth.map((i: any) => i.count));
              const height = maxCount > 0 ? (item.count / maxCount) * 120 : 0;
              return (
                <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 40 }}>
                  <div style={{ backgroundColor: '#1890ff', width: '100%', maxWidth: 40, height, borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{item.month.slice(5)}</span>
                  <span style={{ fontSize: 12 }}>{item.count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty description="暂无互动数据" />
        )}
      </Card>
    </div>
  );
};

export default SocialAnalysis;
