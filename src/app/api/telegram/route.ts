import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, customer_address, city, total_amount } = body;

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ error: 'Telegram keys not configured' }, { status: 500 });
    }


    // 1. تنظيف وتجهيز رقم الهاتف (لو يبدأ بـ 0 بيحط 20 للأردن/مصر حسب كود دولتك، هنا كود مصر 20)
    const cleanPhone = customer_phone.startsWith('0') ? '20' + customer_phone.slice(1) : customer_phone;

    // 2. تجهيز نص الرسالة الجاهزة التي ستظهر في واتساب عند الضغط على الرابط
    const waText = encodeURIComponent(
      `أهلاً بك يا ${customer_name}، بنتاكد من تفاصيل طلبك بقيمة ${total_amount} ج.م وعنوانك (${city} - ${customer_address}).`
    );

    // 3. كتابة رسالة التيليجرام بالشكل المطلوب بحيث رقم الهاتف أو جملة التواصل تبقى رابط قابل للضغط
    const message = `
🛒 *طلب جديد في المتجر!*

👤 *الاسم:* ${customer_name}
📞 *الهاتف:* [${customer_phone}](https://wa.me/${cleanPhone}?text=${waText})
📍 *العنوان:* ${city} - ${customer_address}
💰 *إجمالي المبلغ:* ${total_amount} ج.م

💬 [اضغط هنا لمراسلة العميل عبر واتساب مباشرة](https://wa.me/${cleanPhone}?text=${waText})
`;




    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
