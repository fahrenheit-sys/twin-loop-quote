// Lists website store orders (sales) for the admin's Sales tab. Reads the
// WEBSITE's Supabase (a separate project from the quote tool), so the one admin
// shows both quotes and sales without merging databases. Same ADMIN_PASSWORD.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SB_URL = process.env.WEBSITE_SUPABASE_URL;
  const SB_KEY = process.env.WEBSITE_SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Website store DB not configured' });

  // Sales = orders that got past the pending (abandoned-cart) stage.
  const select =
    'id,created_at,status,email,subtotal,gst,shipping,total,shipping_address,stripe_payment_intent,' +
    'order_items(name,sku,unit_price,quantity,line_total)';

  const resp = await fetch(
    `${SB_URL}/rest/v1/orders?status=neq.pending&select=${select}&order=created_at.desc`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );

  if (!resp.ok) return res.status(502).json({ error: 'Website store DB error' });
  const data = await resp.json();
  return res.status(200).json(data);
};
