import crypto from 'crypto';
import { env } from '../config/env.js';
import { withRetry } from '../utils/retry.js';
import { currencyFromNumeric } from '../utils/format.js';

export async function callSlipOkWithImage(imgBuffer) {
  return withRetry(async () => {
    const form = new FormData();
    form.append(
      'files',
      new Blob([imgBuffer], { type: 'image/jpeg' }),
      'slip.jpg'
    );
    form.append('log', 'true');

    const resp = await fetch(
      `https://api.slipok.com/api/line/apikey/${env.SLIPOK_BRANCH_ID}`,
      {
        method: 'POST',
        headers: { 'x-authorization': env.SLIPOK_API_KEY },
        body: form,
      }
    );
    const json = await resp.json().catch(() => ({}));
    return normalizeSlipOk(json);
  });
}

/** Normalizer for HTTP 200 [success, data{...}] shape */
export function normalizeSlipOk(json) {
  // Expected shape:
  // {
  //   success: true|false,
  //   data: {
  //     success: true|false,
  //     message: "✅" | <reason>,
  //     rqUID, transRef, sendingBank, receivingBank, transDate, transTime,
  //     sender{displayName,name,proxy{type,value},account{type,value}},
  //     receiver{...}, amount, paidLocalAmount, paidLocalCurrency, countryCode, transFeeAmount, ref1..3, toMerchantId
  //   }
  // }

  const topSuccess = json?.success === true;
  const d = json?.data ?? {};
  const innerSuccess = d?.success === true;

  const ok = topSuccess && innerSuccess;

  const normalized = {
    // amounts/currency
    amount: d.amount ?? d.paidLocalAmount ?? null,
    currency: currencyFromNumeric(d.paidLocalCurrency) || 'THB',
    fee: d.transFeeAmount ?? null,

    // parties
    payer_name: d.sender?.displayName || d.sender?.name || null,
    payer_account: d.sender?.account?.value || null,
    payer_proxy_type: d.sender?.proxy?.type || null,
    payer_proxy_value: d.sender?.proxy?.value || null,

    receiver_name: d.receiver?.displayName || d.receiver?.name || null,
    receiver_account: d.receiver?.account?.value || null,
    receiver_proxy_type: d.receiver?.proxy?.type || null,
    receiver_proxy_value: d.receiver?.proxy?.value || null,

    // banks
    sending_bank_code: d.sendingBank ?? null,
    receiving_bank_code: d.receivingBank ?? null,

    // transaction meta
    transaction_ref: d.transRef || null,
    trans_date: d.transDate || null,
    trans_time: d.transTime || null,
    trans_timestamp: null, // not provided in this schema
    rq_uid: d.rqUID || null,
    country: d.countryCode || 'TH',

    // refs/extra
    ref1: d.ref1 || null,
    ref2: d.ref2 || null,
    ref3: d.ref3 || null,
    to_merchant_id: d.toMerchantId || null,

    // provider message symbol (e.g., "✅")
    provider_message: d.message || null,
  };

  return {
    ok,
    code: json?.code || null, // this schema doesn't include numeric error codes
    message: ok
      ? null
      : json?.message || d?.message || 'Slip verification failed.',
    data: normalized,
    raw: json,
  };
}

export function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// --- Quota check ---
export async function getSlipOkQuota() {
  const resp = await fetch(
    `https://api.slipok.com/api/line/apikey/${env.SLIPOK_BRANCH_ID}/quota`,
    {
      method: 'GET',
      headers: { 'x-authorization': env.SLIPOK_API_KEY },
    }
  );

  // Don’t throw: we want graceful behavior if quota API is flaky
  const json = await resp.json().catch(() => ({}));

  // Normalize various possible shapes:
  // prefer { quota } if present
  const data = json?.data ?? json ?? {};

  return {
    ok: json.success,
    quota: data.quota || 0,
    raw: json,
  };
}
