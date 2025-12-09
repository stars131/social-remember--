import React, { useState, useEffect } from 'react';
import { Layout, Menu, ConfigProvider, theme, Badge, Button, Tooltip, Dropdown, message } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DatabaseOutlined,
  SettingOutlined,
  CalendarOutlined,
  GiftOutlined,
  BellOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  ShareAltOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  SwapOutlined,
  DeleteOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import Dashboard from './components/Dashboard';
import ContactList from './components/ContactList';
import DataManagement from './components/DataManagement';
import ActivityList from './components/ActivityList';
import GiftManager from './components/GiftManager';
import Settings from './components/Settings';
import ReminderPanel from './components/ReminderPanel';
import RelationshipGraph from './components/RelationshipGraph';
import SocialAnalysis from './components/SocialAnalysis';
import LoanManager from './components/LoanManager';
import TemplateManager from './components/TemplateManager';
import HolidayManager from './components/HolidayManager';
import TrashManager from './components/TrashManager';
import OperationLogs from './components/OperationLogs';
import DuplicateManager from './components/DuplicateManager';
import CustomFieldManager from './components/CustomFieldManager';
import AdvancedDataManagement from './components/AdvancedDataManagement';
import PeriodicReminderManager from './components/PeriodicReminderManager';
import LoginPage from './components/LoginPage';
import * as api from './services/api';
import './App.css';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const [reminderVisible, setReminderVisible] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAuthenticated(false);
      setCheckingAuth(false);
      return;
    }

    try {
      const result = await api.checkAuth();
      if (result.authenticated) {
        setIsAuthenticated(true);
        setCurrentUser(result.username || localStorage.getItem('auth_user') || '');
        loadTheme();
        loadReminderCount();
        api.generateReminders().catch(() => {});
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
    setCheckingAuth(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentUser(localStorage.getItem('auth_user') || '');
    loadTheme();
    loadReminderCount();
    api.generateReminders().catch(() => {});
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
    setCurrentUser('');
    message.success('已退出登录');
  };

  const loadTheme = async () => {
    try {
      const res = await api.getTheme();
      setDarkMode(res.theme === 'dark');
    } catch {
      // Default to light mode
    }
  };

  const loadReminderCount = async () => {
    try {
      const res = await api.getReminderCount();
      setReminderCount(res.count);
    } catch {
      // Ignore error
    }
  };

  const toggleTheme = async () => {
    const newTheme = darkMode ? 'light' : 'dark';
    try {
      await api.setTheme(newTheme);
      setDarkMode(!darkMode);
    } catch {
      // Still toggle locally
      setDarkMode(!darkMode);
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: 'contacts',
      icon: <TeamOutlined />,
      label: '联系人',
    },
    {
      key: 'graph',
      icon: <ShareAltOutlined />,
      label: '关系图谱',
    },
    {
      key: 'analysis',
      icon: <PieChartOutlined />,
      label: '社交分析',
    },
    {
      key: 'activities',
      icon: <CalendarOutlined />,
      label: '活动',
    },
    {
      key: 'gifts',
      icon: <GiftOutlined />,
      label: '礼物',
    },
    {
      key: 'loans',
      icon: <SwapOutlined />,
      label: '借还记录',
    },
    {
      key: 'reminders-sub',
      icon: <ClockCircleOutlined />,
      label: '提醒管理',
      children: [
        { key: 'periodic', label: '周期提醒' },
        { key: 'holidays', label: '节日管理' },
      ],
    },
    {
      key: 'templates',
      icon: <MessageOutlined />,
      label: '消息模板',
    },
    {
      key: 'tools',
      icon: <DatabaseOutlined />,
      label: '工具',
      children: [
        { key: 'data', label: '数据备份' },
        { key: 'import-export', label: '高级导入导出' },
        { key: 'duplicates', label: '智能去重' },
        { key: 'custom-fields', label: '自定义字段' },
      ],
    },
    {
      key: 'trash',
      icon: <DeleteOutlined />,
      label: '回收站',
    },
    {
      key: 'logs',
      icon: <HistoryOutlined />,
      label: '操作日志',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'contacts':
        return <ContactList />;
      case 'graph':
        return <RelationshipGraph />;
      case 'analysis':
        return <SocialAnalysis />;
      case 'activities':
        return <ActivityList />;
      case 'gifts':
        return <GiftManager />;
      case 'loans':
        return <LoanManager />;
      case 'periodic':
        return <PeriodicReminderManager />;
      case 'holidays':
        return <HolidayManager />;
      case 'templates':
        return <TemplateManager />;
      case 'data':
        return <DataManagement />;
      case 'import-export':
        return <AdvancedDataManagement />;
      case 'duplicates':
        return <DuplicateManager />;
      case 'custom-fields':
        return <CustomFieldManager />;
      case 'trash':
        return <TrashManager />;
      case 'logs':
        return <OperationLogs />;
      case 'settings':
        return <Settings darkMode={darkMode} onThemeChange={toggleTheme} />;
      default:
        return <Dashboard />;
    }
  };

  const pageTitle: Record<string, string> = {
    dashboard: '仪表板',
    contacts: '联系人管理',
    graph: '关系图谱',
    analysis: '社交分析',
    activities: '活动管理',
    gifts: '礼物记录',
    loans: '借还记录',
    periodic: '周期性联系提醒',
    holidays: '节日管理',
    templates: '消息模板',
    data: '数据备份',
    'import-export': '高级导入导出',
    duplicates: '智能去重',
    'custom-fields': '自定义字段',
    trash: '回收站',
    logs: '操作日志',
    settings: '系统设置',
  };

  const userMenuItems = [
    {
      key: 'user-info',
      label: <span style={{ fontWeight: 'bold' }}>{currentUser}</span>,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // 检查认证状态中
  if (checkingAuth) {
    return (
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: { colorPrimary: '#1890ff' },
        }}
      >
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f2f5',
        }}>
          <span>加载中...</span>
        </div>
      </ConfigProvider>
    );
  }

  // 未登录时显示登录页
  if (!isAuthenticated) {
    return (
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: { colorPrimary: '#1890ff' },
        }}
      >
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div className="logo">
            {collapsed ? '社' : '社交备忘录'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={({ key }) => setCurrentPage(key)}
          />
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
          <Header className={`site-header ${darkMode ? 'dark' : ''}`} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: darkMode ? '#141414' : '#fff',
          }}>
            <h2 style={{ margin: 0, color: darkMode ? '#fff' : '#333' }}>
              {pageTitle[currentPage]}
            </h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Tooltip title={darkMode ? '切换浅色模式' : '切换深色模式'}>
                <Button
                  type="text"
                  icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                  onClick={toggleTheme}
                  style={{ color: darkMode ? '#fff' : '#333' }}
                />
              </Tooltip>
              <Badge count={reminderCount} offset={[-5, 5]}>
                <Tooltip title="提醒">
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    onClick={() => setReminderVisible(true)}
                    style={{ color: darkMode ? '#fff' : '#333' }}
                  />
                </Tooltip>
              </Badge>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  style={{ color: darkMode ? '#fff' : '#333' }}
                >
                  {currentUser}
                </Button>
              </Dropdown>
            </div>
          </Header>
          <Content className="site-content" style={{
            background: darkMode ? '#000' : '#f0f2f5',
          }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
      <ReminderPanel
        visible={reminderVisible}
        onClose={() => {
          setReminderVisible(false);
          loadReminderCount();
        }}
      />
    </ConfigProvider>
  );
};

export default App;
