import express from 'express';
import cors from 'cors';
import pool from './db.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { asyncHandler } from './utils/async-handler.js';
import { ApiResponse } from './utils/api-response.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1');
    res.status(200).json(new ApiResponse(200, 'OK'));
  })
);

app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
