import { env } from '../../config/env.js';
import { getSourceTargetId, replySafe, pushSafe, downloadLineImage } from '../../services/lineClient.js';
import { callSlipOkWithRaw, callSlipOkWithImage, sha256 } from '../../services/slipok.js';
import { extractQrPayload, looksLikeThaiSlipPayload } from '../../services/qr.js';
import { buildFlexInvalid, buildFlexNotSlip, buildFlexPending, buildFlexReceiverMismatch, buildFlexVerified } from '../../utils/flex.js';
import { isDuplicateRef, markRefUsed, receiverMatches } from '../../utils/store.js';

export async function handleImage(event) {
    await replySafe(event.replyToken, { type: 'text', text: 'Got your slip 🧾 Checking now…' });

    const targetId = getSourceTargetId(event);
    try {
        const img = await downloadLineImage(event.message.id);

        // Pre-check QR
        const qrText = await extractQrPayload(img);
        if (!qrText) { await pushSafe(targetId, buildFlexNotSlip()); return; }
        if (!looksLikeThaiSlipPayload(qrText)) {
            await pushSafe(targetId, buildFlexInvalid('รูปนี้ดูไม่เหมือนสลิปโอนเงิน (QR ไม่ใช่รูปแบบที่รองรับ)'));
            return;
        }

        const expectedAmount = env.EXPECTED_AMOUNT || null;

        // Prefer raw
        let result = await callSlipOkWithRaw(qrText, { expectedAmount });
        if (!result.ok) {
            const msg = (result.message || '').toLowerCase();
            if (/not.*slip|invalid.*qr|no.*qr/.test(msg)) {
                await pushSafe(targetId, buildFlexNotSlip());
                return;
            }
            result = await callSlipOkWithImage(img, { expectedAmount });
        }

        const info = result.data || {};
        const ref  = info.transaction_ref || null;

        if (!result.ok) {
            if (/รอตรวจสอบ|pending/i.test(result.message || '')) {
                await pushSafe(targetId, buildFlexPending(ref, info));
            } else {
                await pushSafe(targetId, buildFlexInvalid(result.message, info));
            }
            return;
        }

        // business checks
        if (expectedAmount && Number(info.amount) !== Number(expectedAmount)) {
            await pushSafe(targetId, buildFlexInvalid('ยอดชำระบนสลิปไม่ตรงกับยอดที่ต้องชำระ', info));
            return;
        }
        if (!receiverMatches(info)) {
            await pushSafe(targetId, buildFlexReceiverMismatch(info));
            return;
        }
        if (ref && isDuplicateRef(ref)) {
            await pushSafe(targetId, buildFlexInvalid('สลิปนี้ถูกใช้ไปแล้ว (พบรายการซ้ำ)', info));
            return;
        }
        if (ref) markRefUsed(ref);

        await pushSafe(targetId, buildFlexVerified({ ...info, imgHash: sha256(img), expectedAmount }));
    } catch (err) {
        console.error('verify image error:', err);
        await pushSafe(getSourceTargetId(event), buildFlexInvalid('เกิดข้อผิดพลาดระหว่างตรวจสอบสลิป กรุณาลองใหม่'));
    }
}
