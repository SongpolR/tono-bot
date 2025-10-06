// TH bank codes (per your list)
const BANKS = {
    '002': { abbr: 'BBL',   fullTH: 'ธนาคารกรุงเทพ' },
    '004': { abbr: 'KBANK', fullTH: 'ธนาคารกสิกรไทย' },
    '006': { abbr: 'KTB',   fullTH: 'ธนาคารกรุงไทย' },
    '011': { abbr: 'TTB',   fullTH: 'ธนาคารทหารไทยธนชาต' },
    '014': { abbr: 'SCB',   fullTH: 'ธนาคารไทยพาณิชย์' },
    '025': { abbr: 'BAY',   fullTH: 'ธนาคารกรุงศรีอยุธยา' },
    '069': { abbr: 'KKP',   fullTH: 'ธนาคารเกียรตินาคินภัทร' },
    '022': { abbr: 'CIMBT', fullTH: 'ธนาคารซีไอเอ็มบีไทย' },
    '067': { abbr: 'TISCO', fullTH: 'ธนาคารทิสโก้' },
    '024': { abbr: 'UOBT',  fullTH: 'ธนาคารยูโอบี' },
    '071': { abbr: 'TCD',   fullTH: 'ธนาคารไทยเครดิตเพื่อรายย่อย' },
    '073': { abbr: 'LHFG',  fullTH: 'ธนาคารแลนด์ แอนด์ เฮ้าส์' },
    '070': { abbr: 'ICBCT', fullTH: 'ธนาคารไอซีบีซี (ไทย)' },
    '098': { abbr: 'SME',   fullTH: 'ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย' },
    '034': { abbr: 'BAAC',  fullTH: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร' },
    '035': { abbr: 'EXIM',  fullTH: 'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย' },
    '030': { abbr: 'GSB',   fullTH: 'ธนาคารออมสิน' },
    '033': { abbr: 'GHB',   fullTH: 'ธนาคารอาคารสงเคราะห์' }
};

export function bankCodeInfo(code) {
    if (code == null || code === '') return null;
    const key = String(code).padStart(3, '0');
    return BANKS[key] || null;
}
export function bankCodeToName(code, opts = {}) {
    const info = bankCodeInfo(code);
    if (!info) return null;
    const fmt = opts.format || 'full';
    if (fmt === 'abbr') return info.abbr;
    if (fmt === 'both') return `${info.abbr} – ${info.fullTH} (${String(code).padStart(3,'0')})`;
    return info.fullTH;
}
