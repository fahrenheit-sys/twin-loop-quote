// Searchable MYOB item list for the mapping picker. ?q= filters by item number
// or name; ?offset= pages through the matches. Reads the website's Supabase
// myob_items table. Returns { items, total, offset, limit } — `total` is the
// full match count so the picker can page instead of silently truncating.
const PAGE = 100;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const SB_URL = process.env.WEBSITE_SUPABASE_URL;
  const SB_KEY = process.env.WEBSITE_SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Website store DB not configured' });

  const q = (req.query.q || '').toString().trim();
  const offset = Math.max(0, Number(req.query.offset) || 0);

  let path = `myob_items?select=item_number,item_name,price&order=item_number.asc`;
  if (q) {
    // PostgREST needs commas in the pattern encoded; ilike is case-insensitive.
    const pat = `*${q.replace(/[(),]/g, ' ')}*`;
    path += `&or=(item_number.ilike.${encodeURIComponent(pat)},item_name.ilike.${encodeURIComponent(pat)})`;
  }

  const resp = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      // Range beats limit/offset here: it makes PostgREST return the exact
      // match count in Content-Range, which limit= alone does not.
      Range: `${offset}-${offset + PAGE - 1}`,
      Prefer: 'count=exact',
    },
  });
  if (!resp.ok) return res.status(502).json({ error: 'Website store DB error', detail: await resp.text() });

  const items = await resp.json();
  const total = Number((resp.headers.get('content-range') || '').split('/')[1]) || items.length;
  return res.status(200).json({ items, total, offset, limit: PAGE });
};
