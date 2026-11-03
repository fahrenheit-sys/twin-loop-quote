// Twin Loop Assistant — Telegram bot (t.me/TwinLoopBot).
//
// Telegram posts every message to this webhook. Only Telegram user IDs listed in
// TELEGRAM_ALLOWED_IDS (comma-separated) get an answer; anyone else is told their
// ID so it can be added. Claude answers using READ-ONLY lookups against the quote
// tool's Supabase (quotes) and the website's Supabase (web orders). Nothing here
// writes, sends emails, or changes data.
//
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_ALLOWED_IDS,
//      ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY,
//      WEBSITE_SUPABASE_URL, WEBSITE_SUPABASE_SERVICE_KEY
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-5-5';
const MAX_TOOL_ROUNDS = 6;
const TG_LIMIT = 4000; // Telegram caps a message at 4096 chars

// ── Telegram helpers ─────────────────────────────────────────────────────────
async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) console.error(`Telegram ${method} failed:`, r.status, (await r.text().catch(() => '')).slice(0, 300));
}

async function reply(chatId, text, replyTo) {
  const chunks = [];
  for (let s = String(text || '').trim() || '(no answer)'; s.length; s = s.slice(TG_LIMIT)) chunks.push(s.slice(0, TG_LIMIT));
  for (const [i, chunk] of chunks.entries()) {
    await tg('sendMessage', {
      chat_id: chatId,
      text: chunk,
      ...(i === 0 && replyTo ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } } : {})
    });
  }
}

// ── Supabase (read-only) ─────────────────────────────────────────────────────
async function sb(base, key, path) {
  const r = await fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`Database error ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return r.json();
}
const quotesDb = path => sb(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, path);
const ordersDb = path => sb(process.env.WEBSITE_SUPABASE_URL, process.env.WEBSITE_SUPABASE_SERVICE_KEY, path);

// PostgREST filter values: strip characters that would break or extend the filter.
const clean = v => String(v || '').replace(/[,()*%"\\]/g, ' ').trim().slice(0, 80);
const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
const clampLimit = n => Math.min(Math.max(parseInt(n) || 15, 1), 50);

// Large internal-only columns that add nothing to an answer.
function slimQuote(q) {
  const { hexicom_payload, hexicom_response, ...rest } = q;
  return rest;
}

const TOOLS = [
  {
    name: 'search_quotes',
    description:
      'Search saved Quote Tool quotes (newest first). Quote numbers look like 2026-09-23-F315 ' +
      '(UTC date the quote was started + letter + 3 digits); a partial number such as "F315" also matches. ' +
      'All filters are optional and combine with AND.',
    input_schema: {
      type: 'object',
      properties: {
        quote_number: { type: 'string', description: 'Full or partial quote number' },
        text: { type: 'string', description: 'Matches customer name, company or email (partial, case-insensitive)' },
        binding: { type: 'string', description: 'Binding category or subtype, e.g. Wire, Spiral, Comb, Case, Perfect' },
        from_date: { type: 'string', description: 'YYYY-MM-DD, inclusive (Sydney date)' },
        to_date: { type: 'string', description: 'YYYY-MM-DD, inclusive (Sydney date)' },
        limit: { type: 'integer', description: 'Max rows, default 15, max 50' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'get_quote',
    description: 'Full detail of one quote by its exact quote number (specs, covers, extras, totals per quantity, amendments).',
    input_schema: {
      type: 'object',
      properties: { quote_number: { type: 'string' } },
      required: ['quote_number'],
      additionalProperties: false
    }
  },
  {
    name: 'search_orders',
    description:
      'Search paid web store orders from www.twinloop.com.au (newest first; abandoned carts excluded). ' +
      'Amounts are AUD; total includes GST and shipping. All filters optional.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'integer' },
        text: { type: 'string', description: 'Matches customer email, shipping name or company (partial)' },
        from_date: { type: 'string', description: 'YYYY-MM-DD, inclusive (Sydney date)' },
        to_date: { type: 'string', description: 'YYYY-MM-DD, inclusive (Sydney date)' },
        limit: { type: 'integer', description: 'Max rows, default 15, max 50' }
      },
      additionalProperties: false
    }
  }
];

// Sydney calendar date → UTC instant bounds. Sydney is UTC+10 or +11; using the
// actual offset for that date keeps "today" correct across daylight saving.
function sydneyStart(dateStr, addDays = 0) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + addDays);
  const probe = new Date(d.getTime() + 12 * 3600e3);
  const tzName = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', timeZoneName: 'shortOffset' })
    .formatToParts(probe).find(p => p.type === 'timeZoneName').value; // e.g. "GMT+11"
  const offsetH = parseInt(tzName.replace('GMT', '')) || 10;
  return new Date(d.getTime() - offsetH * 3600e3).toISOString();
}
function dateFilters(input) {
  const f = [];
  if (isDate(input.from_date)) f.push(`created_at=gte.${sydneyStart(input.from_date)}`);
  if (isDate(input.to_date)) f.push(`created_at=lt.${sydneyStart(input.to_date, 1)}`);
  return f;
}

async function runTool(name, input) {
  if (name === 'search_quotes') {
    const f = ['select=*', 'order=created_at.desc', `limit=${clampLimit(input.limit)}`, ...dateFilters(input)];
    if (clean(input.quote_number)) f.push(`quote_number=ilike.*${clean(input.quote_number)}*`);
    if (clean(input.text)) {
      const t = clean(input.text);
      f.push(`or=(customer_name.ilike.*${t}*,customer_company.ilike.*${t}*,customer_email.ilike.*${t}*)`);
    }
    if (clean(input.binding)) {
      const b = clean(input.binding);
      f.push(`and=(or(bind_category.ilike.*${b}*,bind_subtype.ilike.*${b}*))`);
    }
    const rows = await quotesDb(`quotes?${f.join('&')}`);
    return rows.map(q => {
      const { quote_number, created_at, status, customer_name, customer_company, customer_email,
              bind_category, bind_subtype, leaf_size, leaf_count, quantities, totals } = q;
      return { quote_number, created_at, status: status || 'sent', customer_name, customer_company, customer_email,
               bind_category, bind_subtype, leaf_size, leaf_count, quantities, totals };
    });
  }
  if (name === 'get_quote') {
    const rows = await quotesDb(`quotes?quote_number=eq.${encodeURIComponent(clean(input.quote_number))}&select=*&limit=1`);
    return rows.length ? slimQuote(rows[0]) : { not_found: true };
  }
  if (name === 'search_orders') {
    const select = 'id,created_at,status,email,subtotal,gst,shipping,total,shipping_address,' +
                   'order_items(name,sku,unit_price,quantity,line_total)';
    const f = [`select=${select}`, 'status=neq.pending', 'order=created_at.desc',
               `limit=${clampLimit(input.limit)}`, ...dateFilters(input)];
    if (Number.isInteger(input.order_id)) f.push(`id=eq.${input.order_id}`);
    if (clean(input.text)) {
      const t = clean(input.text);
      f.push(`or=(email.ilike.*${t}*,shipping_address->>name.ilike.*${t}*,shipping_address->>company.ilike.*${t}*)`);
    }
    return ordersDb(`orders?${f.join('&')}`);
  }
  throw new Error(`Unknown tool ${name}`);
}

// ── Claude ───────────────────────────────────────────────────────────────────
const SYSTEM = `You are the Twin Loop Assistant, answering staff questions on Telegram about Twin Loop Binding's \
saved quotes (from the online Quote Tool at quote.twinloop.com.au) and paid web store orders (www.twinloop.com.au).

- Use the tools to look things up; never guess numbers, names or totals. If a search finds nothing, say so \
plainly and suggest what else to try (e.g. a partial number, the customer's name, a date range).
- You are read-only: you cannot send, amend, delete or create quotes or orders. If asked to, say it must be done \
in the admin at quote.twinloop.com.au/admin.
- When quotes are saved: since 24 Sep 2026 every quote is saved as soon as its estimate is shown. Before that \
(up to and including 23 Sep 2026) a quote was only saved if the customer clicked Email or Download, so an older \
number can be missing because it was never saved. Either way, changing an answer after the quote was saved issues \
a new number, so a number a customer gives may have been superseded by a later one for the same customer.
- Amounts are AUD. Say whether a figure includes GST when the data makes that clear.
- Reply in plain text for a phone screen: short, no markdown tables, no asterisks or # headings. Use simple \
line breaks and "-" bullets. Dates as e.g. 23 Sep 2026.`;

function sydneyToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date());
}

async function answer(question, contextText) {
  const client = new Anthropic();
  const content = (contextText ? `(I'm replying to your earlier message: """${contextText.slice(0, 3000)}""")\n\n` : '') +
                  `Today in Sydney is ${sydneyToday()}.\n\n${question}`;
  const messages = [{ role: 'user', content }];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      tools: TOOLS,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages
    });

    if (res.stop_reason === 'refusal') return "Sorry, I can't help with that one.";
    const toolUses = res.content.filter(b => b.type === 'tool_use');
    if (res.stop_reason !== 'tool_use' || !toolUses.length || round === MAX_TOOL_ROUNDS) {
      const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      return text || 'Sorry, I couldn\'t work that out — try rephrasing.';
    }

    messages.push({ role: 'assistant', content: res.content });
    const results = await Promise.all(toolUses.map(async tu => {
      try {
        const out = await runTool(tu.name, tu.input || {});
        return { type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(out).slice(0, 60000) };
      } catch (e) {
        return { type: 'tool_result', tool_use_id: tu.id, content: e.message, is_error: true };
      }
    }));
    messages.push({ role: 'user', content: results });
  }
}

// ── Webhook ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.TELEGRAM_WEBHOOK_SECRET ||
      req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).end();
  }

  const msg = (req.body || {}).message;
  // Private chats with text only; edits, groups, stickers etc. are ignored.
  if (!msg || !msg.text || !msg.chat || msg.chat.type !== 'private') return res.status(200).end();

  const userId = String(msg.from && msg.from.id);
  const allowed = (process.env.TELEGRAM_ALLOWED_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!allowed.includes(userId)) {
    await reply(msg.chat.id, `Sorry, this bot is private to Twin Loop staff.\n\nYour Telegram ID is ${userId} — send it to Avron to get access.`);
    return res.status(200).end();
  }

  if (msg.text.trim() === '/start') {
    await reply(msg.chat.id,
      'Hi! Ask me about Twin Loop quotes and web orders, e.g.\n' +
      '- find quote 2026-09-23-F315\n- quotes for CBS this month\n- web orders today\n- what did order 12 include?\n\n' +
      'Tip: reply to one of my messages to ask a follow-up about it.');
    return res.status(200).end();
  }

  try {
    await tg('sendChatAction', { chat_id: msg.chat.id, action: 'typing' });
    const ctx = msg.reply_to_message && msg.reply_to_message.text;
    const text = await answer(msg.text, ctx);
    await reply(msg.chat.id, text, msg.message_id);
  } catch (e) {
    console.error('Telegram bot error:', e);
    await reply(msg.chat.id, 'Something went wrong looking that up. Please try again in a minute.', msg.message_id);
  }
  // Always 200 so Telegram doesn't redeliver (and re-answer) the same message.
  return res.status(200).end();
};
