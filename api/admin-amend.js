const BINDING_LABELS = {
  'Prefect Binding': 'Perfect Binding',
  'Case Binding':    'Case Binding',
  'Wire Binding':    'Wire Binding',
  'Plastic Spiral':  'Plastic Spiral Binding',
  'Plastic Comb':    'Plastic Comb Binding',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body   = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { quoteNumber, amendmentNote, amendedTotals } = body;

  if (!quoteNumber || !amendmentNote) {
    return res.status(400).json({ error: 'quoteNumber and amendmentNote required' });
  }

  const SB_URL  = process.env.SUPABASE_URL;
  const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
  const RESEND  = process.env.RESEND_API_KEY;

  // ── 1. Fetch original quote ───────────────────────────────────────────────
  const qResp = await fetch(
    `${SB_URL}/rest/v1/quotes?quote_number=eq.${encodeURIComponent(quoteNumber)}&select=*`,
    { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
  );
  const rows = await qResp.json();
  if (!rows || !rows.length) return res.status(404).json({ error: 'Quote not found' });
  const quote = rows[0];

  if (!quote.customer_email) {
    return res.status(400).json({ error: 'Quote has no customer email' });
  }

  // ── 2. Save amendment to Supabase ─────────────────────────────────────────
  await fetch(
    `${SB_URL}/rest/v1/quotes?quote_number=eq.${encodeURIComponent(quoteNumber)}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        status:          'amended',
        amendment_note:  amendmentNote,
        amended_totals:  amendedTotals || null,
        amended_at:      new Date().toISOString()
      })
    }
  );

  // ── 3. Build and send amended email ───────────────────────────────────────
  const effectiveTotals = amendedTotals || quote.totals || [];
  const bindLabel = BINDING_LABELS[quote.bind_category] || quote.bind_category;
  const html = buildAmendedEmailHtml(quote, amendmentNote, effectiveTotals, bindLabel);

  const subject = `AMENDED: Your ${bindLabel} Quote ${quote.quote_number} — Twin Loop Binding`;

  // Customer email
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Twin Loop Binding <webquote@quote.twinloop.online>',
      to:      [quote.customer_email],
      subject,
      html
    })
  });

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}));
    return res.status(500).json({ error: 'Email failed', detail: err });
  }

  // Internal copy
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Quote Tool <webquote@quote.twinloop.online>',
      to:      ['quotes@twinloop.com.au'],
      subject: `[AMENDED SENT] ${quote.quote_number} — ${quote.customer_name || 'Unknown'}${quote.customer_company ? ' (' + quote.customer_company + ')' : ''}`,
      html
    })
  });

  return res.status(200).json({ success: true });
};

function buildAmendedEmailHtml(quote, amendmentNote, totals, bindLabel) {
  const fmt   = v => new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const today = new Date();
  const fDate = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const customerName = quote.customer_name || 'there';
  const quantities   = quote.quantities || [];

  const qtyHeaders = quantities.map(q =>
    `<th style="text-align:right;padding:8px 14px;background:#f2f2f2;border-bottom:2px solid #000;">Qty&nbsp;${q}</th>`
  ).join('');

  const pricingRows = totals.length ? `
    <tr style="background:#000;color:#fff;">
      <td style="padding:12px 14px;font-weight:bold;font-size:15px;">TOTAL (INC GST)</td>
      ${totals.map(t => `<td style="text-align:right;padding:12px 14px;font-weight:bold;font-size:15px;">$${fmt(t.totalIncGST)}</td>`).join('')}
    </tr>` : '';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);">

  <div style="padding:24px 32px;border-bottom:3px solid #e67e22;display:flex;justify-content:space-between;align-items:center;">
    <img src="https://www.twinloop.com.au/wp-content/uploads/2021/06/twinloop-header-logo-blueonwhite-@2x.png" height="45" alt="Twin Loop Binding">
    <div style="text-align:right;">
      <div style="font-size:18px;font-weight:bold;letter-spacing:2px;color:#e67e22;">AMENDED QUOTE</div>
      <div style="font-size:12px;color:#555;margin-top:2px;">${quote.quote_number}</div>
      <div style="font-size:12px;color:#555;margin-top:2px;">Date: ${fDate(today)}</div>
    </div>
  </div>

  <div style="padding:20px 32px;background:#fff8f0;border-bottom:1px solid #f0d9b5;font-size:13px;line-height:1.7;">
    <p style="margin:0 0 6px;font-weight:bold;color:#e67e22;">Amendment</p>
    <p style="margin:0;color:#333;">${amendmentNote.replace(/\n/g, '<br>')}</p>
  </div>

  <div style="padding:24px 32px;border-bottom:1px solid #eee;font-size:13px;line-height:1.8;color:#333;">
    <p style="margin:0 0 6px;font-size:12px;color:#777;">Prepared for:</p>
    <p style="margin:0;font-size:15px;font-weight:bold;">${customerName}</p>
    ${quote.customer_company ? `<p style="margin:2px 0 0;font-size:13px;color:#555;">${quote.customer_company}</p>` : ''}
    <p style="margin:8px 0 0;font-size:12px;color:#666;">Binding: <strong>${bindLabel}${quote.bind_subtype ? ' — ' + quote.bind_subtype : ''}</strong></p>
  </div>

  ${totals.length ? `
  <div style="padding:24px 32px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="border-bottom:2px solid #000;">
        <th style="text-align:left;padding:8px 14px;background:#f2f2f2;">Description</th>
        ${qtyHeaders}
      </tr>
      ${pricingRows}
    </table>
  </div>` : ''}

  <div style="padding:24px 32px;font-size:13px;line-height:1.8;color:#333;">
    <p style="margin:0 0 16px;">This quote is valid for 30 days. If you have any questions please contact us by email <a href="mailto:quotes@twinloop.com.au" style="color:#000;">quotes@twinloop.com.au</a> or phone <a href="tel:1300657850" style="color:#000;">1300 657 850</a>.</p>
    <p style="margin:0 0 4px;">Kind regards,</p>
    <p style="margin:0 0 2px;font-weight:bold;">Wayne Rubin — Managing Director</p>
    <p style="margin:0;"><a href="mailto:wayne@twinloop.com.au" style="color:#000;">wayne@twinloop.com.au</a></p>
  </div>

  <div style="padding:20px 32px;background:#f8f9fa;border-top:2px solid #000;font-size:12px;color:#555;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:4px 0;vertical-align:top;width:40%;"><strong>Twin Loop Binding Pty Ltd</strong><br>15 Hugh Street, Belmore 2192</td>
        <td style="padding:4px 0;vertical-align:top;">
          P &nbsp;<a href="tel:1300657850" style="color:#000;">1300 657 850</a><br>
          <a href="mailto:quotes@twinloop.com.au" style="color:#000;">quotes@twinloop.com.au</a><br>
          <a href="https://www.twinloop.com.au" style="color:#000;">www.twinloop.com.au</a>
        </td>
        <td style="padding:4px 0;vertical-align:top;text-align:right;color:#999;font-size:11px;">ABN 78 082 258 035</td>
      </tr>
    </table>
  </div>

</div>
</body>
</html>`;
}
