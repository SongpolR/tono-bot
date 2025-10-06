import { handleImage } from '../features/verification/handleImage.js';

export async function handleWebhook(events = []) {
  await Promise.all(events.map(dispatch));
}

async function dispatch(event) {
  if (event.type !== 'message') return;

  if (event.message.type === 'image') {
    await handleImage(event);
  }
}
