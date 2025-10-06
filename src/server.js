import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';

const server = createServer(app);
server.listen(env.PORT, () => {
  console.log(`[tono-bot] running, visit http://localhost:${env.PORT}`);
});
