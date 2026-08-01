import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import convertRouter from './routes/convert.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', convertRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Chat to PDF Generator Service is active.' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 AI Chat to PDF Backend active on http://127.0.0.1:${PORT}`);
  console.log(`====================================================`);
});
