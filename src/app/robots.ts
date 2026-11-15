import type { MetadataRoute } from 'next';

// رابط المتجر الأساسي
const SITE_URL = 'https://abdo-store-kappa.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // القاعدة تطبق على جميع محركات البحث (ومنها Googlebot)
        userAgent: '*',
        // السماح بزيارة وأرشفة المتجر وصفحات المنتجات العامة
        allow: '/',
        // حجب صفحات الإدارة والحسابات والسلة والدفع والطلبات ومسارات الـ API
        disallow: [
          '/admin',
          '/admin/',
          '/login',
          '/cart',
          '/checkout',
          '/orders',
          '/profile',
          '/api-telegram-route',
          '/api/',
        ],
      },
    ],
    // تعريف مكان خريطة الموقع لمحركات البحث
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
