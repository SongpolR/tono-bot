import express from 'express';
import * as line from '@line/bot-sdk';
import { env } from '../config/env.js';
import { handleWebhook } from '../controllers/webhookController.js';
import { webhookGuard } from '../middlewares/webhookGuard.js';

const router = express.Router();
const config = {
  channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: env.LINE_CHANNEL_SECRET,
};

// ✅ LINE signature validation & raw body handling
router.post('/', webhookGuard, line.middleware(config), (req, res) => {
  res.status(200).end(); // ACK fast
  handleWebhook(req.body.events).catch(console.error);
});

export default router;
