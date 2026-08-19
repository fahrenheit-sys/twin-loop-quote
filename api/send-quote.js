// ── Binding info PDF URLs ─────────────────────────────────────────────────────
// Each binding type can have one or more setup guide PDFs attached to quotes.
const WIRE_BINDING_GUIDELINES_PDF          = 'https://twin-loop-quote.vercel.app/wire-binding-guidelines.pdf';
const PLASTIC_SPIRAL_BINDING_GUIDELINES_PDF = 'https://twin-loop-quote.vercel.app/plastic-spiral-binding-guidelines.pdf';

const BINDING_INFO_PDF_URLS = {
  'Prefect Binding': [
    'https://www.twinloop.com.au/wp-content/uploads/2021/06/Perfect-Binding-Layout-Guidlines_Jul-21.pdf',
  ],
  'Case Binding': [
    'https://www.twinloop.com.au/wp-content/uploads/2021/06/Case-Binding-Guidlines-March-2025-v2.pdf',
  ],
  'Wire Binding':   [WIRE_BINDING_GUIDELINES_PDF],
  'Plastic Spiral': [PLASTIC_SPIRAL_BINDING_GUIDELINES_PDF],
  'Comb':           [WIRE_BINDING_GUIDELINES_PDF],
};

// ── "Edit / duplicate this quote" link ────────────────────────────────────────
// The customer's answers travel inside the link itself, so there is nothing to look up
// and nothing to expire. index.html decodes this with the same field list (PORTABLE_FIELDS)
// and rebuilds the quote as a new, editable one.
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://quote.twinloop.online';
const PORTABLE_FIELDS = [
  'bindCategory', 'bindSubtype', 'wireColour', 'spiralColour', 'tentStandThickness',
  'qtys', 'leafSize', 'thicknessMethod', 'bookThicknessMM', 'leafCount', 'leafGSMValue',
  'hasTabs', 'tabCount', 'tabGSMValue',
  'frontCoverName', 'frontCoverGSM', 'frontSource', 'frontCollated', 'frontAddonName',
  'backCoverName', 'backCoverGSM', 'backSource', 'backCollated', 'backAddonName',
  'celloType', 'collating',
  'customerReference', 'customerName', 'customerCompany', 'customerEmail'
];

function quoteEditUrl(state) {
  const payload = {};
  PORTABLE_FIELDS.forEach(k => {
    if (state[k] !== undefined && state[k] !== '') payload[k] = state[k];
  });
  payload.extras = (state.selectedExtras || []).map(e => e.name);
  payload.from   = state.quoteNumber;
  const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${PUBLIC_URL}/?quote=${b64}`;
}

const FAST_TRACK_DEFAULT = `<p>Should you wish to proceed with the quote please send us a purchase order with the quote number. (Samples are always helpful especially if collating is involved.) If your job is time critical please email us as soon as possible so we can prepare ourselves and allocate production time to help meet your deadline.</p>`;

// ── Per-binding email template ────────────────────────────────────────────────
function getBindingTemplate(bindCategory, bindSubtype) {
  if (bindCategory === 'Prefect Binding') {
    if (bindSubtype === 'Robust (PUR) Glue') {
      return {
        subjectType: 'PUR Perfect Binding',
        greeting: 'Please find our quote for PUR Perfect Binding.',
        specsHtml: `
          <p>Please find attached the PDF outlining how we require the covers to be set out and how much bleed to provide on the text.</p>
          <p>We require coloured or oversized slip / divider sheets between each book.</p>
          <p>The minimum thickness we can PUR bind is 2mm and the recommended cover thickness is 300gsm with the maximum thickness of 350gsm cover.</p>
          <p>When supplying the covers please do not prescore and please do not pre trim the covers (leave this for us). Please follow our set up guidelines ensuring there is a 5mm ink free area either side of the inside spine.</p>
          <p>If there is any image on the inside covers that flows onto the first or last page of the book, then you need to shift the image on the inside cover and first and last page 6mm away from the binding edge (spine).</p>`,
        fastTrackHtml: `<p>Should you wish to proceed with the quote please send us a purchase order with the quote number. (Samples are always helpful especially if collating is involved.) Please supply us with overs in text and covers (a minimum of 5 overs in covers for line up and make readies). If your job is time critical please email us as soon as possible so we can prepare ourselves and allocate production time to help meet your deadline.</p>`,
      };
    }
    // EVA (default for Perfect Binding)
    return {
      subjectType: 'EVA Perfect Binding',
      greeting: 'Please find our quote for regular EVA Perfect Binding.',
      specsHtml: `
        <p>Please find attached the PDF outlining how we require the covers to be set out and how much bleed to provide on the text.</p>
        <p>We require coloured or oversized slip / divider sheets between each book.</p>
        <p>The minimum thickness we can EVA bind is 1.5mm and the recommended cover thickness is 300gsm with the maximum thickness of 350gsm cover.</p>
        <p>When supplying the covers please do not prescore and please do not pre trim the covers (leave this for us). Please follow our set up guidelines ensuring there is a 5mm ink free area either side of the inside spine.</p>
        <p>If there is any image on the inside covers that flows onto the first or last page of the book, then you need to shift the image on the inside cover and first and last page 6mm away from the binding edge (spine).</p>`,
      fastTrackHtml: `<p>Should you wish to proceed with the quote please send us a purchase order with the quote number. (Samples are always helpful especially if collating is involved.) Please supply us with overs in text and covers (a minimum of 5 overs in covers for line up and make readies). If your job is time critical please email us as soon as possible so we can prepare ourselves and allocate production time to help meet your deadline.</p>`,
    };
  }

  if (bindCategory === 'Case Binding') {
    return {
      subjectType: 'Case Binding',
      greeting: 'Please find our quote for Case Binding. This estimate includes Twin Loop Binding first binding a PUR text block, then manufacturing a hard cover and then casing in of the covers to the text block.',
      specsHtml: `
        <p>Please supply covers flat without trimming and without scoring; the stock should be between 170gsm and 180gsm. The covers need to have a 15mm bleed turn in.</p>
        <p>If you are supplying the end sheets please make sure that you are not using glossy stock.</p>
        <p>Please supply at least 10 overs of covers or 5% for manufacturing and set ups.</p>
        <p>We will supply plain folded end sheets; however if you require print on your end sheets then you will need to supply us the printed end sheets folded to final size.</p>
        <p>Please find attached the PDF outlining how we require the covers to be set out and how much bleed to provide including the turn in.</p>`,
      fastTrackHtml: FAST_TRACK_DEFAULT,
    };
  }

  if (bindCategory === 'Wire Binding') {
    const WIRE_FINISH_LABELS = {
      '1/2 Canadian':  '½ Canadian',
      'Full Canadian': 'Full Canadian',
    };
    const finishLabel = WIRE_FINISH_LABELS[bindSubtype];
    const greeting = finishLabel
      ? `Please find our quote for Twin Loop Wire Binding with a ${finishLabel} finish.`
      : 'Please find our quote for Twin Loop Wire Binding.';
    return {
      subjectType: 'Wire Binding',
      greeting,
      specsHtml: `
        <p>We only require divider sheets if we are required to add PVC fronts or backing boards. Covers need to be supplied flat and scored &mdash; please use the attached set up guidelines to ensure the correct size covers are supplied.</p>`,
      fastTrackHtml: FAST_TRACK_DEFAULT,
    };
  }

  if (bindCategory === 'Plastic Spiral') {
    return {
      subjectType: 'Plastic Spiral Binding',
      greeting: 'Please find our quote for Plastic Spiral Binding. Should you wish to proceed with the quote please supply the quote number with your purchase order.',
      specsHtml: `
        <p>We only require divider sheets if we are required to add PVC fronts or backing boards. Please remember to keep your image at least 10mm away from where we will be punching.</p>`,
      fastTrackHtml: FAST_TRACK_DEFAULT,
    };
  }

  if (bindCategory === 'Comb') {
    return {
      subjectType: 'Comb Binding',
      greeting: 'Please find our quote for Comb Binding. Should you wish to proceed with the quote please supply the quote number with your purchase order.',
      specsHtml: `
        <p>We only require divider sheets if we are required to add PVC fronts or backing boards. Please remember to keep your image at least 10mm away from where we will be punching.</p>`,
      fastTrackHtml: FAST_TRACK_DEFAULT,
    };
  }

  return {
    subjectType: 'Binding',
    greeting: 'Please find our quote below.',
    specsHtml: '',
    fastTrackHtml: FAST_TRACK_DEFAULT,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || !body.state) return res.status(400).json({ error: 'Missing data' });

  const { state, computed, quotePdfBase64, internalOnly } = body;
  const SB_URL  = process.env.SUPABASE_URL;
  const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
  const RESEND  = process.env.RESEND_API_KEY;

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
        // `addon` is the Twin Loop cover added alongside a client's own cover (PVC, Polyprop, etc).
        front_cover:      { name: state.frontCoverName, source: state.frontSource, collated: state.frontCollated, gsm: state.frontCoverGSM || null, addon: (state.frontAddonName && state.frontAddonName !== 'None') ? state.frontAddonName : null },
        back_cover:       { name: state.backCoverName,  source: state.backSource,  collated: state.backCollated,  gsm: state.backCoverGSM || null,  addon: (state.backAddonName  && state.backAddonName  !== 'None') ? state.backAddonName  : null },
        cello:            { type: state.celloType, cost: state.celloCost },
        inserts:          { tabs: state.qtyTabs, sheets: state.qtyExtraSheets },
        extras:           state.selectedExtras,
        totals:           computed.totals
      })
    });
  } catch (e) {
    console.error('Supabase save failed:', e.message);
  }

  // ── 2. Build email ────────────────────────────────────────────────────────
  // Note: the internal copy (step 5 below) always fires regardless of customerEmail —
  // Twin Loop should get a record of every quote generated, including PDF downloads
  // where the customer never asked for their own emailed copy.
  const template  = getBindingTemplate(state.bindCategory, state.bindSubtype);
  const emailHtml = buildEmailHtml(state, template);

  // ── 3. Build attachments ──────────────────────────────────────────────────
  const attachments = [];

  if (quotePdfBase64) {
    attachments.push({
      filename: `Quote-${state.quoteNumber}.pdf`,
      content:  quotePdfBase64
    });
  }

  const infoUrls = BINDING_INFO_PDF_URLS[state.bindCategory] || [];
  for (const url of infoUrls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const buf  = await resp.arrayBuffer();
        const b64  = Buffer.from(buf).toString('base64');
        const name = url.split('/').pop();
        attachments.push({ filename: name, content: b64 });
      }
    } catch (e) {
      console.error('Failed to fetch binding info PDF:', url, e.message);
    }
  }

  const emailPayload = (to, subject) => ({
    from:    'Twin Loop Binding <webquote@quote.twinloop.online>',
    to,
    subject,
    html:    emailHtml,
    ...(attachments.length > 0 ? { attachments } : {})
  });

  // ── 4. Send to customer ───────────────────────────────────────────────────
  // Skipped for internalOnly requests (e.g. the customer clicked "Download PDF" rather
  // than "Email Me This Quote") — only Twin Loop's internal copy is sent in that case.
  if (!internalOnly && state.customerEmail) {
    const customerSubject = `Your ${template.subjectType} Quote ${state.quoteNumber} — Twin Loop Binding`;
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload([state.customerEmail], customerSubject))
    });

    if (!emailRes.ok) {
      const err = await emailRes.json().catch(() => ({}));
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Email failed', detail: err });
    }
  }

  // ── 5. Internal copy ──────────────────────────────────────────────────────
  const internalSubject = `New Quote ${state.quoteNumber} — ${state.customerName || 'Unknown'}${state.customerCompany ? ' (' + state.customerCompany + ')' : ''} — ${template.subjectType}`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(emailPayload(['quotes@twinloop.com.au'], internalSubject))
  });

  return res.status(200).json({ success: true });
};

// ── Email HTML builder — template text only, quote is in the attached PDF ─────
function buildEmailHtml(state, template) {
  const today = new Date();
  const fDate = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const customerName = state.customerName || 'there';
  const editUrl = quoteEditUrl(state);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);">

  <div style="padding:24px 32px;border-bottom:2px solid #000;display:flex;justify-content:space-between;align-items:center;">
    <img src="https://www.twinloop.com.au/wp-content/uploads/2021/06/twinloop-header-logo-blueonwhite-@2x.png" height="45" alt="Twin Loop Binding">
    <div style="text-align:right;">
      <div style="font-size:22px;font-weight:bold;letter-spacing:2px;">QUOTE</div>
      <div style="font-size:12px;color:#555;margin-top:2px;">${state.quoteNumber}</div>
      ${state.customerReference ? `<div style="font-size:12px;color:#555;margin-top:2px;">Estimate Request #: ${state.customerReference}</div>` : ''}
      ${state.revisedFrom ? `<div style="font-size:12px;color:#555;margin-top:2px;">Revision of: ${state.revisedFrom}</div>` : ''}
      <div style="font-size:12px;color:#555;margin-top:2px;">Date: ${fDate(today)}</div>
    </div>
  </div>

  <div style="padding:24px 32px;border-bottom:1px solid #eee;font-size:13px;line-height:1.8;color:#333;">
    <p style="margin:0 0 16px;">Dear ${customerName},</p>
    <p style="margin:0 0 16px;">${template.greeting}</p>
    ${template.specsHtml ? `
    <p style="margin:20px 0 8px;font-weight:bold;">Our specifications</p>
    <div style="color:#444;line-height:1.8;">${template.specsHtml}</div>` : ''}
  </div>

  <div style="padding:20px 32px;border-bottom:1px solid #eee;">
    <table style="width:100%;border-collapse:collapse;background:#fff8e1;border:2px solid #000;border-radius:6px;">
      <tr>
        <td style="padding:16px 18px;font-size:13px;line-height:1.7;color:#000;">
          <div style="font-weight:bold;font-size:14px;margin-bottom:4px;">Please quote reference ${state.quoteNumber} on your purchase order</div>
          <div style="color:#444;">So that we can match your order to this estimate and get it into production without delay, please make sure quote reference <b>${state.quoteNumber}</b> is shown on any purchase order you send us.</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="padding:24px 32px;border-bottom:1px solid #eee;font-size:13px;line-height:1.8;color:#333;">
    <p style="margin:0 0 8px;font-weight:bold;">Fast Tracking Your Job</p>
    <div>${template.fastTrackHtml}</div>
  </div>

  <div style="padding:24px 32px;border-bottom:1px solid #eee;font-size:13px;line-height:1.8;color:#333;">
    <p style="margin:0 0 8px;font-weight:bold;">Need to change something?</p>
    <p style="margin:0 0 14px;color:#444;">You can open this quote back up with your answers already filled in, change whatever you need &mdash; quantities, sizes, covers, extras &mdash; and we'll issue it to you as a new quote.</p>
    <a href="${editUrl}" style="display:inline-block;padding:12px 22px;background:#000;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;font-size:13px;">Edit or duplicate this quote &rarr;</a>
  </div>

  <div style="padding:24px 32px;font-size:13px;line-height:1.8;color:#333;">
    <p style="margin:0 0 16px;">This quote is valid for 30 days. If you have any questions regarding our quote, please contact us either by email <a href="mailto:quotes@twinloop.com.au" style="color:#000;">quotes@twinloop.com.au</a> or by phone on <a href="tel:1300657850" style="color:#000;">1300 657 850</a>.</p>
    <p style="margin:0 0 4px;">Thanking you,</p>
    <p style="margin:0 0 4px;font-weight:bold;">Kind regards,</p>
    <p style="margin:0 0 2px;">Wayne Rubin &mdash; Managing Director</p>
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
