import crypto from 'crypto';
import { env } from '../config/env.js';
import { withRetry } from '../utils/retry.js';
import { currencyFromNumeric } from '../utils/format.js';

/** Use SlipOK raw first (faster). */
export async function callSlipOkWithRaw(qrcode, { expectedAmount = null } = {}) {
    return withRetry(async () => {
        const body = { qrcode, log: true };
        if (expectedAmount) body.amount = String(expectedAmount);

        const resp = await fetch('https://slipok.com/api/check-slip-raw', {
            method: 'POST',
            headers: {
                'X-API-Key': env.SLIPOK_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const json = await resp.json().catch(() => ({}));
        return normalizeSlipOk(json);
    });
}

export async function callSlipOkWithImage(imgBuffer, { expectedAmount = null } = {}) {
    return withRetry(async () => {
        const form = new FormData();
        form.append('file', new Blob([imgBuffer], { type: 'image/jpeg' }), 'slip.jpg');
        if (expectedAmount) form.append('amount', String(expectedAmount));
        form.append('log', 'true');

        const resp = await fetch('https://slipok.com/api/check-slip', {
            method: 'POST',
            headers: { 'X-API-Key': env.SLIPOK_API_KEY },
            body: form
        });
        const json = await resp.json().catch(() => ({}));
        return normalizeSlipOk(json);
    });
}

/** Normalizer for HTTP 200 { success, data{...} } shape */
export function normalizeSlipOk(json) {
    const topSuccess = json?.success === true;
    const d = json?.data ?? {};
    const innerSuccess = d?.success === true;
    const ok = topSuccess && innerSuccess;

    const normalized = {
        amount: d.amount ?? d.paidLocalAmount ?? null,
        currency: currencyFromNumeric(d.paidLocalCurrency) || 'THB',
        fee: d.transFeeAmount ?? null,

        payer_name: d.sender?.displayName || d.sender?.name || null,
        payer_account: d.sender?.account?.value || null,
        payer_proxy_type: d.sender?.proxy?.type || null,
        payer_proxy_value: d.sender?.proxy?.value || null,

        receiver_name: d.receiver?.displayName || d.receiver?.name || null,
        dest_account: d.receiver?.account?.value || null,
        receiver_proxy_type: d.receiver?.proxy?.type || null,
        receiver_proxy_value: d.receiver?.proxy?.value || null,

        sending_bank_code: d.sendingBank ?? null,
        receiving_bank_code: d.receivingBank ?? null,

        transaction_ref: d.transRef || null,
        trans_date: d.transDate || null,
        trans_time: d.transTime || null,
        trans_timestamp: null,
        rq_uid: d.rqUID || null,
        country: d.countryCode || 'TH',

        ref1: d.ref1 || null,
        ref2: d.ref2 || null,
        ref3: d.ref3 || null,
        to_merchant_id: d.toMerchantId || null,
        provider_message: d.message || null
    };

    return {
        ok,
        errorCode: ok ? null : null,
        message: ok ? null : (json?.message || d?.message || 'Slip verification failed.'),
        data: normalized,
        raw: json
    };
}

export function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}
