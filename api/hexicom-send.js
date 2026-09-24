// Re-posts a quote's order to Hexicom from the admin, for the ones that didn't
// make it first time — Hexicom down, a timeout, a validation error we've since
// fixed. Re-posts the payload stored on the quote rather than rebuilding it: the
// pricing split depends on figures that only exist in the browser at quote time.
//
// A quote carries one order per quantity tier. Orders already recorded as sent
// are skipped, so a retry only re-posts the ones that failed. Anything re-posted
// that did in fact get through is rejected by Hexicom as a duplicate id rather
// than creating a second job.
const { postOrders, hexicomColumns, asPayloadList } = require('../lib/hexicom');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const quoteNumber = body && body.quoteNumber;
  if (!quoteNumber) return res.status(400).json({ error: 'Missing quote number' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const lookup = await fetch(
    `${SB_URL}/rest/v1/quotes?quote_number=eq.${encodeURIComponent(quoteNumber)}&select=hexicom_payload,hexicom_status,hexicom_item_nos`,
    { headers: sbHeaders }
  );
  if (!lookup.ok) return res.status(502).json({ error: 'Supabase error' });

  const rows = await lookup.json();
  if (!rows.length) return res.status(404).json({ error: 'Quote not found' });

  const payloads = asPayloadList(rows[0].hexicom_payload);
  if (!payloads.length) {
    return res.status(409).json({ error: 'No stored payload for this quote — it predates the Hexicom integration.' });
  }

  // Per-order results from earlier attempts, where the row has them. Rows from
  // before 2026-09-24 hold a single order and store raw item numbers here instead.
  let previous = [];
  try {
    const parsed = JSON.parse(rows[0].hexicom_item_nos || '[]');
    if (Array.isArray(parsed) && parsed.every(r => r && typeof r === 'object' && 'id' in r)) previous = parsed;
  } catch { /* not JSON — an older row */ }

  const results = await postOrders(payloads, previous);
  const cols = hexicomColumns(results);

  await fetch(`${SB_URL}/rest/v1/quotes?quote_number=eq.${encodeURIComponent(quoteNumber)}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(cols),
  });

  if (cols.hexicom_status !== 'sent') {
    return res.status(502).json({
      error: cols.hexicom_error,
      status: cols.hexicom_status,
      orderNo: cols.hexicom_order_no,
      maybeDuplicate: results.some(r => !r.ok && r.maybeDuplicate),
    });
  }
  return res.status(200).json({ ok: true, orderNo: cols.hexicom_order_no, itemNos: cols.hexicom_item_nos });
};
