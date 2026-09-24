// ── Binding info PDF URLs ─────────────────────────────────────────────────────
// Each binding type can have one or more setup guide PDFs attached to quotes.
const PERFECT_BINDING_GUIDELINES_PDF       = 'https://twin-loop-quote.vercel.app/perfect-binding-guidelines.pdf';
const WIRE_BINDING_GUIDELINES_PDF          = 'https://twin-loop-quote.vercel.app/wire-binding-guidelines.pdf';
const PLASTIC_SPIRAL_BINDING_GUIDELINES_PDF = 'https://twin-loop-quote.vercel.app/plastic-spiral-binding-guidelines.pdf';
const CASE_BINDING_GUIDELINES_PDF           = 'https://twin-loop-quote.vercel.app/case-binding-guidelines.pdf';

const BINDING_INFO_PDF_URLS = {
  'Prefect Binding': [PERFECT_BINDING_GUIDELINES_PDF],
  'Case Binding': [CASE_BINDING_GUIDELINES_PDF],
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
  'qtys', 'leafSize', 'bindEdge', 'thicknessMethod', 'bookThicknessMM', 'leafCount', 'leafGSMValue',
  'hasTabs', 'tabCount', 'tabGSMValue',
  'frontCoverName', 'frontCoverGSM', 'frontSource', 'frontCollated', 'frontAddonName',
  'backCoverName', 'backCoverGSM', 'backSource', 'backCollated', 'backAddonName',
  'celloType', 'collating', 'collatingLeaves',
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

const { buildOrders, postOrders, hexicomColumns } = require('../lib/hexicom');

// Every quote is recorded exactly once per quote number — saved to Supabase, copied
// to quotes@twinloop.com.au, flagged to Wayne if it's large, and posted to Hexicom.
// The browser records it the moment the finished quote is shown (`mode: 'record'`);
// "Email Me This Quote" then only adds the customer's copy.
//
// Until 2026-09-24 none of that happened unless the customer clicked Email or
// Download. A customer who read the quote on screen, printed it or noted the
// number and sent a PO left Twin Loop with nothing — not in the admin, not in
// Hexicom, not in quotes@. Wayne found 2026-09-17-P798 (Morgan Printing) that way.
// Recording once also ends the duplicate rows and double internal emails that
// Email + Download used to produce, and stops a second click re-posting to Hexicom
// and flipping a sent quote to "Failed" on the duplicate-id rejection.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || !body.state) return res.status(400).json({ error: 'Missing data' });

  const { state, computed, quotePdfBase64 } = body;
  // `internalOnly` is what pages cached before 2026-09-24 send from Download PDF.
  const recordOnly = body.mode === 'record' || !!body.internalOnly;
  const SB_URL  = process.env.SUPABASE_URL;
  const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
  const RESEND  = process.env.RESEND_API_KEY;
  const sbHeaders = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` };
  const quoteFilter = `quote_number=eq.${encodeURIComponent(state.quoteNumber)}`;

  // ── 0. Already recorded? ──────────────────────────────────────────────────
  // If the lookup itself fails we record anyway: a duplicate row is a nuisance,
  // a missing quote is what this whole route exists to prevent.
  let alreadyRecorded = false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/quotes?${quoteFilter}&select=quote_number&limit=1`, { headers: sbHeaders });
    if (r.ok) alreadyRecorded = (await r.json()).length > 0;
    else console.error('Supabase lookup failed:', r.status, await r.text().catch(() => ''));
  } catch (e) {
    console.error('Supabase lookup failed:', e.message);
  }

  const template = getBindingTemplate(state.bindCategory, state.bindSubtype);
  const emailHtml = buildEmailHtml(state, template);
  const attachments = alreadyRecorded && recordOnly ? [] : await buildAttachments(state, quotePdfBase64);
  const emailPayload = (to, subject) => ({
    from:    'Twin Loop Binding <webquote@quote.twinloop.online>',
    to,
    subject,
    html:    emailHtml,
    ...(attachments.length > 0 ? { attachments } : {})
  });

  let saved = alreadyRecorded;
  let hexicomResults = null;

  if (!alreadyRecorded) {
    // Built before the save so the payloads are stored on the row — a retry from the
    // admin can then re-post them without the browser-side pricing maths, which is
    // gone by then. A failure here must never stop the quote going out.
    let hexicomPayloads = null;
    try {
      hexicomPayloads = buildOrders({ state, computed, testMode: process.env.HEXICOM_TEST_MODE === '1' });
    } catch (e) {
      console.error('Hexicom payload build failed:', e.message);
    }

    // ── 1. Save quote to Supabase ───────────────────────────────────────────
    // The response is checked now. It used to be discarded, so a rejected insert
    // lost the quote from the admin with nothing anywhere to say so.
    try {
      const r = await fetch(`${SB_URL}/rest/v1/quotes`, {
        method: 'POST',
        headers: { ...sbHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(quoteRow(state, computed, hexicomPayloads))
      });
      saved = r.ok;
      if (!r.ok) console.error('Supabase save rejected:', r.status, (await r.text().catch(() => '')).slice(0, 500));
    } catch (e) {
      console.error('Supabase save failed:', e.message);
    }

    // ── 2. Internal copy ────────────────────────────────────────────────────
    // Sent before the customer's copy and never gated on it, so a mistyped
    // customer address can't cost Twin Loop its record of the quote. A real 422
    // ("Invalid `to` field") did exactly that between 19 Aug and 1 Sep 2026.
    const internalSubject = `New Quote ${state.quoteNumber} — ${state.customerName || 'Unknown'}${state.customerCompany ? ' (' + state.customerCompany + ')' : ''} — ${template.subjectType}` +
      (saved ? '' : ' — NOT SAVED TO ADMIN');
    try {
      const internalRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload(['quotes@twinloop.com.au'], internalSubject))
      });
      if (!internalRes.ok) {
        const err = await internalRes.json().catch(() => ({}));
        console.error('Resend error (internal copy to quotes@twinloop.com.au):', err);
      }
    } catch (e) {
      console.error('Internal copy failed:', e.message);
    }

    // ── 3. Estimate Follow Up for high-value quotes ─────────────────────────
    await sendFollowUp(state, computed, template, RESEND);

    // ── 4. Post the orders to Hexicom ───────────────────────────────────────
    // One order per quantity tier. Failures are recorded, not raised: the
    // customer's quote has still gone out, and the admin can retry.
    if (hexicomPayloads && hexicomPayloads.length) {
      hexicomResults = await postOrders(hexicomPayloads);
      if (saved) {
        try {
          await fetch(`${SB_URL}/rest/v1/quotes?${quoteFilter}`, {
            method: 'PATCH',
            headers: { ...sbHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify(hexicomColumns(hexicomResults))
          });
        } catch (e) {
          console.error('Could not record Hexicom result:', e.message);
        }
      }
    }
  }

  // ── 5. Send to customer ───────────────────────────────────────────────────
  // Last, so a rejected customer address can no longer skip anything above.
  if (!recordOnly && state.customerEmail) {
    const customerSubject = `Your ${template.subjectType} Quote ${state.quoteNumber} — Twin Loop Binding`;
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload([state.customerEmail], customerSubject))
    });

    if (!emailRes.ok) {
      const err = await emailRes.json().catch(() => ({}));
      console.error('Resend error (customer copy):', err);
      return res.status(500).json({ error: 'Email failed', detail: err });
    }
  }

  const sentOrders = (hexicomResults || []).filter(r => r.ok);
  return res.status(200).json({
    success: true,
    recorded: saved,
    alreadyRecorded,
    hexicom: hexicomResults ? { sent: sentOrders.length, of: hexicomResults.length, orderNos: sentOrders.map(r => r.orderNo) } : null
  });
};

function quoteRow(state, computed, hexicomPayloads) {
  return {
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
    // Tab and sheet counts live under state.collating, keyed by the collating
    // option that sets them — qtyTabs/qtyExtraSheets never existed, so every
    // row until 2026-09-10 stored an empty inserts object.
    inserts:          { tabs:   parseFloat((state.collating || {}).tabs)   || 0,
                        sheets: parseFloat((state.collating || {}).sheets) || 0 },
    extras:           state.selectedExtras,
    totals:           computed.totals,
    bind_edge:        state.bindEdge || null,
    // One payload per quantity tier since 2026-09-24; older rows hold a single object.
    hexicom_payload:  hexicomPayloads && hexicomPayloads.length ? hexicomPayloads : null,
    hexicom_status:   hexicomPayloads && hexicomPayloads.length ? null : 'skipped'
  };
}

async function buildAttachments(state, quotePdfBase64) {
  const attachments = [];
  if (quotePdfBase64) {
    attachments.push({ filename: `Quote-${state.quoteNumber}.pdf`, content: quotePdfBase64 });
  }
  for (const url of BINDING_INFO_PDF_URLS[state.bindCategory] || []) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const b64 = Buffer.from(await resp.arrayBuffer()).toString('base64');
        attachments.push({ filename: url.split('/').pop(), content: b64 });
      }
    } catch (e) {
      console.error('Failed to fetch binding info PDF:', url, e.message);
    }
  }
  return attachments;
}

// Wayne wants anything over $5k, $10k or $15k flagged to him so it gets chased
// rather than sitting in the pile. Banded on the highest quantity tier, ex GST,
// which is the largest figure the customer has actually been quoted.
async function sendFollowUp(state, computed, template, RESEND) {
  try {
    const topValue = Math.max(...(computed.totals || []).map(t => Number(t.afterDisc) || 0), 0);
    const band = topValue >= 15000 ? 15000 : topValue >= 10000 ? 10000 : topValue >= 5000 ? 5000 : null;
    if (!band) return;
    const fmt = n => '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tierRows = (state.qtys || []).map((q, i) =>
      `<tr><td style="padding:4px 12px 4px 0;">Qty ${q}</td><td style="padding:4px 0;">${fmt((computed.totals[i] || {}).afterDisc || 0)} ex GST</td></tr>`
    ).join('');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Twin Loop Binding <webquote@quote.twinloop.online>',
        to:      ['wayne@twinloop.com.au'],
        subject: `Estimate Follow Up — ${state.quoteNumber} — ${state.customerCompany || state.customerName || 'Unknown'} — over ${fmt(band)}`,
        html: `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#222;line-height:1.7;">
          <p style="margin:0 0 12px;font-weight:bold;font-size:16px;">Estimate Follow Up — over ${fmt(band)}</p>
          <p style="margin:0 0 12px;">Quote <b>${state.quoteNumber}</b> has been issued at ${fmt(topValue)} ex GST.</p>
          <table style="border-collapse:collapse;margin:0 0 12px;">
            <tr><td style="padding:4px 12px 4px 0;">Customer</td><td style="padding:4px 0;">${state.customerName || '—'}${state.customerCompany ? ' (' + state.customerCompany + ')' : ''}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;">Email</td><td style="padding:4px 0;">${state.customerEmail || '—'}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;">Binding</td><td style="padding:4px 0;">${template.subjectType}</td></tr>
            ${tierRows}
          </table>
          <p style="margin:0;color:#666;font-size:13px;">Sent automatically because the quote is over ${fmt(band)}.</p>
        </div>`
      })
    });
  } catch (e) {
    console.error('Estimate Follow Up email failed:', e.message);
  }
}

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
