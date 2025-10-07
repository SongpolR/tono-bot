import express from 'express';
import helmet from 'helmet';
import webhookRouter from './routes/webhook.js';

const app = express();

// Security headers (no CSP needed for pure API)
app.disable('x-powered-by');
app.use(
  helmet({
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true,
    frameguard: { action: 'deny' },
  })
);

// If behind reverse proxy / load balancer
app.set('trust proxy', true);

// ⛔️ Do NOT put express.json() before the LINE webhook.
// (LINE middleware needs the raw body)
app.use('/webhook', webhookRouter);

// Health check and later routes
app.get('/', (_, res) => res.send('OK'));

export default app;
