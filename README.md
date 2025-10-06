# Tono Bot (LINE OA – Slip Verification)

## Quick start

1. `cp .env.example .env` and fill values.
2. `npm i`
3. `npm run dev` (or `npm start`)

## Notes

- Keep **/webhook** route without `express.json()` BEFORE it.
- Image flow:
  1. Download image → ZXing QR pre-check.
  2. Call SlipOK raw (fallback: image).
  3. Reply Flex (success / pending / invalid).
