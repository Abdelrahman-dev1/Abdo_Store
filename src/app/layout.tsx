import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

/* ==========================================================
   1. إعدادات خطوط النظام (Geist) لتحسين الأداء والسرعة
   ========================================================== */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // لتحسين سرعة ظهور النص (Font Display Swap)
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/* ==========================================================
   2. إعدادات الـ SEO الشاملة وميتا داتا الموقع (Abdo Store)
   ========================================================== */
// [تعديل هــــــــام]: استبدل 'https://abdo-store.vercel.app' برابط موقعك الحقيقي لاحقاً
const siteUrl = 'https://abdo-store-kappa.vercel.app/';

export const metadata: Metadata = {
  // عنوان المتجر الرئيسي (يظهر في تبويب المتصفح ومحركات البحث)
  title: {
    default: 'Abdo Store | Store Number one  ❤️',
    template: '%s | Abdo Store', // لتوليد عناوين الصفحات الفرعية أوتوماتيكياً
  },

  // الوصف التسويقي لمحركات البحث (SEO Description)
  description:
    'اكتشف أحدث الإلكترونيات، الإكسسوارات العصرية، والعروض الحصرية بأفضل الأسعار مع خدمة التوصيل السريع من Abdo Store.',

  // الكلمات الافتتاحية لمحركات البحث
  keywords: [
    'Abdo Store',
    'تسوق إلكتروني',
    'إكسسوارات',
    'عروض',
    'متجر أدو',
    'متجر إلكتروني مصر',
  ],

  // معلومات الملكية والمؤلف
  authors: [{ name: 'Abdelrahman Ashraf', url: siteUrl }],
  creator: 'Abdelrahman Ashraf',
  publisher: 'Abdo Store',

  // إعدادات الـ Robots لمحركات البحث (الأرشفة والتحليل)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // الـ Open Graph (خاص بـ فيسبوك، واتساب، وتليجرام)
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: siteUrl,
    siteName: 'Abdo Store',
    title: 'Abdo Store | Store Number one ❤️',
    description: 'اكتشف أحدث العروض والمنتجات المميزة مع خدمة توصيل سريعة.',
    images: [
      {
        url: `${siteUrl}/we11.jpg`, // صورة أيقونة أو غلاف المتجر الموجودة في مجلد public
        width: 1200,
        height: 630,
        alt: 'Abdo Store Logo & Brand',
      },
    ],
  },

  // إعدادات تويتر (Twitter Cards)
  twitter: {
    card: 'summary_large_image',
    title: 'Abdo Store | store Number one  ❤️',
    description: 'اكتشف أحدث العروض والمنتجات المميزة مع Abdo Store.',
    images: [`${siteUrl}/meq.jpg`],
  },

  // أيقونة الموقع (Favicon) تظهر بوضوح في تبويب المتصفح
  icons: {
    icon: '/we11.jpg',
    shortcut: '/we11.jpg',
    apple: '/we11.jpg',
  },
};

/* ==========================================================
   3. المكون الرئيسي للجذر (Root Layout)
   ========================================================== */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // [تعديل الذوق]: تم ضبط الاتجاه ليكون باللغة العربية (dir="rtl" و lang="ar")
    // يمكنك تغييرها لـ lang="en" لو موقعك إنجليزي بالكامل
    <html
      lang=''
      dir='ltr'
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className='min-h-full flex flex-col bg-[#07090e] text-slate-100 selection:bg-red-500 selection:text-white font-sans antialiased'>
        {/* ==========================================================
           4. ستايل السكرول بار المخصص (Neon Custom Scrollbar) - تم نقله الي ملف globals.css
           ========================================================== */}
        {/* ==========================================================
           5. حاوية محتوى الموقع الأساسية
           ========================================================== */}
        <div className='flex-1 flex flex-col min-h-screen'>{children}</div>
      </body>
    </html>
  );
}
