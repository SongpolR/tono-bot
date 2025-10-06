import { bankLabel, fmtTHB, formatWhen, mask } from './format.js';
import { env } from '../config/env.js';

const text = (t, opts={}) => ({ type: 'text', text: t, ...opts });

function flex(altText, bubble) { return ({ type: 'flex', altText, contents: bubble }); }

function row(label, left, right) {
    return {
        type: 'box', layout: 'vertical', margin: 'md',
        contents: [
            text(label, { size: 'sm', color: '#6B7280' }),
            { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
                    text(mask(left), { size: 'sm', weight: 'bold', color: '#111827', flex: 0 }),
                    text(right || '-', { size: 'sm', color: '#111827', wrap: true })
                ]}
        ]
    };
}
function kv(label, value) {
    return { type: 'box', layout: 'vertical', margin: 'md',
        contents: [ text(label, { size: 'sm', color: '#6B7280' }), text(value || '-', { size: 'sm', color: '#111827', wrap: true }) ]
    };
}

// ✅ success
export function buildFlexVerified(info = {}) {
    const amount = fmtTHB(info.amount);
    const when = formatWhen(info);
    const bubble = {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [
                text('สลิปถูกต้อง', { weight: 'bold', color: '#16A34A', size: 'md' }),
                text(`฿ ${amount}`, { weight: 'bold', size: 'xxl' }),
                text(`รับเงินเรียบร้อย ${when}`, { size: 'sm', color: '#6B7280', wrap: true }),
                kv('ธนาคารผู้โอน', bankLabel(info.sending_bank_code)),
                kv('ธนาคารผู้รับ', bankLabel(info.receiving_bank_code)),
                { type:'separator', margin:'md' },
                row('ชื่อผู้โอน', info.payer_account, info.payer_name),
                row('ชื่อผู้รับ', info.dest_account, info.receiver_name),
            ] }
    };
    return flex(`สลิปถูกต้อง ฿${amount}`, bubble);
}

// ❌ receiver mismatch
export function buildFlexReceiverMismatch(info = {}) {
    const bubble = {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [
                text('บัญชีผู้รับไม่ตรงกับบัญชีหลักของร้าน', { weight: 'bold', color: '#DC2626', wrap: true }),
                text('คุณสามารถเพิ่มบัญชีของร้าน เพื่อบันทึกรายการโอนเงินนี้ได้', { size: 'sm', color:'#6B7280', wrap:true }),
                kv('ธนาคารผู้โอน', bankLabel(info?.sending_bank_code)),
                kv('ธนาคารผู้รับ (จากสลิป)', bankLabel(info?.receiving_bank_code)),
                { type:'separator', margin:'md' },
                { type:'button', style:'link', action:{ type:'uri', label:'เพิ่มบัญชีรับเงิน', uri: env.ADD_RECEIVER_URL } }
            ] }
    };
    return flex('บัญชีผู้รับไม่ตรงกับบัญชีหลักของร้าน', bubble);
}

// ⏳ pending
export function buildFlexPending(transRef, info = {}) {
    const bubble = {
        type:'bubble',
        body:{ type:'box', layout:'vertical', spacing:'md', contents:[
                text('รอตรวจสอบสลิป', { weight:'bold', color:'#F59E0B' }),
                text('บางธนาคารอาจใช้เวลาประมาณ 2 นาที โปรดกดปุ่มเพื่อตรวจสอบอีกครั้ง', { size:'sm', color:'#6B7280', wrap:true }),
                kv('ธนาคารผู้โอน', bankLabel(info?.sending_bank_code)),
                kv('ธนาคารผู้รับ', bankLabel(info?.receiving_bank_code)),
                { type:'separator', margin:'md' },
                { type:'button', style:'link', action:{ type:'postback', label:'ตรวจสอบสลิปอีกครั้ง', data:`action=recheck&ref=${encodeURIComponent(transRef || '')}` } }
            ] }
    };
    return flex('รอตรวจสอบสลิป', bubble);
}

// ❌ invalid
export function buildFlexInvalid(msg, info = {}) {
    const parts = [
        text('ข้อมูลสลิปไม่ถูกต้อง', { weight:'bold', color:'#DC2626' }),
        text(msg || 'กรุณาตรวจสอบข้อมูลในสลิปอีกครั้ง หรืออาจเป็นสลิปหมดอายุ/ธนาคารต้นทางมีปัญหา', { size:'sm', color:'#6B7280', wrap:true })
    ];
    if (info?.sending_bank_code || info?.receiving_bank_code) {
        parts.push({ type:'separator', margin:'md' });
        parts.push(kv('ธนาคารผู้โอน', bankLabel(info?.sending_bank_code)));
        parts.push(kv('ธนาคารผู้รับ', bankLabel(info?.receiving_bank_code)));
    }
    return flex('ข้อมูลสลิปไม่ถูกต้อง', { type:'bubble', body:{ type:'box', layout:'vertical', spacing:'md', contents: parts }});
}

// 🚫 not a slip
export function buildFlexNotSlip() {
    return {
        type: 'flex',
        altText: 'ไม่พบสลิปในภาพ',
        contents: {
            type: 'bubble',
            body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [
                    text('ไม่พบสลิปในภาพ', { weight: 'bold', color: '#DC2626' }),
                    text('กรุณาส่งภาพสลิปโอนเงินที่ชัดเจน หรือถ่ายให้เห็น QR บนสลิปอย่างชัดเจน', { size:'sm', color:'#6B7280', wrap:true })
                ] }
        }
    };
}
