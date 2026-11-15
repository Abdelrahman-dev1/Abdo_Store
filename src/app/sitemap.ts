import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';

// رابط المتجر الأساسي المعتمد في مشروعك
const SITE_URL = 'https://abdo-store-kappa.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // الصفحات العامة الثابتة التي نريد أرشفتها
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // قراءة متغيرات الاتصال بـ Supabase من البيئة
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return staticRoutes;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // جلب عمود slug من جدول products بنفس أسلوب مشروعك
    const { data: products, error } = await supabase
      .from('products')
      .select('slug');

    if (error || !products) {
      return staticRoutes;
    }

    // تحويل كل منتج يملك slug صالح إلى رابط داخل sitemap.xml
    const productRoutes: MetadataRoute.Sitemap = products
      .filter((product): product is { slug: string } => Boolean(product.slug))
      .map((product) => ({
        url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    // في حال حدوث أي مشكلة مؤقتة نرجع الصفحات الثابتة بأمان دون كسر البناء
    return staticRoutes;
  }
}
