import {
  getSourceTargetId,
  pushSafe,
  downloadLineImage,
} from '../../services/lineClient.js';
import {
  callSlipOkWithImage,
  getSlipOkQuota,
  sha256,
} from '../../services/slipok.js';
import {
  buildFlexInvalid,
  buildFlexPending,
  buildFlexQuotaLow,
  buildFlexQuotaZero,
  buildFlexVerified,
} from '../../utils/flex.js';
import { env } from '../../config/env.js';

export async function handleImage(event) {
  const targetId = getSourceTargetId(event);
  try {
    const quotaResult = await getSlipOkQuota();
    if (quotaResult.quota <= 0) {
      await pushSafe(targetId, buildFlexQuotaZero(quotaResult.quota));
      return; // stop flow entirely
    }
    if (quotaResult.quota < env.SLIPOK_QUOTA_WARN_THRESHOLD) {
      await pushSafe(targetId, buildFlexQuotaLow());
    }

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
