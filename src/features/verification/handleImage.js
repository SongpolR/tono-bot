import {
  getSourceTargetId,
  pushSafe,
  downloadLineImage,
} from '../../services/lineClient.js';
import { callSlipOkWithImage, sha256 } from '../../services/slipok.js';
import {
  buildFlexInvalid,
  buildFlexPending,
  buildFlexVerified,
} from '../../utils/flex.js';

export async function handleImage(event) {
  const targetId = getSourceTargetId(event);
  try {
    const img = await downloadLineImage(event.message.id);

    const result = await callSlipOkWithImage(img);

    const info = result.data || {};
    const ref = info.transaction_ref || null;

    if (!result.ok) {
      if (result.code === 1009 || result.code === 1010) {
        await pushSafe(targetId, buildFlexPending(ref, info));
      } else if (
        result.code === 1008 ||
        result.code === 1011 ||
        result.code === 1012 ||
        result.code === 1014
      ) {
        await pushSafe(targetId, buildFlexInvalid(result.message, info));
      }
      return;
    }

    await pushSafe(
      targetId,
      buildFlexVerified({ ...info, imgHash: sha256(img) })
    );
  } catch (err) {
    console.error('verify image error:', err);
    await pushSafe(
      getSourceTargetId(event),
      buildFlexInvalid('เกิดข้อผิดพลาดระหว่างตรวจสอบสลิป กรุณาลองใหม่')
    );
  }
}
