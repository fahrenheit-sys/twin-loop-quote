// Re-posts a quote's order to Hexicom from the admin, for the ones that didn't
// make it first time — Hexicom down, a timeout, a validation error we've since
// fixed. Re-posts the payload stored on the quote rather than rebuilding it: the
// pricing split depends on figures that only exist in the browser at quote time.
//
// Retrying a send that actually succeeded is safe. Hexicom enforces
// ExternalOrderID as unique, so the second attempt is rejected rather than
// creating a duplicate job.
const { postOrder } = require('../lib/hexicom');

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
    `${SB_URL}/rest/v1/quotes?quote_number=eq.${encodeURIComponent(quoteNumber)}&select=hexicom_payload,hexicom_status`,
    { headers: sbHeaders }
  );
  if (!lookup.ok) return res.status(502).json({ error: 'Supabase error' });

  const rows = await lookup.json();
  if (!rows.length) return res.status(404).json({ error: 'Quote not found' });

  const payload = rows[0].hexicom_payload;
  if (!payload) {
    return res.status(409).json({ error: 'No stored payload for this quote — it predates the Hexicom integration.' });
  }

  const result = await postOrder(payload);

  await fetch(`${SB_URL}/rest/v1/quotes?quote_number=eq.${encodeURIComponent(quoteNumber)}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      hexicom_status:   result.ok ? 'sent' : 'failed',
      hexicom_order_no: result.orderNo || null,
      hexicom_item_nos: result.itemNos || null,
      hexicom_sent_at:  new Date().toISOString(),
      hexicom_error:    result.ok ? null : String(result.error || '').slice(0, 1000),
    }),
  });

  if (!result.ok) {
    return res.status(502).json({
      error: result.error,
      status: result.status,
      maybeDuplicate: !!result.maybeDuplicate,
    });
  }
  return res.status(200).json({ ok: true, orderNo: result.orderNo, itemNos: result.itemNos });
};
