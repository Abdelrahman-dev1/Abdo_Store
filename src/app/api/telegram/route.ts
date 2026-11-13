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
  heading: '🚨 NEW ORDER RECEIVED',
  footer: '⚠️ Please contact the customer to confirm this order.',
  fields: {
    order_number: true,
    order_date: true,
    customer_name: true,
    customer_phone: true,
    customer_email: false,
    customer_address: true,
    city: true,
    governorate: true,
    postal_code: false,
    customer_notes: true,
    items: true,
    subtotal: true,
    discount_code: true,
    discount_amount: true,
    shipping_cost: true,
    tax_amount: true,
    payment_method: true,
    payment_status: true,
    delivery_method: true,
    total_amount: true,
    whatsapp_contact_link: true,
  },
};

const DEFAULT_WHATSAPP_CONFIG: Required<ChannelConfig> = {
  heading: 'Hello! Thank you for your order.',
  footer:
    'Our team will contact you shortly to confirm the details. Thank you for choosing Abdo Store! ❤️',
  fields: {
    order_number: true,
    order_date: false,
    customer_name: true,
    customer_phone: false,
    customer_email: false,
    customer_address: true,
    city: true,
    governorate: false,
    postal_code: false,
    customer_notes: false,
    items: true,
    subtotal: true,
    discount_code: true,
    discount_amount: true,
    shipping_cost: true,
    tax_amount: true,
    payment_method: true,
    payment_status: false,
    delivery_method: true,
    total_amount: true,
    whatsapp_contact_link: false,
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
  governorate: '🗺️ Governorate / State',
  postal_code: '📮 Postal code',
  customer_notes: '📝 Customer notes',
  items: '🛍️ Ordered products and quantities',
  subtotal: '💵 Subtotal',
  discount_code: '🏷️ Discount / coupon code',
  discount_amount: '💸 Discount amount',
  shipping_cost: '🚚 Shipping cost',
  tax_amount: '🧮 Tax amount',
  payment_method: '💳 Payment method',
  payment_status: '✅ Payment status',
  delivery_method: '📦 Delivery method',
  total_amount: '💰 Grand total',
  whatsapp_contact_link: '💬 Contact customer on WhatsApp',
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

function formatMoney(value: unknown, currency: string): string {
  const text = asText(value, 50);
  return text ? `${text} ${currency}` : '';
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    return `20${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith('1')) {
    return `20${digits}`;
  }

  return digits;
}

function makeItemsText(itemsValue: unknown, currency: string): string {
  if (!Array.isArray(itemsValue)) return '';

  return itemsValue
    .slice(0, 100)
    .map((rawItem, index) => {
      const item = asRecord(rawItem);
      const product = asRecord(item.product);

      const name =
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
        ) || `Item ${index + 1}`;

      const sku = asText(firstValue(item.sku, product.sku), 80);

      const variant = asText(
        firstValue(
          item.variant,
          item.variant_name,
          item.options,
          item.color,
          item.size,
        ),
        120,
      );

      const quantity =
        asText(firstValue(item.quantity, item.qty, item.count), 20) || '1';

      const unitPrice = firstValue(
        item.unit_price,
        item.price,
        item.sale_price,
        item.unitPrice,
        product.price,
      );

      let lineTotal = firstValue(
        item.line_total,
        item.total,
        item.subtotal,
        item.amount,
        item.lineTotal,
      );

      if (
        lineTotal === undefined &&
        unitPrice !== undefined &&
        Number.isFinite(Number(unitPrice)) &&
        Number.isFinite(Number(quantity))
      ) {
        lineTotal = Number(unitPrice) * Number(quantity);
      }

      const details = [
        `Qty: ${quantity}`,
        unitPrice !== undefined
          ? `Unit: ${formatMoney(unitPrice, currency)}`
          : '',
        lineTotal !== undefined
          ? `Line: ${formatMoney(lineTotal, currency)}`
          : '',
        sku ? `SKU: ${sku}` : '',
        variant ? `Options: ${variant}` : '',
      ].filter(Boolean);

      return `${index + 1}. ${name}\n   ${details.join(' | ')}`;
    })
    .join('\n');
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
    .map((key) => `${FIELD_LABELS[key]}: ${values[key]}`);

  return [heading, ...rows, footer]
    .filter((part) => part && part.trim())
    .join('\n\n')
    .slice(0, isTelegram ? 3900 : 6000);
}

export async function POST(req: Request) {
  try {
    const body = asRecord(await req.json());

    const order = asRecord(
      firstValue(body.order, body.order_data, body),
    );

    const customer = asRecord(
      firstValue(body.customer, order.customer),
    );

    const shipping = asRecord(
      firstValue(
        body.shipping_address,
        body.shippingAddress,
        order.shipping_address,
        order.shippingAddress,
      ),
    );

    const payment = asRecord(
      firstValue(body.payment, order.payment),
    );

    const customerName = asText(
      firstValue(
        body.customer_name,
        body.name,
        customer.name,
        order.customer_name,
        order.name,
      ),
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
      firstValue(
        body.customer_email,
        body.email,
        customer.email,
        order.customer_email,
        order.email,
      ),
      160,
    );

    const address = asText(
      firstValue(
        body.customer_address,
        customer.address,
        typeof body.address === 'string' ? body.address : undefined,
        shipping.address,
        shipping.street,
        shipping.address_line1,
        order.customer_address,
      ),
      300,
    );

    const city = asText(
      firstValue(
        body.city,
        customer.city,
        shipping.city,
        order.city,
      ),
      100,
    );

    const governorate = asText(
      firstValue(
        body.governorate,
        body.state,
        customer.governorate,
        shipping.governorate,
        shipping.state,
        order.governorate,
      ),
      100,
    );

    const postalCode = asText(
      firstValue(
        body.postal_code,
        customer.postal_code,
        shipping.postal_code,
        shipping.zip,
        order.postal_code,
      ),
      40,
    );

    const customerNotes = asText(
      firstValue(
        body.customer_notes,
        body.notes,
        order.customer_notes,
        order.notes,
      ),
      1000,
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
      order.cart_items,
      order.products,
    );

    // Checkout sends orderId, not order_id.
    const orderNumber = asText(
      firstValue(
        body.order_number,
        body.orderNumber,
        body.orderId,
        body.order_id,
        order.order_number,
        order.orderNumber,
        order.order_code,
        order.id,
      ),
      100,
    );

    const orderDate = asText(
      firstValue(
        body.order_date,
        body.orderDate,
        body.created_at,
        order.order_date,
        order.created_at,
        order.createdAt,
      ),
      80,
    );

    const subtotal = firstValue(
      body.subtotal,
      body.sub_total,
      order.subtotal,
      order.sub_total,
    );

    const discountCode = asText(
      firstValue(
        body.discount_code,
        body.coupon_code,
        order.discount_code,
        order.coupon_code,
      ),
      100,
    );

    const discountAmount = firstValue(
      body.discount_amount,
      body.discount,
      body.coupon_discount,
      order.discount_amount,
      order.discount,
      order.coupon_discount,
    );

    const shippingCost = firstValue(
      body.shipping_cost,
      body.shipping_fee,
      body.delivery_fee,
      order.shipping_cost,
      order.shipping_fee,
      order.delivery_fee,
    );

    const taxAmount = firstValue(
      body.tax_amount,
      body.tax,
      order.tax_amount,
      order.tax,
    );

    const paymentMethod = asText(
      firstValue(
        body.payment_method,
        body.payment_type,
        payment.method,
        payment.name,
        order.payment_method,
        order.payment_type,
      ),
      100,
    );

    const paymentStatus = asText(
      firstValue(
        body.payment_status,
        payment.status,
        order.payment_status,
      ),
      80,
    );

    const deliveryMethod = asText(
      firstValue(
        body.delivery_method,
        body.shipping_method,
        shipping.method,
        shipping.delivery_method,
        order.delivery_method,
        order.shipping_method,
      ),
      100,
    );

    const totalAmount = firstValue(
      body.total_amount,
      body.grand_total,
      body.total,
      order.total_amount,
      order.grand_total,
      order.total,
    );

    if (!customerPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'The order payload must include customer_phone.',
        },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase environment variables are not configured.',
        },
        { status: 500 },
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select(
        'telegram_enabled, telegram_config, whatsapp_enabled, whatsapp_config',
      )
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not load message settings: ${settingsError.message}`,
        },
        { status: 500 },
      );
    }

    const telegramEnabled = settings?.telegram_enabled !== false;
    const whatsappEnabled = settings?.whatsapp_enabled !== false;

    const whatsappConfig = (settings?.whatsapp_config ||
    {}) as ChannelConfig;

    const telegramConfig = (settings?.telegram_config ||
    {}) as ChannelConfig;

    const normalizedPhone = normalizePhone(customerPhone);

    const values: Record<OrderFieldKey, string> = {
      order_number: orderNumber,

      order_date:
        orderDate && !Number.isNaN(new Date(orderDate).getTime())
          ? new Date(orderDate).toLocaleString('en-GB', {
            timeZone: 'Africa/Cairo',
          })
          : orderDate,

      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      customer_address: address,
      city,
      governorate,
      postal_code: postalCode,
      customer_notes,
      items: makeItemsText(rawItems, currency),
      subtotal: formatMoney(subtotal, currency),
      discount_code: discountCode,
      discount_amount: formatMoney(discountAmount, currency),
      shipping_cost: formatMoney(shippingCost, currency),
      tax_amount: formatMoney(taxAmount, currency),
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      delivery_method: deliveryMethod,
      total_amount: formatMoney(totalAmount, currency),
      whatsapp_contact_link: '',
    };

    // WhatsApp link opens a chat WITH THE CUSTOMER.
    // The message is pre-filled but is NOT sent automatically.
    let whatsappUrl: string | null = null;

    if (whatsappEnabled && normalizedPhone) {
      const whatsappMessage = buildMessage(
        whatsappConfig,
        DEFAULT_WHATSAPP_CONFIG,
        values,
        false,
      );

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
          {
            success: false,
            error: 'Telegram keys are not configured.',
            whatsapp_url: whatsappUrl,
          },
          { status: 500 },
        );
      }

      const telegramMessage = buildMessage(
        telegramConfig,
        DEFAULT_TELEGRAM_CONFIG,
        values,
        true,
      );

      if (!telegramMessage.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Telegram message is empty.',
            whatsapp_url: whatsappUrl,
          },
          { status: 400 },
        );
      }

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            disable_web_page_preview: true,
          }),
          cache: 'no-store',
        },
      );

      const telegramResult = (await telegramResponse.json()) as {
        ok?: boolean;
        description?: string;
      };

      if (!telegramResponse.ok || !telegramResult.ok) {
        return NextResponse.json(
          {
            success: false,
            error:
              telegramResult.description ||
              'Telegram could not send the message.',
            whatsapp_url: whatsappUrl,
          },
          { status: 502 },
        );
      }

      telegramSent = true;
    }

    return NextResponse.json({
      success: true,
      telegram_sent: telegramSent,
      telegram_skipped: !telegramEnabled,
      whatsapp_enabled: whatsappEnabled,
      whatsapp_url: whatsappUrl,

      // Reserved for future WhatsApp Business API integration.
      whatsapp_business_integration: 'not_configured',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unexpected server error.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
