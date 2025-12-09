import React, { useEffect, useRef, useState } from 'react';
import { Card, Select, Spin, Empty, Tag, Modal, Form, Input, Button, message, Popconfirm, Avatar, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import * as api from '../services/api';

interface Node {
  id: number;
  name: string;
  type: string;
  avatar?: string;
  company?: string;
  isFavorite?: boolean;
}

interface Edge {
  source: number;
  target: number;
  type: string;
  strength: number;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

const RelationshipGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [nodePositions, setNodePositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [graph, contactList] = await Promise.all([
        api.getRelationshipGraph(),
        api.getContacts()
      ]);
      setGraphData(graph);
      setContacts(contactList.data || contactList);
      initNodePositions(graph.nodes);
    } catch (e) {
      message.error('加载关系图谱失败');
    }
    setLoading(false);
  };

  const initNodePositions = (nodes: Node[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const positions = new Map<number, { x: number; y: number }>();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });
    setNodePositions(positions);
  };

  useEffect(() => {
    drawGraph();
  }, [graphData, nodePositions, selectedNode]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    graphData.edges.forEach(edge => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.strokeStyle = `rgba(24, 144, 255, ${edge.strength / 100})`;
        ctx.lineWidth = Math.max(1, edge.strength / 25);
        ctx.stroke();

        // Draw relationship type label
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(edge.type, midX, midY - 5);
      }
    });

    // Draw nodes
    graphData.nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isSelected = selectedNode?.id === node.id;
      const nodeRadius = isSelected ? 30 : 25;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#1890ff' : getTypeColor(node.type);
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#096dd9' : '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, pos.x, pos.y + nodeRadius + 15);

      // Type badge
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.type, pos.x, pos.y + nodeRadius + 28);
    });
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      '家人': '#f5222d',
      '朋友': '#52c41a',
      '同事': '#1890ff',
      '同学': '#722ed1',
      '客户': '#fa8c16',
      '老师': '#13c2c2',
      '领导': '#eb2f96',
    };
    return colors[type] || '#8c8c8c';
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of graphData.nodes) {
      const pos = nodePositions.get(node.id);
      if (pos) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (distance <= 30) {
          setSelectedNode(node);
          return;
        }
      }
    }
    setSelectedNode(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of graphData.nodes) {
      const pos = nodePositions.get(node.id);
      if (pos) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (distance <= 30) {
          setDragging(node.id);
          setOffset({ x: pos.x - x, y: pos.y - y });
          return;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodePositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(dragging, { x: x + offset.x, y: y + offset.y });
      return newPositions;
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleAddRelationship = async (values: any) => {
    try {
      await api.addRelationship(values);
      message.success('添加关系成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.error || '添加失败');
    }
  };

  const handleDeleteRelationship = async (id: number) => {
    try {
      await api.deleteRelationship(id);
      message.success('删除成功');
      loadData();
    } catch {
      message.error('删除失败');
    }
  };

  const getNodeRelationships = () => {
    if (!selectedNode) return [];
    return graphData.edges.filter(
      e => e.source === selectedNode.id || e.target === selectedNode.id
    ).map(e => {
      const otherId = e.source === selectedNode.id ? e.target : e.source;
      const otherNode = graphData.nodes.find(n => n.id === otherId);
      return { ...e, otherNode };
    });
  };

  if (loading) {
    return <Card><Spin tip="加载中..." /></Card>;
  }

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <Card
        title="关系图谱"
        style={{ flex: 2 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加关系
          </Button>
        }
      >
        {graphData.nodes.length === 0 ? (
          <Empty description="暂无联系人数据" />
        ) : (
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ border: '1px solid #f0f0f0', borderRadius: 8, cursor: dragging ? 'grabbing' : 'grab' }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        )}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['家人', '朋友', '同事', '同学', '客户', '老师', '领导'].map(type => (
            <Tag key={type} color={getTypeColor(type)}>{type}</Tag>
          ))}
        </div>
      </Card>

      <Card title={selectedNode ? `${selectedNode.name} 的关系` : '联系人详情'} style={{ flex: 1, minWidth: 300 }}>
        {selectedNode ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar size={64} icon={<UserOutlined />} src={selectedNode.avatar} />
              <h3 style={{ margin: '8px 0 4px' }}>{selectedNode.name}</h3>
              <Tag color={getTypeColor(selectedNode.type)}>{selectedNode.type}</Tag>
              {selectedNode.company && <p style={{ color: '#999', margin: '8px 0 0' }}>{selectedNode.company}</p>}
            </div>
            <div style={{ marginTop: 16 }}>
              <h4>关联关系 ({getNodeRelationships().length})</h4>
              {getNodeRelationships().map((rel: any, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{rel.otherNode?.name}</span>
                    <Tag style={{ marginLeft: 8 }}>{rel.type}</Tag>
                    <span style={{ color: '#999', fontSize: 12 }}>强度: {rel.strength}%</span>
                  </div>
                  <Popconfirm title="确定删除此关系?" onConfirm={() => handleDeleteRelationship(rel.id || 0)}>
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty description="点击节点查看详情" />
        )}
      </Card>

      <Modal
        title="添加关系"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} onFinish={handleAddRelationship} layout="vertical">
          <Form.Item name="contact_id_1" label="联系人1" rules={[{ required: true, message: '请选择联系人' }]}>
            <Select
              showSearch
              placeholder="选择联系人"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={contacts.map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="contact_id_2" label="联系人2" rules={[{ required: true, message: '请选择联系人' }]}>
            <Select
              showSearch
              placeholder="选择联系人"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={contacts.map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="relationship_type" label="关系类型" rules={[{ required: true, message: '请输入关系类型' }]}>
            <Select placeholder="选择或输入关系类型">
              <Select.Option value="夫妻">夫妻</Select.Option>
              <Select.Option value="父子">父子</Select.Option>
              <Select.Option value="母子">母子</Select.Option>
              <Select.Option value="兄弟">兄弟</Select.Option>
              <Select.Option value="姐妹">姐妹</Select.Option>
              <Select.Option value="同事">同事</Select.Option>
              <Select.Option value="朋友">朋友</Select.Option>
              <Select.Option value="同学">同学</Select.Option>
              <Select.Option value="上下级">上下级</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="strength" label="关系强度" initialValue={50}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="可选的关系描述" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RelationshipGraph;
