// Lists the webstore's products (+ variations) with their current MYOB code,
// for the admin MYOB-mapping tab. Reads the website's Supabase.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const SB_URL = process.env.WEBSITE_SUPABASE_URL;
  const SB_KEY = process.env.WEBSITE_SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Website store DB not configured' });

  // Product-level `attributes` gives the full option list and the attribute
  // order, so the mapping table can show which options a variation left as
  // "Any" in WooCommerce (e.g. colour) instead of silently omitting them.
  const select =
    'id,name,sku,type,myob_code,menu_order,attributes,' +
    'product_variations(id,sku,attributes,myob_code,menu_order)';

  const resp = await fetch(
    `${SB_URL}/rest/v1/products?select=${select}&status=eq.publish&order=menu_order.asc,name.asc`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  if (!resp.ok) return res.status(502).json({ error: 'Website store DB error', detail: await resp.text() });
  const data = await resp.json();
  return res.status(200).json(data);
};
