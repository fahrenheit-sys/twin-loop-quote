module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || !body.state) return res.status(400).json({ error: 'Missing data' });

  const { state, computed } = body;
  const SB_URL   = process.env.SUPABASE_URL;
  const SB_KEY   = process.env.SUPABASE_SERVICE_KEY;
  const RESEND    = process.env.RESEND_API_KEY;

  // ── 1. Save quote to Supabase ─────────────────────────────────────────────
  try {
    await fetch(`${SB_URL}/rest/v1/quotes`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        quote_number:     state.quoteNumber,
        customer_name:    state.customerName    || null,
        customer_company: state.customerCompany || null,
        customer_email:   state.customerEmail   || null,
        bind_category:    state.bindCategory,
        bind_subtype:     state.bindSubtype,
        leaf_size:        state.leafSize,
        leaf_count:       parseInt(state.leafCount)     || 0,
        gsm:              parseInt(state.leafGSMValue)  || 0,
        spine_mm:         computed.spineMM,
        wire_size:        computed.wireSize || null,
        quantities:       state.qtys,
        front_cover:      { name: state.frontCoverName, source: state.frontSource, collated: state.frontCollated },
        back_cover:       { name: state.backCoverName,  source: state.backSource,  collated: state.backCollated  },
        cello:            { type: state.celloType, cost: state.celloCost },
        inserts:          { tabs: state.qtyTabs, sheets: state.qtyExtraSheets },
        extras:           state.selectedExtras,
        totals:           computed.totals
      })
    });
  } catch (e) {
    console.error('Supabase save failed:', e.message);
    // Continue — still send the email even if DB save fails
  }

  // ── 2. Send email via Resend ──────────────────────────────────────────────
  if (!state.customerEmail) {
    return res.status(200).json({ success: true, note: 'No email address — quote saved only' });
  }

  const emailHtml = buildEmailHtml(state, computed);

  // Send quote to customer
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from:    'Twin Loop Binding <webquote@quote.twinloop.online>',
      to:      [state.customerEmail],
      subject: `Your Quote ${state.quoteNumber} — Twin Loop Binding`,
      html:    emailHtml
    })
  });

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}));
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Email failed', detail: err });
  }

  // Send internal notification to Twin Loop
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from:    'Quote Tool <webquote@quote.twinloop.online>',
      to:      ['quotes@twinloop.com.au'],
      subject: `New Quote ${state.quoteNumber} — ${state.customerName || 'Unknown'} ${state.customerCompany ? '(' + state.customerCompany + ')' : ''}`.trim(),
      html:    emailHtml
    })
  });

  return res.status(200).json({ success: true });
};

// ── Email HTML builder ────────────────────────────────────────────────────────
function buildEmailHtml(state, computed) {
  const fmt  = v => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const today = new Date();
  const valid = new Date(); valid.setDate(today.getDate() + 30);
  const fDate = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const { items, totals, hasCollating, collRate, collMin, celloSetupFee } = computed;
  const leafCount = parseFloat(state.leafCount || 0);

  const qtyHeaders = state.qtys.map(q =>
    `<th style="text-align:right;padding:8px 14px;background:#f2f2f2;border-bottom:2px solid #000;">Qty&nbsp;${q}</th>`
  ).join('');

  const itemRows = items.map(i => `
    <tr>
      <td style="padding:6px 14px;border-bottom:1px solid #f0f0f0;">${i.label}</td>
      ${state.qtys.map(q => `<td style="text-align:right;padding:6px 14px;border-bottom:1px solid #f0f0f0;">$${fmt(i.unit * q)}</td>`).join('')}
    </tr>`).join('');

  const collRow = hasCollating ? `
    <tr>
      <td style="padding:6px 14px;border-bottom:1px solid #f0f0f0;">Collating</td>
      ${state.qtys.map(q => {
        const cost = Math.max(collMin, (q * leafCount / 1000) * collRate);
        return `<td style="text-align:right;padding:6px 14px;border-bottom:1px solid #f0f0f0;">$${fmt(cost)}</td>`;
      }).join('')}
    </tr>` : '';

  const setupRow = celloSetupFee > 0 ? `
    <tr>
      <td style="padding:6px 14px;border-bottom:1px solid #f0f0f0;">Glazing Setup Fee</td>
      ${state.qtys.map(() => `<td style="text-align:right;padding:6px 14px;border-bottom:1px solid #f0f0f0;">$${fmt(celloSetupFee)}</td>`).join('')}
    </tr>` : '';

  const discountRow = `
    <tr>
      <td style="padding:6px 14px;color:#c0392b;font-weight:bold;">Volume Discount</td>
      ${totals.map(t => `<td style="text-align:right;padding:6px 14px;color:#c0392b;font-weight:bold;">-${t.discountPct}% (-$${fmt(t.discountAmt)})</td>`).join('')}
    </tr>`;

  const totalRow = `
    <tr style="background:#000;color:#fff;">
      <td style="padding:12px 14px;font-weight:bold;font-size:15px;">TOTAL (INC GST)</td>
      ${totals.map(t => `<td style="text-align:right;padding:12px 14px;font-weight:bold;font-size:15px;">$${fmt(t.totalIncGST)}</td>`).join('')}
    </tr>`;

  const leafStackMM = (leafCount * parseFloat(state.leafMM || 0)).toFixed(2);
  const techDetails = [
    `${leafCount} leaves &times; ${state.leafMM}mm (${state.leafGSMValue}gsm) = <strong>${leafStackMM}mm</strong>`,
    state.frontCoverName !== 'None' ? `Front cover (${state.frontCoverName}): <strong>${state.frontCoverMM}mm</strong>` : null,
    state.backCoverName  !== 'None' ? `Back cover (${state.backCoverName}): <strong>${state.backCoverMM}mm</strong>`   : null,
    `Spine total: <strong>${parseFloat(computed.spineMM).toFixed(2)}mm</strong>${computed.wireSize ? ` &rarr; Wire: <strong>${computed.wireSize}</strong>` : ''}`
  ].filter(Boolean).join(' &nbsp;|&nbsp; ');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);">

  <div style="padding:24px 32px;border-bottom:2px solid #000;display:flex;justify-content:space-between;align-items:center;">
    <img src="https://www.twinloop.com.au/wp-content/uploads/2021/06/twinloop-header-logo-blueonwhite-@2x.png" height="45" alt="Twin Loop Binding">
    <div style="text-align:right;">
      <div style="font-size:22px;font-weight:bold;letter-spacing:2px;">QUOTE</div>
      <div style="font-size:12px;color:#555;margin-top:2px;">${state.quoteNumber}</div>
    </div>
  </div>

  <div style="padding:20px 32px;background:#f8f9fa;border-bottom:1px solid #eee;">
    <p style="margin:0 0 2px;font-size:12px;color:#777;">Prepared for:</p>
    <p style="margin:0;font-size:16px;font-weight:bold;">${state.customerName || ''}</p>
    ${state.customerCompany ? `<p style="margin:2px 0 0;font-size:13px;color:#555;">${state.customerCompany}</p>` : ''}
    <p style="margin:8px 0 0;font-size:12px;color:#666;">Date: ${fDate(today)} &nbsp;&bull;&nbsp; Valid until: ${fDate(valid)}</p>
  </div>

  <div style="padding:24px 32px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="border-bottom:2px solid #000;">
        <th style="text-align:left;padding:8px 14px;background:#f2f2f2;">Description</th>
        ${qtyHeaders}
      </tr>
      ${itemRows}
      ${collRow}
      ${setupRow}
      ${discountRow}
      ${totalRow}
    </table>
  </div>

  <div style="padding:16px 32px;background:#f4f4f4;border-top:1px solid #ddd;font-size:12px;color:#555;">
    <strong>Technical Details:</strong><br>
    <span style="line-height:2;">${techDetails}</span>
  </div>

  <div style="padding:20px 32px;border-top:1px solid #eee;font-size:12px;color:#666;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:4px 0;vertical-align:top;width:40%;">
          <strong>Twin Loop Binding</strong><br>
          15 Hugh Street<br>
          Belmore, NSW 2192
        </td>
        <td style="padding:4px 0;vertical-align:top;width:30%;">
          <a href="tel:1300657850" style="color:#000;">1300 657 850</a><br>
          <a href="mailto:quotes@twinloop.com.au" style="color:#000;">quotes@twinloop.com.au</a><br>
          <a href="https://www.twinloop.com.au" style="color:#000;">twinloop.com.au</a>
        </td>
        <td style="padding:4px 0;vertical-align:top;text-align:right;color:#999;font-size:11px;">
          ABN 78 082 258 035
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:10px;">All prices in AUD and include GST. Quote valid for 30 days from date of issue. Minimum job cost $50.</p>
  </div>

</div>
</body>
</html>`;
}
