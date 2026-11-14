import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// =============================================
// 1. إعدادات الموقع
// =============================================
const SITE_URL = 'https://abdo-store-kappa.vercel.app';
const FALLBACK_IMAGE = `${SITE_URL}/we11.jpg`;

// =============================================
// 2. تجهيز رابط الصورة
// =============================================
function getImageUrl(image: unknown): string {
  if (typeof image !== 'string' || !image.trim()) {
    return FALLBACK_IMAGE;
  }

  try {
    return new URL(image.trim(), SITE_URL).toString();
  } catch {
    return FALLBACK_IMAGE;
  }
}

// =============================================
// 3. جلب بيانات المنتج من Supabase
// =============================================
async function getProduct(id: string) {
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
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// =============================================
// 4. Metadata لكل منتج (متوافقة مع cacheComponents)
// =============================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  'use cache'; // <-- هذا هو التوجيه الصحيح المتوافق مع cacheComponents لحل مشكلة الكاش

  const { id } = await params;
  const product = await getProduct(id);

  const productName = product?.name || 'عرض مميز من Abdo Store';

  const price = Number(product?.price ?? 0);
  const oldPrice = Number(product?.compare_at_price ?? 0);

  const currentPrice = Number.isFinite(price) ? price : 0;
  const compareAtPrice = Number.isFinite(oldPrice) ? oldPrice : 0;
  const hasDiscount = compareAtPrice > currentPrice;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-EG', {
      maximumFractionDigits: 2,
    }).format(value);

  const imageUrl = getImageUrl(product?.image);
  const productUrl = `${SITE_URL}/products/${encodeURIComponent(id)}`;

  const title = `⚡ ${productName} | Abdo Store`;

  const description = hasDiscount
    ? `🔥 اطلب ${productName} دلوقتي من Abdo Store!
💰 السعر الحالي: ${formatPrice(currentPrice)} EGP
بدلاً من ${formatPrice(compareAtPrice)} EGP
🚀 جودة ممتازة وتوصيل سريع حتى باب البيت!`
    : `🔥 ${productName} متوفر الآن في Abdo Store!
💰 السعر: ${formatPrice(currentPrice)} EGP
🚀 جودة ممتازة وتوصيل سريع حتى باب البيت!`;

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

// =============================================
// 5. Product Layout
// =============================================
export default function ProductLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
