import { createClient } from '@supabase/supabase-js';
import { ReactNode } from 'react';





/* ==========================================================
/* ==========================================================
/* ==========================================================
/* ==========================================================
   1. إعدادات الاتصال بقاعدة البيانات (Supabase)
   ========================================================== */
// [تعديل هام عند الرفع]: تأكد أن الـ Environment Variables مضبوطة على Vercel
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/* ==========================================================
   2. دالة جلب بيانات المنتج من قاعدة البيانات
   ========================================================== */
async function getProduct(id: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

/* ==========================================================
   3. دالة توليد الميتا داتا (Open Graph & Twitter Cards)
   ========================================================== */
// هذه الدالة تعمل خلف الكتمان على السرفر لتزويد واتساب وفيسبوك بالتفاصيل
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // جلب المنتج الحقيقي بناءً على الـ ID من سوبا بيز
  const product = await getProduct(id);

  // [ملاحظة]: قم بتغيير رابط الصورة الافتراضية هنا برابط موقعك الحقيقي لاحقاً
  const fallbackImage = 'https://abdo-store-kappa.vercel.app/we11.jpg';

  /* --- تخصيص بيانات الكارد (WhatsApp / Facebook Preview) --- */
  const productName = product?.name || 'عرض مميز';
  const currentPrice = product?.price || 0;

  // حساب سعر وهمي قبل الخصم (مثلاً السعر الحالي + 200 جنيه) لإعطاء انطباع بالعرض القوي
  const oldPrice = currentPrice + 200;

  // العنوان الإبداعي المزخرف بالنجوم واستيكر الخصم لفترة محدودة
  const title = `⚡ خصم لفترة محدودة! | ${productName} ⭐⭐⭐⭐⭐`;

  // الوصف التسويقي الاحترافي الغني بالتفاصيل والعروض
  const description = `🔥 اطلبه دلوقتي من Abdo Store!\n💰 السعر الحالي: ${currentPrice} EGP (بدلاً من ${oldPrice} EGP)\n🌟 تقييم عالي جداً من عملاءنا\n🚀 جودة ممتازة + توصيل سريع حتى باب البيت!`;

  // اختيار صورة المنتج من Cloudinary (المخزنة في سوبا بيز) أو الصورة الاحتياطية
  const imageUrl = product?.image || fallbackImage;

  /* ==========================================================
     4. الروابط الديناميكية (Domain Setup)
     ========================================================== */
  // [تعديل هــــــــام جداً عند الرفع لـ Vercel]:
  // استبدل 'https://abdo-store.vercel.app' برابط موقعك الحقيقي الذي سيعطيه لك Vercel
  const siteDomain = 'https://abdo-store-kappa.vercel.app/';
  const productUrl = `${siteDomain}/product/${id}`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: productUrl,
      siteName: 'Abdo Store',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: productName,
        },
      ],
      locale: 'ar_EG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

/* ==========================================================
   5. الـ Layout الأساسي (يحيط بالصفحة بدون تعديلها)
   ========================================================== */
export default function ProductLayout({ children }: { children: ReactNode }) {
  // هذا المكون يمرر صفحتك القديمة بسلام دون المساس بأكواد الـ useState أو العرض
  return <>{children}</>;
}






/*
السعر قبل وبعد الخصم:

عملنا حساب آلي بسيط const oldPrice = currentPrice + 200; عشان يكتب السعر القديم أعلى من السعر الحقيقي ويدي إيحاء بالخصم. لو عندك عمود خاص بالسعر القديم في جدول Supabase (مثلاً old_price)، تقدر تستبدل السطر ده بـ const oldPrice = product?.old_price || currentPrice + 150;.

لما انت أو أي عميل ينسخ اللينك ويحطه في شات واتساب أو فيسبوك، اللي هيظهر قدامه في "كرت المعاينة" (Preview Card) هيكون كالتالي:

صورة كبيرة وشيك للمنتج: صورة المنتج الأصلية اللي متخزنة على Cloudinary (بجودة عالية 1200×630 مظبوطة بالمللي عشان ما تقصش).

العنوان الجذاب:⚡ خصم لفترة محدودة! | اسم المنتج ⭐⭐⭐⭐⭐

الوصف التسويقي الغني:

هتلاقي السعر الحالي والسعر القديم (قبل الخصم) عشان يجذب انتباه العميل.

تقييم النجوم والرسالة الترويجية (توصيل سريع، جودة ممتازة، إلخ).

اسم المتجر واللينك: اسم Abdo Store وتحته اللينك المباشر للمنتج بتاعك.

التجربة الحقيقية:
على الواتساب: أول ما تحط اللينك في الرسالة، الواتساب هيقعد ثانية واحدة كده "بيحمّل" (Generating preview)، وبعدين هيظهر لك الكرت بكل تفاصيله اللي برمجناها دي قبل ما تدوس ارسال أصلاً!

على الفيسبوك: لما تنشر اللينك في بوست أو تبعته في مسنجر، فيسبوك هيلقطه أوتوماتيك ويحوله لكارت إعلاني شكله احترافي جداً كأنك عامل حملة إعلانية ممولة.


*/
