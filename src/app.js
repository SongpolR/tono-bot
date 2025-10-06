import express from 'express';
import webhookRouter from './routes/webhook.js';

const app = express();

// ⛔️ Do NOT put express.json() before the LINE webhook.
// (LINE middleware needs the raw body)
app.use('/webhook', webhookRouter);

// Health check and later routes
app.get('/', (_, res) => res.send('OK'));

export default app;
