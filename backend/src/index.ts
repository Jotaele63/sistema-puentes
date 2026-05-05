import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

import authRoutes from './routes/auth.routes';
import bridgesRoutes from './routes/bridges.routes';
import usersRoutes from './routes/users.routes';
import reportsRoutes from './routes/reports.routes';
import { autoSeed } from './lib/autoSeed';

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}));

app.use(cors({
  origin: isProd
    ? (process.env.FRONTEND_URL || true)
    : 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bridges', bridgesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', reportsRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve compiled React frontend in production
if (isProd) {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function main() {
  await autoSeed();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

main().catch(console.error);

export default app;
