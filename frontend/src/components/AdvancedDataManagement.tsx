import React, { useState } from 'react';
import { Card, Tabs, Button, Upload, message, Table, Space, Modal, Input, Progress, Alert, Divider, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined, IdcardOutlined, ScanOutlined, CloudUploadOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const { TextArea } = Input;
const { Text } = Typography;

const AdvancedDataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('excel');
  const [excelData, setExcelData] = useState<any[]>([]);
  const [vcardText, setVcardText] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Excel Export
  const handleExcelExport = async () => {
    try {
      const data = await api.exportToExcel();
      // 创建CSV下载
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map((row: any) => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  // Excel Import
  const handleExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        const data = lines.slice(1).map(line => {
          const values = line.match(/("([^"]|"")*"|[^,]*)/g) || [];
          const row: any = {};
          headers.forEach((h, i) => {
            row[h] = (values[i] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
          });
          return row;
        }).filter(row => row['姓名'] || row['name'] || row['Name']);

        setExcelData(data);
        setPreviewVisible(true);
      } catch {
        message.error('文件解析失败，请确保是有效的CSV文件');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleExcelImport = async () => {
    if (excelData.length === 0) {
      message.error('没有可导入的数据');
      return;
    }
    setImporting(true);
    try {
      const result = await api.importFromExcel(excelData);
      setImportResult(result);
      message.success(`导入完成: ${result.imported} 成功, ${result.skipped} 跳过`);
      setExcelData([]);
      setPreviewVisible(false);
    } catch (e: any) {
      message.error(e.response?.data?.error || '导入失败');
    }
    setImporting(false);
  };

  // vCard Export
  const handleVCardExport = async () => {
    try {
      const data = await api.exportToVCard();
      const blob = new Blob([data], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_${new Date().toISOString().slice(0, 10)}.vcf`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  // vCard Import
  const handleVCardFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setVcardText(text);
    };
    reader.readAsText(file);
    return false;
  };

  const handleVCardImport = async () => {
    if (!vcardText.trim()) {
      message.error('请输入或上传vCard内容');
      return;
    }
    setImporting(true);
    try {
      const result = await api.importFromVCard(vcardText);
      setImportResult(result);
      message.success(`导入完成: ${result.imported} 成功, ${result.skipped} 跳过`);
      setVcardText('');
    } catch (e: any) {
      message.error(e.response?.data?.error || '导入失败');
    }
    setImporting(false);
  };

  const excelColumns = excelData.length > 0
    ? Object.keys(excelData[0]).slice(0, 6).map(key => ({
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
      }))
    : [];

  return (
    <Card title={<><CloudUploadOutlined /> 高级数据导入导出</>}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab={<><FileExcelOutlined /> Excel/CSV</>} key="excel">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small" title="导出">
              <Text>将所有联系人导出为CSV文件，可用Excel打开编辑</Text>
              <br /><br />
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExcelExport}>
                导出CSV文件
              </Button>
            </Card>

            <Card size="small" title="导入">
              <Alert
                message="CSV文件格式要求"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li>第一行为表头，必须包含"姓名"或"name"列</li>
                    <li>支持的列：姓名、类型、关系等级、性别、生日、电话、邮箱、微信、QQ、公司、职位、地址、籍贯、标签、备注</li>
                    <li>已存在同名联系人将被跳过</li>
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Upload
                accept=".csv,.txt"
                beforeUpload={handleExcelFile}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>选择CSV文件</Button>
              </Upload>
            </Card>
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<><IdcardOutlined /> vCard</>} key="vcard">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small" title="导出">
              <Text>将所有联系人导出为vCard格式(.vcf)，可导入到手机通讯录</Text>
              <br /><br />
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleVCardExport}>
                导出vCard文件
              </Button>
            </Card>

            <Card size="small" title="导入">
              <Alert
                message="vCard格式说明"
                description="支持标准vCard 3.0格式，可从手机通讯录或其他应用导出获得"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Upload
                accept=".vcf,.vcard"
                beforeUpload={handleVCardFile}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>选择vCard文件</Button>
              </Upload>
              <Divider>或直接粘贴vCard内容</Divider>
              <TextArea
                rows={6}
                value={vcardText}
                onChange={e => setVcardText(e.target.value)}
                placeholder="BEGIN:VCARD&#10;VERSION:3.0&#10;FN:张三&#10;TEL:13800138000&#10;END:VCARD"
              />
              <br /><br />
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleVCardImport}
                loading={importing}
                disabled={!vcardText.trim()}
              >
                导入vCard
              </Button>
            </Card>
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<><ScanOutlined /> 名片扫描</>} key="ocr">
          <Alert
            message="名片OCR扫描功能"
            description={
              <div>
                <p>此功能需要配置第三方OCR服务（如百度AI、腾讯云等）的API密钥才能使用。</p>
                <p>目前您可以手动输入名片信息来创建联系人。</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card size="small" title="手动输入名片信息">
            <Text type="secondary">请使用"联系人管理"页面的添加功能来创建新联系人</Text>
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="预览导入数据"
        open={previewVisible}
        onCancel={() => { setPreviewVisible(false); setExcelData([]); }}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => { setPreviewVisible(false); setExcelData([]); }}>取消</Button>,
          <Button key="import" type="primary" onClick={handleExcelImport} loading={importing}>
            确认导入 ({excelData.length} 条)
          </Button>
        ]}
      >
        <Table
          dataSource={excelData.slice(0, 10)}
          columns={excelColumns}
          pagination={false}
          size="small"
          scroll={{ x: true }}
          rowKey={(_, i) => i?.toString() || ''}
        />
        {excelData.length > 10 && (
          <div style={{ textAlign: 'center', padding: 8, color: '#999' }}>
            ... 还有 {excelData.length - 10} 条数据
          </div>
        )}
      </Modal>

      {importResult && (
        <Modal
          title="导入结果"
          open={!!importResult}
          onOk={() => setImportResult(null)}
          onCancel={() => setImportResult(null)}
          footer={[<Button key="ok" type="primary" onClick={() => setImportResult(null)}>确定</Button>]}
        >
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Progress
              type="circle"
              percent={100}
              format={() => importResult.imported}
              status="success"
            />
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ fontSize: 18 }}>导入完成</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text>成功导入 <Text strong style={{ color: '#52c41a' }}>{importResult.imported}</Text> 位联系人</Text>
              {importResult.skipped > 0 && (
                <div><Text type="secondary">跳过 {importResult.skipped} 位（已存在或无效）</Text></div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default AdvancedDataManagement;
