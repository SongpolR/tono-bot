import { bankLabel, fmtTHB, formatWhen, mask } from './format.js';
import { tonoSay } from './voice.js';

const text = (t, opts = {}) => ({ type: 'text', text: t, ...opts });
const flex = (altText, bubble) => ({ type: 'flex', altText, contents: bubble });

function row(label, left, right) {
  return {
    type: 'box',
    layout: 'vertical',
    margin: 'md',
    contents: [
      text(label, { size: 'sm', color: '#6B7280' }),
      {
        type: 'box',
        layout: 'horizontal',
        spacing: 'md',
        contents: [
          text(mask(left), {
            size: 'sm',
            weight: 'bold',
            color: '#111827',
            flex: 0,
          }),
          text(right || '-', { size: 'sm', color: '#111827', wrap: true }),
        ],
      },
    ],
  };
}

function kv(label, value) {
  return {
    type: 'box',
    layout: 'vertical',
    margin: 'md',
    contents: [
      text(label, { size: 'sm', color: '#6B7280' }),
      text(value || '-', {
        size: 'sm',
        color: '#111827',
        wrap: true,
      }),
    ],
  };
}

// ✅ success
export function buildFlexVerified(info = {}) {
  const amount = fmtTHB(info.amount);
  const when = formatWhen(info);
  const bubble = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        text(tonoSay.okTitle(), {
          weight: 'bold',
          color: '#16A34A',
          size: 'md',
        }),
        text(`฿ ${amount}`, { weight: 'bold', size: 'xxl' }),
        text(tonoSay.okSub(when), { size: 'sm', color: '#6B7280', wrap: true }),

        // bank info
        kv('ธนาคารผู้โอน', bankLabel(info.sending_bank_code)),
        kv('ธนาคารผู้รับ', bankLabel(info.receiving_bank_code)),

        { type: 'separator', margin: 'md' },
        row(
          'ชื่อผู้โอน',
          info.payer_account || info.payer_proxy_value,
          info.payer_name
        ),
        row(
          'ชื่อผู้รับ',
          info.receiver_account || info.receiver_proxy_value,
          info.receiver_name
        ),
      ],
    },
  };
  return flex(`Tono: สลิปผ่าน ฿${amount}`, bubble);
}

// ⏳ pending
export function buildFlexPending() {
  const bubble = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        text(tonoSay.pendingTitle(), { weight: 'bold', color: '#F59E0B' }),
        text(tonoSay.pendingSub(), {
          size: 'sm',
          color: '#6B7280',
          wrap: true,
        }),
      ],
    },
  };
  return flex('Tono: รอตรวจสอบสลิป', bubble);
}

// ❌ invalid
export function buildFlexInvalid(msg) {
  const parts = [
    text(tonoSay.invalidTitle(), { weight: 'bold', color: '#DC2626' }),
    text(msg || tonoSay.invalidSub(), {
      size: 'sm',
      color: '#6B7280',
      wrap: true,
    }),
  ];
  return flex('Tono: สลิปมีปัญหา', {
    type: 'bubble',
    body: { type: 'box', layout: 'vertical', spacing: 'md', contents: parts },
  });
}

export function buildFlexQuotaZero(quota) {
  return flex('Tono: โควต้า SlipOK หมดแล้ว', {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        text(`โฮ่ง! โควต้าตรวจสลิปหมดแล้วครับ ${quota} ❌`, {
          weight: 'bold',
          color: '#DC2626',
          wrap: true,
        }),
      ],
    },
  });
}

export function buildFlexQuotaLow() {
  return flex('Tono: โควต้าใกล้หมด', {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        text('งื้ด… โควต้าตรวจสลิปใกล้หมดแล้วนะครับ ⚠️', {
          weight: 'bold',
          color: '#F59E0B',
          wrap: true,
        }),
      ],
    },
  });
}
