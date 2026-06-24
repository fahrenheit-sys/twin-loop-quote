module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  const resp = await fetch(
    `${SB_URL}/rest/v1/quotes?select=*&order=created_at.desc`,
    { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
  );

  if (!resp.ok) return res.status(502).json({ error: 'Supabase error' });
  const data = await resp.json();
  return res.status(200).json(data);
};
