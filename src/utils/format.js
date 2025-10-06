import { bankCodeInfo } from './banks.js';

export function fmtTHB(n) {
    if (n == null || n === '') return '-';
    const v = Number(n);
    if (Number.isNaN(v)) return String(n);
    return v.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}
export function formatWhen(info = {}) {
    if (info.trans_timestamp) return info.trans_timestamp.replace('T',' ').replace('Z','');
    const d = info.trans_date || '';
    const t = info.trans_time || '';
    const dd = d && d.length === 8 ? `${d.slice(6,8)}-${d.slice(4,6)}-${d.slice(0,4)}` : d || '-';
    return t ? `${dd} (${t})` : dd;
}
export function mask(value) {
    if (!value) return '-';
    if (/x/i.test(value)) return value;
    return String(value).replace(/\d(?=\d{4})/g, 'x');
}
export function currencyFromNumeric(num) {
    if (num === 764 || num === '764') return 'THB';
    return num ? String(num) : null;
}
export function bankLabel(code) {
    if (!code && code !== 0) return '-';
    const info = bankCodeInfo(code);
    const code3 = String(code).padStart(3, '0');
    if (!info) return code3;
    return `${info.abbr} – ${info.fullTH} (${code3})`;
}
