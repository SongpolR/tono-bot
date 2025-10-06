import sharp from 'sharp';
import {
    MultiFormatReader,
    BarcodeFormat,
    DecodeHintType,
    RGBLuminanceSource,
    BinaryBitmap,
    HybridBinarizer
} from '@zxing/library';

export async function extractQrPayload(imgBuffer) {
    const reader = new MultiFormatReader();
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    reader.setHints(hints);

    const widths = [480, 720, 1024];
    for (const w of widths) {
        try {
            const {data, info} = await sharp(imgBuffer)
                .resize({width: w, withoutEnlargement: true})
                .greyscale()
                .raw()
                .toBuffer({resolveWithObject: true});

            const luminance = new Uint8ClampedArray(data);
            const source = new RGBLuminanceSource(luminance, info.width, info.height);
            const bitmap = new BinaryBitmap(new HybridBinarizer(source));
            const result = reader.decode(bitmap);
            if (result?.getText) return String(result.getText());
        } catch { /* keep trying */
        }
    }
    return null;
}

export function looksLikeThaiSlipPayload(qr) {
    if (!qr) return false;
    if (/^000201/.test(qr)) return true;
    if (/A0000006770101/i.test(qr)) return true;
    if (/5102TH/i.test(qr)) return true;
    return qr.length >= 30 && /^[A-Z0-9]+$/i.test(qr);
}
