// Marks web orders as exported to MYOB (sets myob_exported_at). Called after the
// staff have imported the CSVs into MYOB, so a failed import doesn't lose orders.
// POST { orderIds: number[] }
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const SB_URL = process.env.WEBSITE_SUPABASE_URL;
  const SB_KEY = process.env.WEBSITE_SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Website store DB not configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const ids = (body && Array.isArray(body.orderIds) ? body.orderIds : []).map(Number).filter(Number.isFinite);
  if (!ids.length) return res.status(400).json({ error: 'No order ids' });

  const resp = await fetch(`${SB_URL}/rest/v1/orders?id=in.(${ids.join(',')})`, {
    method: 'PATCH',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ myob_exported_at: new Date().toISOString() }),
  });
  if (!resp.ok) return res.status(502).json({ error: 'Mark failed', detail: await resp.text() });
  return res.status(200).json({ ok: true, marked: ids.length });
};
