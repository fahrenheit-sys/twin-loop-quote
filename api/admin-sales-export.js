// Generates the MYOB import files for paid web orders not yet exported:
//   - a customer-cards CSV (import FIRST so Co./Last Name exists → avoids Error 190)
//   - a sales CSV in AccountRight's exact 49-column item-invoice layout
// Orders whose line items aren't mapped to a MYOB code are reported as "blocked"
// and left out until mapped. Does NOT mark orders exported — that's a separate
// confirm step (admin-sales-mark) after the import succeeds.
//
// GET ?mode=new (default, un-exported) | all (re-export everything paid)

const SALES_HEADERS = [
  'Co./Last Name', 'First Name', 'Addr 1 - Line 1', 'Addr 1 - Line 2', 'Addr 1 - Line 3', 'Addr 1 - Line 4',
  'Inclusive', 'Invoice No.', 'Date', 'Customer PO', 'Ship Via', 'Delivery Status', 'Item Number', 'Quantity',
  'Description', 'Price', 'Discount', 'Total', 'Job', 'Comment', 'Journal Memo', 'Salesperson Last Name',
  'Salesperson First Name', 'Shipping Date', 'Referral Source', 'Tax Code', 'Tax Amount', 'Freight Amount',
  'Freight Tax Code', 'Freight Tax Amount', 'Sale Status', 'Terms - Payment is Due', '            - Discount Days',
  '            - Balance Due Days', '            - % Discount', '            - % Monthly Charge', 'Amount Paid',
  'Payment Method', 'Payment Notes', 'Name on Card', 'Card Number', 'Authorisation Code', 'BSB', 'Account Number',
  'Drawer/Account Name', 'Cheque Number', 'Category', 'Card ID', 'Record ID',
];

const CARD_HEADERS = [
  'Co./Last Name', 'First Name', 'Card ID', 'Address Line 1', 'Address Line 2', 'Suburb', 'State', 'Postcode',
  'Country', 'Phone', 'Email',
];

const FREIGHT_LOCAL = 'FREIGHT OUT - LOCAL';       // NSW
const FREIGHT_INTERSTATE = 'FREIGHT OUT - interstate'; // VIC/QLD/ACT/SA/TAS

const CRLF = '\r\n';
const q6 = (n) => Number(n || 0).toFixed(6);
const p4 = (n) => '$' + Number(n || 0).toFixed(4);
const t2 = (n) => '$' + Number(n || 0).toFixed(2);
const invNo = (id) => 'WEB' + String(id).padStart(6, '0');

function auDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Company (B2B) is the card; else the person's full name. Kept identical in the
// cards CSV and the sales CSV so MYOB matches them.
function custName(a, email) {
  const co = (a && a.company && a.company.trim()) || '';
  if (co) return co;
  return (a && a.name && a.name.trim()) || email || 'Web Customer';
}

function tsv(headers, rowObjs) {
  const line = (obj) => headers.map((h) => String(obj[h] == null ? '' : obj[h]).replace(/[\t\r\n]/g, ' ')).join('\t');
  return [headers.join('\t'), ...rowObjs.map((r) => (r === null ? '' : line(r)))].join(CRLF) + CRLF;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const SB_URL = process.env.WEBSITE_SUPABASE_URL;
  const SB_KEY = process.env.WEBSITE_SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Website store DB not configured' });
  const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const get = (path) => fetch(`${SB_URL}/rest/v1/${path}`, { headers: H }).then((r) => r.json());

  const mode = (req.query.mode || 'new').toString();

  // MYOB-code lookups (small tables).
  const [products, variations] = await Promise.all([
    get('products?select=id,myob_code'),
    get('product_variations?select=id,myob_code'),
  ]);
  const pCode = new Map(products.map((p) => [p.id, p.myob_code]));
  const vCode = new Map(variations.map((v) => [v.id, v.myob_code]));

  // Paid orders (optionally only those not yet exported).
  let filter = 'status=eq.paid';
  if (mode !== 'all') filter += '&myob_exported_at=is.null';
  const orders = await get(
    `orders?${filter}&select=id,created_at,email,shipping,total,shipping_address,` +
      `order_items(name,quantity,unit_price,line_total,product_id,variation_id)&order=id.asc`
  );

  const salesRows = [];
  const cardsByName = new Map();
  const exportedIds = [];
  const blocked = [];

  for (const o of orders) {
    const a = o.shipping_address || {};
    const items = o.order_items || [];

    // Resolve each line's MYOB code; block the order if any line is unmapped.
    const unmapped = [];
    const lines = items.map((it) => {
      const code = it.variation_id ? vCode.get(it.variation_id) : pCode.get(it.product_id);
      if (!code) unmapped.push(it.name);
      return { it, code };
    });
    if (unmapped.length) {
      blocked.push({ order: invNo(o.id), items: unmapped });
      continue;
    }

    const coName = custName(a, o.email);
    const addr = {
      'Addr 1 - Line 1': a.line1 || '',
      'Addr 1 - Line 2': a.line2 || '',
      'Addr 1 - Line 3': [a.suburb, a.state, a.postcode].filter(Boolean).join(' '),
      'Addr 1 - Line 4': '',
    };
    const base = { 'Co./Last Name': coName, 'First Name': '', ...addr, Inclusive: '', 'Invoice No.': invNo(o.id), Date: auDate(o.created_at), 'Tax Code': 'GST', 'Sale Status': 'Open', Comment: `Twin Loop web order #${o.id}` };

    for (const { it, code } of lines) {
      salesRows.push({
        ...base,
        'Item Number': code,
        Quantity: q6(it.quantity),
        Description: it.name,
        Price: p4(it.unit_price),
        Discount: '',
        Total: t2(it.line_total),
      });
    }
    if (Number(o.shipping) > 0) {
      const freight = a.state === 'NSW' ? FREIGHT_LOCAL : FREIGHT_INTERSTATE;
      salesRows.push({
        ...base,
        'Item Number': freight,
        Quantity: q6(1),
        Description: 'Freight',
        Price: p4(o.shipping),
        Discount: '',
        Total: t2(o.shipping),
      });
    }
    salesRows.push(null); // blank row = invoice separator

    if (!cardsByName.has(coName)) {
      cardsByName.set(coName, {
        'Co./Last Name': coName,
        'First Name': '',
        'Card ID': '',
        'Address Line 1': a.line1 || '',
        'Address Line 2': a.line2 || '',
        Suburb: a.suburb || '',
        State: a.state || '',
        Postcode: a.postcode || '',
        Country: 'Australia',
        Phone: a.phone || '',
        Email: o.email || '',
      });
    }
    exportedIds.push(o.id);
  }

  return res.status(200).json({
    orderCount: exportedIds.length,
    orderIds: exportedIds,
    blocked,
    cardsCsv: tsv(CARD_HEADERS, [...cardsByName.values()]),
    salesCsv: tsv(SALES_HEADERS, salesRows),
  });
};
