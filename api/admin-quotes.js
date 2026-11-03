module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  // PostgREST caps each response at 1000 rows, so page until a short page comes back —
  // otherwise older quotes silently vanish from the admin once there are more than 1000.
  const PAGE = 1000;
  const data = [];
  for (let offset = 0; ; offset += PAGE) {
    const resp = await fetch(
      `${SB_URL}/rest/v1/quotes?select=*&order=created_at.desc,quote_number.desc&limit=${PAGE}&offset=${offset}`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    if (!resp.ok) return res.status(502).json({ error: 'Supabase error' });
    const page = await resp.json();
    data.push(...page);
    if (page.length < PAGE) break;
  }
  return res.status(200).json(data);
};
