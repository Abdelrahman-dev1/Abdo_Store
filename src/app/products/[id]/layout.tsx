import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = 'https://abdo-store-kappa.vercel.app';
const FALLBACK_IMAGE = `${SITE_URL}/we11.jpg`;

function getImageUrl(image: unknown): string {
  if (typeof image !== 'string' || !image.trim()) {
    return FALLBACK_IMAGE;
  }

  const trimmed = image.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  try {
    return new URL(trimmed, SITE_URL).toString();
  } catch {
    return FALLBACK_IMAGE;
  }
}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

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

  const imageUrl = getImageUrl(product?.image);
  const productUrl = `${SITE_URL}/products/${encodeURIComponent(id)}`;

  // حساب نسبة الخصم للمعاونة في الوصف
  let discountBadge = '';
  if (hasDiscount) {
    const savingPercent = Math.round(
      ((compareAtPrice - currentPrice) / compareAtPrice) * 100,
    );
    discountBadge = `🔥 خصم نار ${savingPercent}%!`;
  }

  // 🎛️ [مكان التحكم في عنوان المعاينة الذي يظهر في كارت الشات]
  const title = hasDiscount
    ? `⚡ ${discountBadge} ${productName} | Abdo Store`
    : `⚡ ${productName} | Abdo Store`;

  // 🎛️ [مكان التحكم في تفاصيل الكارت (السعر قبل وبعد والوصف)]
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

// title;
// description;
// description;

// جلب بيانات المنتج: دالة getProduct لو احتجت تزود حقول تانية بتجيبها من جدول
// products في Supabase (زي القسم، التقييم، إلخ).
