// Proxies a store order's tax-invoice PDF from the website, so the admin can
// view/download it. Keeps the website's invoice token server-side (never in the
// browser). Auth is the same ADMIN_PASSWORD as the rest of the admin.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orderId = parseInt(req.query.order, 10);
  if (!orderId) return res.status(400).json({ error: 'Missing order id' });

  const base = process.env.WEBSITE_URL; // e.g. https://web.twinloop.online
  const token = process.env.ADMIN_INVOICE_TOKEN;
  if (!base || !token) return res.status(500).json({ error: 'Invoice source not configured' });

  const resp = await fetch(`${base}/api/admin/invoice?order=${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) return res.status(resp.status).json({ error: 'Could not fetch invoice' });

  const buf = Buffer.from(await resp.arrayBuffer());
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Tax-Invoice-TL-${String(orderId).padStart(6, '0')}.pdf"`);
  return res.status(200).send(buf);
};
