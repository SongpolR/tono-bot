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
 * Check LINE Messaging API remaining quota.
 * API: GET https://api.line.me/v2/bot/message/quota
 * API: GET https://api.line.me/v2/bot/message/quota/consumption
 * Auth: Bearer <LINE_CHANNEL_ACCESS_TOKEN>
 * Example response: { "remaining": 300 }
 *
 */
export async function getLINEMessagingAPIRemainingQuota() {
  const respLimit = await fetch('https://api.line.me/v2/bot/message/quota', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  let jsonLimit = {};
  try {
    jsonLimit = await respLimit.json();
  } catch {}

  const respConsume = await fetch(
    'https://api.line.me/v2/bot/message/quota/consumption',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  let jsonConsume = {};
  try {
    jsonConsume = await respConsume.json();
  } catch {}

  // Normalize
  const remaining = (jsonLimit?.value || 300) - (jsonConsume?.value || 300); // not returned when type is 'none'

  return {
    ok: jsonLimit.value && jsonConsume.totalUsage,
    remaining,
    rawLimit: jsonLimit,
    rawConsume: jsonConsume,
  };
}
