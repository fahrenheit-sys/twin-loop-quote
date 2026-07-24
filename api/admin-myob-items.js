// Searchable MYOB item list for the mapping picker. ?q= filters by item number
// or name. Reads the website's Supabase myob_items table.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const SB_URL = process.env.WEBSITE_SUPABASE_URL;
  const SB_KEY = process.env.WEBSITE_SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Website store DB not configured' });

  const q = (req.query.q || '').toString().trim();
  let path = `myob_items?select=item_number,item_name,price&order=item_number.asc&limit=50`;
  if (q) {
    // PostgREST needs commas in the pattern encoded; ilike is case-insensitive.
    const pat = `*${q.replace(/[(),]/g, ' ')}*`;
    path = `myob_items?select=item_number,item_name,price&or=(item_number.ilike.${encodeURIComponent(pat)},item_name.ilike.${encodeURIComponent(pat)})&order=item_number.asc&limit=50`;
  }

  const resp = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!resp.ok) return res.status(502).json({ error: 'Website store DB error', detail: await resp.text() });
  const data = await resp.json();
  return res.status(200).json(data);
};
