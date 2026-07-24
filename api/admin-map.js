// Saves a MYOB code onto a webstore product or variation.
// POST { target: 'product'|'variation', id: number, code: string|null }
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const SB_URL = process.env.WEBSITE_SUPABASE_URL;
  const SB_KEY = process.env.WEBSITE_SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Website store DB not configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { target, id } = body || {};
  const code = body && body.code != null && String(body.code).trim() !== '' ? String(body.code).trim() : null;

  const table = target === 'product' ? 'products' : target === 'variation' ? 'product_variations' : null;
  if (!table || !Number.isFinite(Number(id))) return res.status(400).json({ error: 'Bad request' });

  const resp = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${Number(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ myob_code: code }),
  });
  if (!resp.ok) return res.status(502).json({ error: 'Save failed', detail: await resp.text() });
  return res.status(200).json({ ok: true, code });
};
