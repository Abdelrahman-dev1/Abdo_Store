import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = 'https://abdo-store-kappa.vercel.app';
// الصورة البديلة للموقع (تأكد من وجود we11.jpg في مجلد public لتعمل كصورة افتراضية للمنتجات التي بلا صور)
const FALLBACK_IMAGE = `${SITE_URL}/we11.jpg`;

// دالة لمعالجة روابط الصور سواء كانت نص منفرد أو مصفوفة من عمود images
function getImageUrl(images: unknown): string {
  let imgUrl = '';
  if (typeof images === 'string') {
    imgUrl = images;
  } else if (Array.isArray(images) && images.length > 0) {
    imgUrl = images[0]; // أخذ أول صورة من المصفوفة
  }

  if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.trim()) {
    return FALLBACK_IMAGE; // استخدام صورة الموقع الافتراضية
  }

  const trimmed = imgUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  try {
    return new URL(trimmed, SITE_URL).toString();
  } catch {
    return FALLBACK_IMAGE;
  }
}

// جلب بيانات المنتج من Supabase باستخدام الـ slug
async function getProduct(slug: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug) // البحث بالـ slug بدلاً من الـ id
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// توليد الميتا داتا ومعاينة الكارت (Open Graph) بناءً على الـ slug
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  const productName = product?.name || 'عرض مميز من Abdo Store';

  const price = Number(product?.price ?? 0);
  const oldPrice = Number(product?.compare_at_price ?? 0);

  const currentPrice = Number.isFinite(price) ? price : 0;
  const compareAtPrice = Number.isFinite(oldPrice) ? oldPrice : 0;
  const hasDiscount = compareAtPrice > currentPrice && currentPrice > 0;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-EG', {
      maximumFractionDigits: 2,
    }).format(value);

  // جلب الصورة من عمود images الصحيح
  const imageUrl = getImageUrl(product?.images);
  const productUrl = `${SITE_URL}/products/${encodeURIComponent(slug)}`;

  // حساب نسبة الخصم للعنوان والوصف
  let discountBadge = '';
  if (hasDiscount) {
    const savingPercent = Math.round(
      ((compareAtPrice - currentPrice) / compareAtPrice) * 100,
    );
    discountBadge = `🔥 خصم نار ${savingPercent}%!`;
  }

  // 🎛️ [مكان التحكم في عنوان المعاينة]
  const title = hasDiscount
    ? `⚡ ${discountBadge} ${productName} | Abdo Store`
    : `⚡ ${productName} | Abdo Store`;

  // 🎛️ [مكان التحكم في وصف المعاينة]
  const description = hasDiscount
    ? `🔥 الحق العرض من Abdo Store!\n💰 السعر الحالي: ${formatPrice(currentPrice)} EGP\n❌ بدلاً من: ${formatPrice(compareAtPrice)} EGP\n🚀 جودة ممتازة وتوصيل سريع حتى باب البيت!`
    : `🔥 متوفر الآن في Abdo Store!\n💰 السعر: ${formatPrice(currentPrice)} EGP\n🚀 جودة ممتازة وتوصيل سريع حتى باب البيت!`;

  return {
    title,
    description,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      title,
      description,
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
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// 🔑 كلمات مفتاحية للبحث للتعديل: [FALLBACK_IMAGE, getImageUrl, getProduct, generateMetadata, title, description]
