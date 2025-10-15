import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import authRouter from './routes/auth.js';
import itemsRouter from './routes/items.js';
import healthRouter from './routes/health.js';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Basic rate limit (tune as needed)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/health', healthRouter);

app.get('/', (_, res) => res.json({ ok: true, service: 'UP&OUT API' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`UP&OUT API listening on :${PORT}`));
