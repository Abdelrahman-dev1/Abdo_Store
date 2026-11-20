import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SplashScreen from '@/components/SplashScreen';

/* ==========================================================
   1. إعدادات خطوط النظام (Geist) لتحسين الأداء والسرعة
   ========================================================== */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/* ==========================================================
   2. إعدادات الـ SEO الشاملة وميتا داتا الموقع (Abdo Store)
   ========================================================== */
const siteUrl = 'https://abdo-store-kappa.vercel.app';
const siteName = 'Abdo Store';
const defaultTitle = 'Abdo Store | Store Number One ❤️';
const defaultDescription =
  'اكتشف أحدث الإلكترونيات، الإكسسوارات العصرية، والعروض الحصرية بأفضل الأسعار مع خدمة التوصيل السريع من Abdo Store.';
const ogImageUrl = 'https://abdo-store-kappa.vercel.app/fav-me-3.webp';

export const viewport: Viewport = {
  themeColor: '#07090e',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  category: 'shopping',

  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },

  description: defaultDescription,

  keywords: [
    'Abdo Store',
    'تسوق إلكتروني',
    'إكسسوارات',
    'عروض',
    'متجر Abdo Store',
    'متجر إلكتروني مصر',
  ],

  authors: [{ name: 'Abdelrahman Ashraf', url: siteUrl }],
  creator: 'Abdelrahman Ashraf',
  publisher: siteName,

  alternates: {
    canonical: '/',
  },

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

  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: ogImageUrl,
        secureUrl: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Abdo Store Brand Preview',
        type: 'image/webp',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImageUrl],
  },

  icons: {
    icon: '/fav-me-3.webp',
    shortcut: '/fav-me-3.webp',
    apple: '/fav-me-3.webp',
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
  // rtl - ltr - auto - en - ar - وممكن تعمل تخصيص ع الديف تحددلها الاتجاه واللغه
  return (
    <html
      lang='en'
      dir='ltr'
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark scroll-smooth"`}
    >
      <body className='min-h-full flex flex-col bg-[#07090e] text-slate-100 selection:bg-red-500 selection:text-white font-sans antialiased'>
        {/* ==========================================================
            4. ستايل السكرول بار المخصص موجود في globals.css
           ========================================================== */}

        {/* ==========================================================
            5. حاوية محتوى الموقع الأساسية
           ========================================================== */}
        <div className='flex-1 flex flex-col min-h-screen'>
          <SplashScreen />
          {children}
        </div>
      </body>
    </html>
  );
}
