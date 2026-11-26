// خاص فقط بالـ SEO والـ Metadata
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { Suspense } from 'react';
import ProductClient from './ProductClient';

const SITE_URL = 'https://abdo-store-kappa.vercel.app';
const FALLBACK_IMAGE = `${SITE_URL}/fav-me-3.webp`;
const DEFAULT_TITLE = '⚡ Special Offer | Abdo Store';
const DEFAULT_DESCRIPTION = 'Highest quality, lowest price | Abdo Store';

type ProductMetadataRow = {
  name: string | null;
  slug: string | null;
  description: string | null;
  image: string | null;
  images: string[] | null;
  price: number | string | null;
  category: string | null;
  is_active: boolean | null;
};

function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cleanText(value: unknown, maxLength = 200): string {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trim()}…`
    : normalized;
}

// تحسين رابط صورة المعاينة فقط (لضمان ظهورها في واتساب وفيسبوك بدون المساس بصور المتجر)
function optimizeShareImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  try {
    const parsed = new URL(trimmed);

    // تأمين البروتوكول إلى https إذا كان الرابط يبدأ بـ http
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }

    if (parsed.protocol !== 'https:') {
      return FALLBACK_IMAGE;
    }

    const finalUrl = parsed.toString();

    // إذا كانت الصورة من Cloudinary، نولد نسخة JPG متوافقة مع معاينة واتساب
    if (
      finalUrl.includes('res.cloudinary.com') &&
      finalUrl.includes('/upload/')
    ) {
      // تجنب إضافة التحويل مرتين إذا كان موجوداً بالفعل
      if (finalUrl.includes('/upload/f_jpg,')) {
        return finalUrl;
      }
      return finalUrl.replace(
        '/upload/',
        '/upload/f_jpg,q_80,w_1200,h_630,c_pad,b_rgb:07090e/',
      );
    }

    return finalUrl;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function resolveProductImage(product: ProductMetadataRow | null): string {
  if (!product) return FALLBACK_IMAGE;

  let candidate: string | null = null;

  if (typeof product.image === 'string' && product.image.trim().length > 0) {
    candidate = product.image.trim();
  } else if (Array.isArray(product.images)) {
    const firstValidImage = product.images.find(
      (img): img is string => typeof img === 'string' && img.trim().length > 0,
    );
    if (firstValidImage) {
      candidate = firstValidImage.trim();
    }
  }

  if (!candidate) return FALLBACK_IMAGE;

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return optimizeShareImageUrl(candidate);
  }

  if (candidate.startsWith('/')) {
    return optimizeShareImageUrl(`${SITE_URL}${candidate}`);
  }

  return FALLBACK_IMAGE;
}

// دالة مخزنة في الكاش لجلب بيانات الميتا داتا بدون حظر الصفحة
async function getCachedProductMetadata(
  slug: string,
): Promise<ProductMetadataRow | null> {
  'use cache';
  cacheLife('hours');

  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) return null;

    const cleanSlug = safeDecode(slug).trim();
    if (!cleanSlug) return null;

    const { data, error } = await supabase
      .from('products')
      .select(
        'name, slug, description, image, images, price, category, is_active',
      )
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (error || !data) {
      // محاولة احتياطية بالـ slug الأصلي في حال اختلاف التشفير
      if (cleanSlug !== slug) {
        const fallbackRes = await supabase
          .from('products')
          .select(
            'name, slug, description, image, images, price, category, is_active',
          )
          .eq('slug', slug)
          .maybeSingle();
        return (fallbackRes.data as ProductMetadataRow) || null;
      }
      return null;
    }

    return data as ProductMetadataRow;
  } catch {
    return null;
  }
}

// 1. توليد كل الـ Slugs وقت البناء
export async function generateStaticParams() {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) return [];

    const { data: products, error } = await supabase
      .from('products')
      .select('slug');

    if (error || !products) return [];

    return products
      .filter((product): product is { slug: string } => Boolean(product.slug))
      .map((product) => ({
        slug: product.slug,
      }));
  } catch {
    return [];
  }
}

// 2. توليد الميتا داتا الديناميكية لكل منتج بأمان وسرعة
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = safeDecode(slug).trim();
  const productUrl = `${SITE_URL}/products/${encodeURIComponent(decodedSlug || slug)}`;

  const product = await getCachedProductMetadata(slug);

  const productName =
    cleanText(product?.name, 120) ||
    (product ? cleanText(decodedSlug, 120) : '');

  const title = productName ? `${productName} | Abdo Store` : DEFAULT_TITLE;

  const description =
    cleanText(product?.description, 160) || DEFAULT_DESCRIPTION;

  const imageUrl = resolveProductImage(product);

  return {
    title,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: 'Abdo Store',
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: productName || 'Abdo Store Product',
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

async function ProductPageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  return <ProductClient slug={slug} />;
}

// 3. مكون الصفحة الرئيسي مغلف بـ Suspense لدعم Instant Navigation
export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className='min-h-[60vh] flex items-center justify-center p-6'>
          <div className='w-full max-w-4xl h-72 rounded-3xl bg-[#0e1626]/80 border border-slate-800/80 animate-pulse' />
        </div>
      }
    >
      <ProductPageContent params={params} />
    </Suspense>
  );
}
