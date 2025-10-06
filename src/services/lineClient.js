import * as line from '@line/bot-sdk';
import {env} from '../config/env.js';
import {withRetry} from '../utils/retry.js';

const config = {
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: env.LINE_CHANNEL_SECRET
};
export const lineClient = new line.Client(config);

export function getSourceTargetId(event) {
    const src = event?.source || {};
    if (src.type === 'group') return src.groupId;
    if (src.type === 'room') return src.roomId;
    return src.userId || null;
}

export async function replySafe(replyToken, message) {
    await withRetry(() => lineClient.replyMessage(replyToken, message), {only5xx: true});
}

export async function pushSafe(targetId, message) {
    if (!targetId) return;
    await withRetry(() => lineClient.pushMessage(targetId, message), {only5xx: true});
}

export async function downloadLineImage(messageId) {
    const stream = await lineClient.getMessageContent(messageId);
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
}
