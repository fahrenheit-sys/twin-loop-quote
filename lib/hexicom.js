// Builds and posts orders to Hexicom (ePrint) — the factory system Twin Loop runs
// production from. Every quote we issue becomes an Order in Hexicom; Wayne then
// converts the ones that proceed into Jobs, which is where the work tickets come
// from. Orders sit separately from Estimates and Jobs, so nothing we post here
// reaches the production floor on its own.
//
// Structure agreed with Wayne (Sept 2026): one OrderItem per WORK STATION, not
// per quote line. Binding and its setup fee are one item; celloglazing and its
// setup fee are another. Covers and extras ride as description fields on the
// item they belong to — they are not items of their own.
//
// Field names are Hexicom's internal ones; the labels on Twin Loop's job screen
// differ, so the mapping is worth keeping in view:
//   Artwork   -> "Priority"              (left blank; Wayne fills at job stage)
//   Material  -> "Covers"
//   Finishing -> "Special Requirements"  (prints as "Special" on the ticket)

const ENDPOINT = 'https://twinloop.eprintsoftware.com/orderapi/api/Order/PostOrder';

// Placeholder items Hexicom set up for us. They carry no pricing — we send the
// price on every line — they exist so each item lands on the right accounting
// code, which is what feeds MYOB.
const STATIONS = {
  wire:     { sku: 'B0010001', title: 'Wire Binding',           account: '4-1000' },
  spiral:   { sku: 'B0020001', title: 'Plastic Spiral Binding', account: '4-1001' },
  eva:      { sku: 'B0030001', title: 'EVA Perfect Binding',    account: '4-1004' },
  pur:      { sku: 'B0040001', title: 'PUR Perfect Binding',    account: '4-1003' },
  case:     { sku: 'B0050001', title: 'Case Binding',           account: '4-1018' },
  cello:    { sku: 'B0060001', title: 'Celloglazing',           account: '4-1008' },
  collate:  { sku: 'B0070001', title: 'Collating',              account: '4-1014' },
  // Issued by Adam on 2026-09-08, after he first gave B0060001 in error — that one
  // was already Celloglazing above. No MYOB account code was advised for comb; the
  // `account` values here are a record of Hexicom's list rather than anything we
  // send, so the code lives on their item, not in this payload.
  comb:     { sku: 'B0080001', title: 'Comb Binding',           account: null   },
};

// Hexicom's OrderDate is optional, and left out the order picks up their own
// server's clock — which is what put US-format dates on Twin Loop's orders. Adam
// asked us to send it explicitly (2026-09-08). Their Order API documents it as
// ISO 8601 with a timezone offset, e.g. "2020-07-17T07:55:21+11:00".
//
// The offset is derived from the same instant rather than hardcoded, so it stays
// right across the October and April daylight-saving switches — Sydney runs +10:00
// most of the year and +11:00 through summer.
function sydneyOrderDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const p = {};
  for (const part of parts) p[part.type] = part.value;

  const local   = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  const asUTC   = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const mins    = Math.round((asUTC - Math.floor(now.getTime() / 1000) * 1000) / 60000);
  const sign    = mins < 0 ? '-' : '+';
  const abs     = Math.abs(mins);
  const offset  = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return local + offset;
}

const money = n => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
// Notes are read off the ticket by eye, so group the thousands there.
const display = n => Number(money(n)).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

// Which placeholder item a quote's binding maps to. Perfect binding splits by
// glue: EVA and PUR sit on different accounting codes.
function bindingStation(state) {
  const cat = state.bindCategory;
  if (cat === 'Prefect Binding') {
    return /PUR/i.test(state.bindSubtype || '') ? STATIONS.pur : STATIONS.eva;
  }
  if (cat === 'Case Binding')   return STATIONS.case;
  if (cat === 'Wire Binding')   return STATIONS.wire;
  if (cat === 'Plastic Spiral') return STATIONS.spiral;
  if (cat === 'Comb')           return STATIONS.comb;
  return STATIONS.collate;
}

// buildOrder was written against the shape of the Supabase quotes row — `cello`,
// `front_cover`, `back_cover`, `inserts` — but send-quote hands it the browser's
// own state, which carries all four as flat fields. None of them ever matched, so
// every ticket read "No celloglazing required", never named a cover, and dropped
// the celloglazing item entirely, taking its money out of the order with it.
// Normalise both shapes here rather than scatter fallbacks through the file.
// Found 2026-09-10 after Wayne reported celloglazing showing under Covers.
function normalise(state) {
  const s = { ...state };

  if (!s.cello) {
    s.cello = { type: state.celloType || null, cost: Number(state.celloCost) || 0 };
  }

  const cover = (name, source, collated, gsm, addon) => ({
    name:     name || 'None',
    source:   source || 'Twin Loop',
    collated: collated || 'Yes',
    gsm:      gsm || null,
    addon:    addon && addon !== 'None' ? addon : null,
  });
  if (!s.front_cover) {
    s.front_cover = cover(state.frontCoverName, state.frontSource, state.frontCollated,
                          state.frontCoverGSM, state.frontAddonName);
  }
  if (!s.back_cover) {
    s.back_cover = cover(state.backCoverName, state.backSource, state.backCollated,
                         state.backCoverGSM, state.backAddonName);
  }

  // Tab and sheet counts live under state.collating on the browser side, keyed the
  // same way as the collating options that set them.
  if (!s.inserts) {
    const c = state.collating || {};
    s.inserts = { tabs: parseFloat(c.tabs) || 0, sheets: parseFloat(c.sheets) || 0 };
  }

  return s;
}

const isPerfect = s => s.bindCategory === 'Prefect Binding';
const isCase    = s => s.bindCategory === 'Case Binding';
const isPunched = s => ['Wire Binding', 'Plastic Spiral', 'Comb'].includes(s.bindCategory);

// Wire, spiral and comb are costed by the length of the bound edge, and the size
// step asks short-edge customers to drop a size for that reason. The ticket still
// names the size the customer actually picked: we cannot tell an A3 book bound on
// its short edge from an A4 book whose customer followed the costing note, so we
// do not guess — an earlier version inferred the size one step up and would have
// called an A3 short-edge job "A2". Wayne, 2026-09-08.
//
// What we can state exactly is the millimetre span the wire has to cover, which is
// the named size's own short or long edge.
const SIZE_MM = {
  A3: [297, 420], A4: [210, 297], A5: [148, 210], A6: [105, 148], B5: [176, 250],
};

function boundEdgeMM(state) {
  const dims = SIZE_MM[state.leafSize || ''];
  if (!dims) return 0;
  return /short/i.test(state.bindEdge || '') ? dims[0] : dims[1];
}

// "A3, bound on the short (297mm) edge" — the size as selected, plus the wire span,
// so neither reading of the ticket can put the wrong length of wire on the job.
function sizeAndEdge(state) {
  const size = state.leafSize || '';
  if (!isPunched(state) || !state.bindEdge) return size;
  const mm = boundEdgeMM(state);
  if (!mm) return `${size}, bound on ${state.bindEdge.toLowerCase()}`;
  return `${size}, bound on the ${/short/i.test(state.bindEdge) ? 'short' : 'long'} (${mm}mm) edge`;
}

// The Size box on the ticket. Same facts, kept short.
function sizeField(state) {
  const size = state.leafSize || '';
  if (!isPunched(state) || !state.bindEdge) return size;
  const mm = boundEdgeMM(state);
  return mm ? `${size} (bound edge ${mm}mm)` : size;
}

// A perfect-binding cover is celloglazed flat as an SRA3 press sheet, so the sheet
// size is what the operator needs stated. A case binding cover is cut and wrapped
// to the finished case instead, where the sheet size means nothing and the bleed is
// the thing that has to be right. Wayne, 2026-09-08.
function celloCoverRequirement(state) {
  return isCase(state)
    ? 'covers must be supplied with the correct bleed'
    : 'must please be SRA3';
}

function bindColour(state) {
  if (state.bindCategory === 'Wire Binding')   return state.wireColour   || '';
  if (state.bindCategory === 'Plastic Spiral') return state.spiralColour || '';
  if (state.bindCategory === 'Comb')           return state.combColour   || state.spiralColour || '';
  return '';
}

// Wayne: every binding type must show the leaf count, the GSM the thickness was
// calculated on, and the resulting book thickness. Perfect binding is the one
// case where the customer may have measured the book instead of giving us sheets.
function thicknessPhrase(state, computed) {
  const measured = isPerfect(state) && /measur/i.test(state.thicknessMethod || '');
  if (measured) {
    return `measured thickness ${Number(state.bookThicknessMM || 0).toFixed(2)}mm`;
  }
  const leaves = parseInt(state.leafCount, 10) || 0;
  const gsm    = parseInt(state.leafGSMValue, 10) || 0;
  const spine  = Number(computed.spineMM || 0).toFixed(2);
  return `${leaves} leaves on ${gsm}gsm, calculated thickness ${spine}mm`;
}

function bindingDescription(state, computed) {
  const size     = state.leafSize || '';
  const subtype  = (state.bindSubtype && state.bindSubtype !== '-') ? state.bindSubtype : '';
  const collated = state.selectedExtras.some(e => e.name === 'Supplied Collated') ? ', supplied collated' : '';
  const thick    = thicknessPhrase(state, computed);

  if (isPerfect(state)) {
    return clean(`Perfect Binding including set up, make ready and scoring of covers and final trim. ${size}. ${thick}${collated}.`);
  }
  if (isCase(state)) {
    return clean(`Case Binding including PUR text block, manufacture of hard cover and casing in. ${size}. ${thick}${collated}.`);
  }
  if (isPunched(state)) {
    const label  = state.bindCategory === 'Wire Binding' ? 'Wire Binding'
                 : state.bindCategory === 'Plastic Spiral' ? 'Plastic Spiral Binding'
                 : 'Comb Binding';
    const sizeOf = state.bindCategory === 'Wire Binding' ? 'Wire size' : 'Spine size';
    const gauge  = computed.wireSize ? ` ${sizeOf} ${computed.wireSize}.` : '';
    const colour = bindColour(state) ? ` Colour: ${bindColour(state)}.` : '';
    // The subtype often already names the binding ("Regular Wire Binding"), so
    // only prefix it when it doesn't.
    const head = subtype && !subtype.toLowerCase().includes(label.toLowerCase().split(' ')[0])
      ? `${subtype} ${label}` : (subtype || label);
    return clean(`${head} — ${sizeAndEdge(state)}. ${thick}${collated}.${gauge}${colour} Includes set up and make ready.`);
  }
  return clean(`Collating only. ${size}. ${thick}.`);
}

// The Covers box. Wayne wants this populated on every job, not just when we
// supply the covers: on perfect and case binding it tells the operator whether
// the covers are going out for celloglazing; on punched work it names the cover
// or backing board to fit, and whether we are collating them.
function coversText(state) {
  const parts = [];

  if (isPerfect(state) || isCase(state)) {
    if (celloSupplied(state)) {
      parts.push('Covers supplied already celloglazed.');
    } else if (celloOurWork(state)) {
      parts.push(`Celloglazing required — ${celloFinish(state)}${celloSides(state) ? ', ' + celloSides(state) : ''}.`);
    } else {
      parts.push('No celloglazing required.');
    }
  }

  if (isPunched(state)) {
    const side = (label, cover) => {
      if (!cover || !cover.name || cover.name === 'None') return null;
      const gsm = cover.name === 'Own Covers' && cover.gsm ? ` ${cover.gsm}gsm` : '';
      return `${label}: ${cover.name}${gsm} (${cover.source || 'Twin Loop'}).`;
    };
    [side('Front cover', state.front_cover), side('Back cover', state.back_cover)]
      .filter(Boolean).forEach(p => parts.push(p));

    [['Front', state.front_cover], ['Back', state.back_cover]].forEach(([label, cover]) => {
      if (cover && cover.addon) parts.push(`${label} cover — additional: ${cover.addon} (Twin Loop).`);
    });
  }

  // Collating applies to both: it tells the operator whether the covers arrive
  // ready to fit or whether we are collating them ourselves.
  const collateCovers = [state.front_cover, state.back_cover]
    .some(c => c && c.name && c.name !== 'None' && c.collated === 'No');
  if (collateCovers) parts.push('Twin Loop to collate covers.');
  else if (isPunched(state)) parts.push('Covers supplied collated.');

  return clean(parts.join(' '));
}

// Special Requirements — prints as "Special" on the ticket, and goes on BOTH
// tickets when a job is celloglazed so each station knows what the other is doing.
function specialRequirements(state) {
  if (!celloOurWork(state)) return '';
  const finish = celloFinish(state);
  return finish ? `Twin Loop Binding to ${finish} celloglaze covers` : '';
}

// Cello options are stored as "Soft Touch - Single Sided" — the finish (matt,
// gloss, soft touch) is what Wayne wants named on the ticket, the sides belong
// in the celloglazing item's own description.
// The "no celloglazing" answer reaches us as 'No', 'No Celloglazing' or empty
// depending on where in the wizard it was set — the old check tested only 'No',
// so 'No Celloglazing' read as a real finish.
const CELLO_NONE = ['', 'no', 'no celloglazing'];
const CELLO_SUPPLIED = 'supplied celloed';

function celloType(state) {
  const t = clean((state.cello && state.cello.type) || state.celloType || '');
  return CELLO_NONE.includes(t.toLowerCase()) ? null : t;
}
// Covers that arrive already celloglazed are not work for us — no item and no
// charge — but the ticket still has to say so rather than claim none is needed.
function celloSupplied(state) {
  const t = celloType(state);
  return !!t && t.toLowerCase() === CELLO_SUPPLIED;
}
// The celloglazing Twin Loop actually performs, and the only kind that earns an
// item of its own.
function celloOurWork(state) {
  return !!celloType(state) && !celloSupplied(state);
}
function celloFinish(state) {
  const t = celloType(state);
  return t ? clean(t.split('-')[0]) : '';
}
function celloSides(state) {
  const t = celloType(state);
  const parts = t ? t.split('-').slice(1).join('-') : '';
  return clean(parts).toLowerCase();
}

function extrasText(state) {
  const names = (state.selectedExtras || [])
    .map(e => e.name)
    .filter(n => n && n !== 'Collating' && n !== 'Supplied Collated');
  const tabs   = state.inserts && parseInt(state.inserts.tabs, 10)   || 0;
  const sheets = state.inserts && parseInt(state.inserts.sheets, 10) || 0;
  const parts = [];
  if (tabs)   parts.push(`${tabs} x tabs per book.`);
  if (sheets) parts.push(`${sheets} x extra sheets per book.`);
  if (names.length) parts.push(names.join(', ') + '.');
  return clean(parts.join(' '));
}

// Splits the quote's money across the work stations. The quote discounts and the
// minimum charge apply to the job as a whole, so we apportion the discounted
// total in the same ratio as the raw station costs. Scaling rather than
// subtracting guarantees the items sum to exactly what the customer was quoted.
function priceSplit(state, computed, idx) {
  const qty     = Number(state.qtys[idx]) || 0;
  const items   = computed.items || [];
  const isCello = i => /^Celloglazing:/i.test(i.label || '');

  const bindUnit  = items.filter(i => !isCello(i)).reduce((s, i) => s + (Number(i.unit) || 0), 0);
  const celloUnit = items.filter(isCello).reduce((s, i) => s + (Number(i.unit) || 0), 0);
  const collCost  = (computed.collatingLines || []).reduce((s, l) => s + (Number(l.costs[idx]) || 0), 0);

  const bindRaw  = (bindUnit * qty) + collCost + (Number((computed.bindSetups || [])[idx]) || 0);
  const celloRaw = (celloUnit * qty) + (Number(computed.celloSetupFee) || 0);
  const raw      = bindRaw + celloRaw;

  const afterDisc = Number((computed.totals || [])[idx] && computed.totals[idx].afterDisc) || 0;
  const scale     = raw > 0 ? afterDisc / raw : 0;

  // Binding takes the rounded share and celloglazing the remainder, so rounding
  // can never leave the two items short of (or over) the quoted total.
  const binding = Math.round(bindRaw * scale * 100) / 100;
  const cello   = Math.round((afterDisc - binding) * 100) / 100;
  return { binding, cello: celloRaw > 0 ? cello : 0, qty };
}

/**
 * Builds the PostOrder payload for a quote.
 *
 * We send the LOWEST quantity tier: at quote time nobody knows which the
 * customer will take, and Wayne overrides the quantity when he creates the job.
 * Every tier and its price goes in the Notes box so he has the whole quote in
 * front of him when he does.
 */
function buildOrder({ state: rawState, computed, testMode = false }) {
  const state    = normalise(rawState);
  const idx      = 0;
  const station  = bindingStation(state);
  const price    = priceSplit(state, computed, idx);
  const cello    = celloOurWork(state);
  // Whatever isn't going on a celloglazing item of its own belongs on the binding
  // line. The split is only ever meant to divide the quoted total, never to shrink
  // it — nine orders reached the factory under-priced because the cello share was
  // deducted here and then no cello item was added to carry it.
  const bindPrice = cello ? price.binding
                          : Math.round((price.binding + price.cello) * 100) / 100;
  const special  = specialRequirements(state);
  const quoteNo  = state.quoteNumber;

  const tiers = (state.qtys || [])
    .map((q, i) => `${q} @ $${display((computed.totals[i] || {}).afterDisc)}`)
    .join(', ');

  const notes = clean(
    `Quote ${quoteNo}. Quantity options (ex GST): ${tiers}. ` +
    `Quantity shown is the ${state.qtys[idx]} tier — confirm final quantity. ` +
    extrasText(state)
  );

  const items = [{
    Sku:         station.sku,
    Quantity:    String(price.qty),
    ItemTitle:   station.title,
    Description: bindingDescription(state, computed),
    Size:        sizeField(state),
    Colour:      bindColour(state),
    Material:    coversText(state),
    Finishing:   special,
    Notes:       notes,
    RetailPrice: money(bindPrice),
    TaxPrice:    money(bindPrice * 0.10),
  }];

  if (cello && price.cello > 0) {
    items.push({
      Sku:         STATIONS.cello.sku,
      Quantity:    String(price.qty),
      ItemTitle:   STATIONS.cello.title,
      Description: clean(`Celloglazing — ${celloFinish(state)}${celloSides(state) ? ', ' + celloSides(state) + ' only' : ''}, including set up.`),
      Size:        celloCoverRequirement(state),
      Material:    `Twin Loop Binding to celloglaze covers — ${celloFinish(state)}.`,
      Finishing:   special,
      Notes:       `Quote ${quoteNo}.`,
      RetailPrice: money(price.cello),
      TaxPrice:    money(price.cello * 0.10),
    });
  }

  return {
    CompanyInfo: { CompanyName: state.customerCompany || state.customerName || 'Unknown' },
    // Hexicom enforces this as unique and rejects duplicates, which is our
    // protection against a double-click or a retry after a timeout creating a
    // second job. Amendments post under a suffixed id.
    ExternalOrderID: (testMode ? 'TEST-' : '') + quoteNo,
    CustomerOrderID: quoteNo,
    // Stored on the quote row with the rest of the payload, so an admin retry
    // re-posts the date the quote was actually raised rather than the date of
    // the retry.
    OrderDate: sydneyOrderDate(),
    Currency: 'AUD',
    Destination: {
      ShipTo: {
        Name:     state.customerName || state.customerCompany || 'Unknown',
        // The quote tool never collects a delivery address — at quote stage
        // there usually isn't one. Wayne fills it in from the customer's PO.
        Address1: 'TBC',
        Email:    state.customerEmail || '',
      },
    },
    OrderItems: items,
    Payment: {},
  };
}

// Posts to Hexicom. Their API returns a generic IIS 500 page for every failure —
// bad payload, bad credentials, server fault alike — so we keep the raw response
// against the quote rather than pretending we can tell them apart.
async function postOrder(payload) {
  const user = process.env.HEXICOM_USER;
  const pass = process.env.HEXICOM_PASSWORD;
  if (!user || !pass) return { ok: false, status: 0, error: 'Hexicom credentials not configured' };

  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

  let resp;
  try {
    resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { ok: false, status: 0, error: `Could not reach Hexicom: ${e.message}` };
  }

  const text = await resp.text();
  if (!resp.ok) {
    return {
      ok: false,
      status: resp.status,
      error: text.slice(0, 500),
      // Hexicom answers every failure with the same generic IIS page, so we
      // can't tell a rejected duplicate from a bad payload. Worth flagging,
      // because a rejected duplicate means the order is already there.
      maybeDuplicate: resp.status === 500,
    };
  }

  let data = null;
  try { data = JSON.parse(text); } catch { /* Hexicom may answer in plain text */ }

  // The response carries the generated order number and per-item numbers; the
  // exact casing isn't documented, so check the shapes we've seen.
  const orderNo = data && (data.OrderNo || data.orderNo || data.OrderNumber || data.orderNumber) || null;
  const itemNos = data && (data.OrderItemNo || data.orderItemNo) || null;
  return { ok: true, status: resp.status, orderNo, itemNos, raw: text.slice(0, 2000) };
}

module.exports = { buildOrder, postOrder, STATIONS, ENDPOINT };
