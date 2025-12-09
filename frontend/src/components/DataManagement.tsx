import React, { useState } from 'react';
import { Card, Button, Upload, message, Space, Modal, Typography } from 'antd';
import { DownloadOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const { Text, Paragraph } = Typography;

const DataManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await api.exportContacts();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `social-memo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (file: File) => {
    Modal.confirm({
      title: '确认导入',
      icon: <ExclamationCircleOutlined />,
      content: '导入数据将添加新的联系人，不会覆盖现有数据。确定要继续吗？',
      okText: '确定导入',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          const result = await api.importContacts(data);
          message.success(`成功导入 ${result.imported} 个联系人`);
        } catch (err) {
          message.error('导入失败，请检查文件格式');
        } finally {
          setLoading(false);
        }
      },
    });
    return false;
  };

  return (
    <div>
      <Card title="数据管理" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Paragraph>
              <Text strong>导出数据</Text>
            </Paragraph>
            <Paragraph type="secondary">
              将所有联系人数据导出为 JSON 文件，用于备份或迁移。
            </Paragraph>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={loading}
            >
              导出所有数据
            </Button>
          </div>

          <div>
            <Paragraph>
              <Text strong>导入数据</Text>
            </Paragraph>
            <Paragraph type="secondary">
              从 JSON 文件导入联系人数据。导入的数据将添加为新联系人，不会覆盖现有数据。
            </Paragraph>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<UploadOutlined />} loading={loading}>
                选择文件导入
              </Button>
            </Upload>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default DataManagement;
