import * as line from '@line/bot-sdk';
import { env } from '../config/env.js';
import { withRetry } from '../utils/retry.js';

const config = {
  channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: env.LINE_CHANNEL_SECRET,
};
export const lineClient = new line.Client(config);

export function getSourceTargetId(event) {
  const src = event?.source || {};
  if (src.type === 'group') return src.groupId;
  if (src.type === 'room') return src.roomId;
  return src.userId || null;
}

export async function pushSafe(targetId, message) {
  if (!targetId) return;
  await withRetry(() => lineClient.pushMessage(targetId, message), {
    only5xx: true,
  });
}

export async function downloadLineImage(messageId) {
  const stream = await lineClient.getMessageContent(messageId);
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

/**
 * Check LINE Messaging API quota.
 * API: GET https://api.line.me/v2/bot/message/quota
 * Auth: Bearer <LINE_CHANNEL_ACCESS_TOKEN>
 * Example response: { "type": "limited", "value": 300 }
 *
 * We assume "value" is the *remaining* quota.
 */
export async function getLINEMessagingAPIQuota() {
  const resp = await fetch('https://api.line.me/v2/bot/message/quota', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  let json = {};
  try {
    json = await resp.json();
  } catch {}

  // Normalize
  const type = json?.type || 'limited';
  const remaining = json?.value || 1000; // not returned when type is 'none'

  return {
    ok: json.type && json.value,
    type,
    remaining,
    raw: json,
  };
}
