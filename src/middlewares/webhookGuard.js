// Rejects non-POST, missing signature, or wrong content-type before LINE middleware runs.
export function webhookGuard(req, res, next) {
  if (req.method !== 'POST') return res.status(405).end(); // Method Not Allowed

  const sig = req.get('x-line-signature');
  if (!sig) return res.status(403).send('Forbidden'); // must have HMAC from LINE

  const ct = (req.get('content-type') || '').toLowerCase();
  if (!ct.startsWith('application/json')) {
    return res.status(415).send('Unsupported Media Type'); // LINE sends application/json
  }

  return next();
}
