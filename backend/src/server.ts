import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/server';
import { initializeDatabase } from './config/database';
import { authService, authMiddleware } from './services/authService';
import apiRoutes from './routes/api';

const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS 配置
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? false  // 生产环境禁用外部 CORS
    : ['http://localhost:5173', 'http://localhost:13579', 'http://127.0.0.1:13579'],
  credentials: true,
}));

// 请求日志
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// 登录接口速率限制（防止暴力破解）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次登录尝试
  message: { error: '登录尝试过多，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// 认证中间件（保护所有API路由）
app.use('/api', authMiddleware);

// API routes
app.use('/api', apiRoutes);

// Serve uploaded files (需要认证)
const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Serve static files in production
const frontendPath = process.env.FRONTEND_PATH || path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendPath));

// Handle React routing
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ message: 'Social Memo API Server is running', apiDocs: '/api' });
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const PORT = config.port;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();

    // 初始化认证服务
    authService.init();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║         社交关系备忘录系统 - 后端服务启动成功          ║
╠════════════════════════════════════════════════════════╣
║  API地址: http://localhost:${PORT}/api                   ║
║  环境: ${config.nodeEnv.padEnd(47)}║
║  安全: 已启用认证、速率限制、Helmet                    ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
