import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type OrderFieldKey =
  | 'order_number'
  | 'order_date'
  | 'customer_name'
  | 'customer_phone'
  | 'customer_email'
  | 'customer_address'
  | 'city'
  | 'governorate'
  | 'postal_code'
  | 'customer_notes'
  | 'items'
  | 'subtotal'
  | 'discount_code'
  | 'discount_amount'
  | 'shipping_cost'
  | 'tax_amount'
  | 'payment_method'
  | 'payment_status'
  | 'delivery_method'
  | 'total_amount'
  | 'whatsapp_contact_link';

type ChannelConfig = {
  heading?: string;
  footer?: string;
  fields?: Partial<Record<OrderFieldKey, boolean>>;
};

type AnyRecord = Record<string, unknown>;

const DEFAULT_TELEGRAM_CONFIG: Required<ChannelConfig> = {
  heading: '🚨 طلب جديد تم تأكيده!',
  footer: '⚠️ برجاء سرعة التواصل مع العميل لتأكيد الشحن.',
  fields: {
    order_number: true,
    order_date: true,
    customer_name: true,
    customer_phone: true,
    customer_email: false,
    customer_address: true,
    city: false,
    governorate: false,
    postal_code: false,
    customer_notes: false,
    items: true,
    subtotal: true,
    discount_code: false,
    discount_amount: false,
    shipping_cost: true,
    tax_amount: false,
    payment_method: true,
    payment_status: false,
    delivery_method: true,
    total_amount: true,
    whatsapp_contact_link: true,
  },
};

const FIELD_LABELS: Record<OrderFieldKey, string> = {
  order_number: '🧾 Order number',
  order_date: '📅 Order date',
  customer_name: '👤 Customer name',
  customer_phone: '📞 Phone number',
  customer_email: '✉️ Email address',
  customer_address: '📍 Street address',
  city: '🏙️ City',
  governorate: '🗺️ Governorate',
  postal_code: '📮 Postal code',
  customer_notes: '📝 Customer notes',
  items: '🛍️ Ordered products',
  subtotal: '💵 Subtotal',
  discount_code: '🏷️ Discount code',
  discount_amount: '💸 Discount amount',
  shipping_cost: '🚚 Shipping cost',
  tax_amount: '🧮 Tax amount',
  payment_method: '💳 Payment method',
  payment_status: '✅ Payment status',
  delivery_method: '📦 Delivery method',
  total_amount: '💰 Grand total',
  whatsapp_contact_link: '💬 Quick WhatsApp contact',
};

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};
}

function firstValue(...values: unknown[]): unknown {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '',
  );
}

function asText(value: unknown, maxLength = 500): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return '';
  return String(value).trim().slice(0, maxLength);
}

function escapeLegacyMarkdown(text: string): string {
  return text.replace(/([_*`\[])/g, '\\$1');
}

function stripLegacyMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2')
    .replace(/[*_`\\]/g, '');
}

function formatMoney(value: unknown, currency: string): string {
  const text = asText(value, 50);
  return text ? `${text} ${currency}` : '';
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('1')) return `20${digits}`;
  return digits;
}

function makeItemsText(
  itemsValue: unknown,
  currency: string,
  escapeMd: boolean,
): string {
  if (!Array.isArray(itemsValue)) return '';

  return itemsValue
    .slice(0, 100)
    .map((rawItem, index) => {
      const item = asRecord(rawItem);
      const product = asRecord(item.product);

      const rawName =
        asText(
          firstValue(
            item.name,
            item.product_name,
            item.title,
            item.product_title,
            product.name,
            product.title,
          ),
          180,
        ) || `المنتج ${index + 1}`;

      const name = escapeMd ? escapeLegacyMarkdown(rawName) : rawName;

      const quantity =
        asText(firstValue(item.quantity, item.qty, item.count), 20) || '1';

      const unitPrice = firstValue(
        item.unit_price,
        item.price,
        item.sale_price,
        item.unitPrice,
        product.price,
      );

      const imageUrl = asText(
        firstValue(
          item.image,
          item.image_url,
          item.img,
          product.image,
          product.image_url,
        ),
        500,
      );

      const details = [
        `الكمية: ${quantity}`,
        unitPrice !== undefined ? `السعر: ${formatMoney(unitPrice, currency)}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      let itemString = `▪️ ${name}\n   └ ${details}`;
      if (imageUrl) {
        const cleanUrl = imageUrl.replace(/[()]/g, '');
        itemString += escapeMd
          ? `\n   └ 🖼️ [صورة المنتج](${cleanUrl})`
          : `\n   └ 🖼️ صورة المنتج: ${imageUrl}`;
      }

      return itemString;
    })
    .join('\n\n');
}

function replaceInlineTokens(
  template: string,
  values: Partial<Record<OrderFieldKey, string>>,
): string {
  return template.replace(
    /\{\{([a-z_]+)\}\}/gi,
    (_match, key: string) => values[key as OrderFieldKey] ?? '',
  );
}

function buildMessage(
  config: ChannelConfig,
  defaults: Required<ChannelConfig>,
  values: Record<OrderFieldKey, string>,
  isTelegram: boolean,
): string {
  const fields = {
    ...defaults.fields,
    ...(config.fields || {}),
  };

  const templateValues: Partial<Record<OrderFieldKey, string>> = {
    ...values,
  };

  (Object.keys(FIELD_LABELS) as OrderFieldKey[]).forEach((key) => {
    if (fields[key] !== true) {
      templateValues[key] = '';
    }
  });

  const heading = replaceInlineTokens(
    asText(config.heading ?? defaults.heading, 500),
    templateValues,
  );

  const footer = replaceInlineTokens(
    asText(config.footer ?? defaults.footer, 1000),
    templateValues,
  );

  const rows = (Object.keys(FIELD_LABELS) as OrderFieldKey[])
    .filter((key) => fields[key] === true)
    .filter((key) => isTelegram || key !== 'whatsapp_contact_link')
    .filter((key) => values[key])
    .map((key) => {
      if (key === 'whatsapp_contact_link') {
        const cleanLink = values[key].replace(/[()]/g, '');
        return `💬 [تواصل مباشر مع العميل عبر واتساب](${cleanLink})`;
      }
      const safeVal = isTelegram ? escapeLegacyMarkdown(values[key]) : values[key];
      return `${FIELD_LABELS[key]}: ${safeVal}`;
    });

  return [heading, ...rows, footer]
    .filter((part) => part && part.trim())
    .join('\n\n')
    .slice(0, isTelegram ? 3800 : 6000);
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
) {
  const sendRequest = async (withMarkdown: boolean) => {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: withMarkdown ? text : stripLegacyMarkdown(text).slice(0, 4000),
      disable_web_page_preview: false,
    };
    if (withMarkdown) {
      payload.parse_mode = 'Markdown';
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = (await res.json()) as {
      ok?: boolean;
      description?: string;
    };

    return { ok: Boolean(res.ok && data.ok), description: data.description };
  };

  const firstAttempt = await sendRequest(true);
  if (firstAttempt.ok) {
    return firstAttempt;
  }

  const desc = firstAttempt.description || '';
  if (desc.toLowerCase().includes("can't parse entities")) {
    return await sendRequest(false);
  }

  return firstAttempt;
}

export async function POST(req: Request) {
  try {
    const body = asRecord(await req.json());

    const order = asRecord(firstValue(body.order, body.order_data, body));
    const customer = asRecord(firstValue(body.customer, order.customer));
    const shipping = asRecord(
      firstValue(body.shipping_address, body.shippingAddress, order.shipping_address),
    );
    const payment = asRecord(firstValue(body.payment, order.payment));

    const customerName = asText(
      firstValue(body.customer_name, body.name, customer.name, order.customer_name, order.name),
      120,
    );

    const customerPhone = asText(
      firstValue(
        body.customer_phone,
        body.phone,
        customer.phone,
        customer.mobile,
        order.customer_phone,
        order.phone,
      ),
      50,
    );

    const customerEmail = asText(
      firstValue(body.customer_email, body.email, customer.email, order.customer_email),
      160,
    );

    const address = asText(
      firstValue(
        body.customer_address,
        customer.address,
        typeof body.address === 'string' ? body.address : undefined,
        shipping.address,
        order.customer_address,
      ),
      300,
    );

    const city = asText(
      firstValue(body.city, customer.city, shipping.city, order.city),
      100,
    );

    const currency =
      asText(firstValue(body.currency, order.currency), 12) || 'EGP';

    const rawItems = firstValue(
      body.items,
      body.order_items,
      body.cart_items,
      body.products,
      body.cart,
      order.items,
      order.order_items,
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let sequentialId = 1;
    let telegramEnabled = true;
    let telegramConfig: ChannelConfig = {};

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        if (count !== null && count !== undefined) {
          sequentialId = count;
        }

        const { data: settings } = await supabase
          .from('settings')
          .select('telegram_enabled, telegram_config')
          .limit(1)
          .maybeSingle();

        if (settings) {
          telegramEnabled = settings.telegram_enabled !== false;
          telegramConfig = (settings.telegram_config || {}) as ChannelConfig;
        }
      } catch (err) {
        console.warn('Supabase query failed:', err);
      }
    }

    const orderNumber = `#${sequentialId}`;

    const orderDateRaw = asText(
      firstValue(body.order_date, body.orderDate, body.created_at, order.created_at),
      80,
    );

    const subtotal = firstValue(body.subtotal, order.subtotal);
    const shippingCost = firstValue(body.shipping_cost, order.shipping_cost);
    const totalAmount = firstValue(body.total_amount, order.total_amount);
    const paymentMethod = asText(
      firstValue(body.payment_method, payment.method, order.payment_method),
      100,
    );
    const deliveryMethod = asText(
      firstValue(body.delivery_method, shipping.method, order.delivery_method),
      100,
    );

    const normalizedPhone = normalizePhone(customerPhone);

    let formattedDate = orderDateRaw;
    if (orderDateRaw && !Number.isNaN(new Date(orderDateRaw).getTime())) {
      formattedDate = new Date(orderDateRaw).toLocaleString('en-US', {
        timeZone: 'Africa/Cairo',
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const values: Record<OrderFieldKey, string> = {
      order_number: orderNumber,
      order_date: formattedDate,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      customer_address: address,
      city,
      governorate: '',
      postal_code: '',
      customer_notes: '',
      items: makeItemsText(rawItems, currency, true),
      subtotal: formatMoney(subtotal, currency),
      discount_code: '',
      discount_amount: '',
      shipping_cost: formatMoney(shippingCost, currency),
      tax_amount: '',
      payment_method: paymentMethod,
      payment_status: '',
      delivery_method: deliveryMethod,
      total_amount: formatMoney(totalAmount, currency),
      whatsapp_contact_link: '',
    };

    let whatsappUrl: string | null = null;
    if (normalizedPhone) {
      const itemsSummary = makeItemsText(rawItems, currency, false);
      const whatsappMessage =
        `مرحباً بك يا *${customerName}* 👋\n\n` +
        `شكراً لتسوقك من *Abdo Store* ❤️\n\n` +
        `🧾 *تفاصيل طلبك (${orderNumber}):*\n` +
        `${itemsSummary}\n\n` +
        `💰 *الإجمالي النهائي:* ${formatMoney(totalAmount, currency)}\n` +
        `📍 *عنوان التوصيل:* ${address}\n\n` +
        `نحن نتواصل معك الآن لتأكيد تفاصيل الشحن والتوصيل.`;

      whatsappUrl =
        `https://wa.me/${normalizedPhone}?text=` +
        encodeURIComponent(whatsappMessage);
      values.whatsapp_contact_link = whatsappUrl;
    }

    let telegramSent = false;

    if (telegramEnabled) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        return NextResponse.json(
          { success: false, error: 'Telegram keys are not configured.' },
          { status: 500 },
        );
      }

      const telegramMessage = buildMessage(
        telegramConfig,
        DEFAULT_TELEGRAM_CONFIG,
        values,
        true,
      );

      const telegramResult = await sendTelegramMessage(
        botToken,
        chatId,
        telegramMessage,
      );

      if (!telegramResult.ok) {
        return NextResponse.json(
          { success: false, error: telegramResult.description || 'Telegram send failed.' },
          { status: 502 },
        );
      }

      telegramSent = true;
    }

    return NextResponse.json({
      success: true,
      telegram_sent: telegramSent,
      whatsapp_url: whatsappUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
