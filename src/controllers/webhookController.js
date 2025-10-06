import {handleImage} from '../features/verification/handleImage.js';
import {handleTextVerify} from '../features/verification/handleTextVerify.js';

export async function handleWebhook(events = []) {
    await Promise.all(events.map(dispatch));
}

async function dispatch(event) {
    if (event.type !== 'message') return;

    if (event.message.type === 'image') {
        await handleImage(event);
        return;
    }

    if (event.message.type === 'text' && /^verify\s+/i.test(event.message.text)) {
        await handleTextVerify(event);
    }
}
