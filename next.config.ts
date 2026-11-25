import type { NextConfig } from "next";

const securityHeaders = [
  {
    // منع فتح موقعك داخل iframe في مواقع أخرى (حماية ضد Clickjacking)
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // منع المتصفح من تخمين نوع الملفات (حماية ضد MIME-sniffing)
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // إجبار المتصفح على استخدام HTTPS دائماً لمدة سنتين
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // التحكم في البيانات المرسلة عند الانتقال من موقعك لموقع خارجي
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // تقييد الوصول للكاميرا والميكروفون والموقع الجغرافي
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // السماح لـ Next.js dev / HMR بالوصول من الموبايل على الشبكة المحلية
  allowedDevOrigins: ["192.168.1.2"],

  // 1. إبقاء هذا الخيار بناءً على طلبك لضمان عدم توقف الـ Build على Vercel بسبب التايبس
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. إخفاء هوية الخادم لزيادة الأمان
  poweredByHeader: false,

  // 3. إعدادات الصور مع الحفاظ على نطاقات Cloudinary و Supabase وتفعيل أحدث الصيغ للـ SEO
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com', // عشان صور كلووديناري
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',    // عشان صور سوبابيس
      },
    ],
  },

  // 4. الحفاظ على اللوجيك والخصائص القديمة بالكامل دون أي نقصان
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,

  // 5. تطبيق رؤوس الأمان (Security Headers) على جميع مسارات الموقع
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // 6. إعدادات Turbopack القديمة الخاصة بك كما هي تماماً
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
