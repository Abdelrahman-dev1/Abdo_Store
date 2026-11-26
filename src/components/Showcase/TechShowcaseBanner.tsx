'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowLeft, ArrowRight, Sparkles, Zap } from 'lucide-react';

// لو عندك عميل Supabase جاهز في مشروعك، استبدل السطر ده بـ:
import { supabase } from '@/lib/supabase';


export type BannerHeightMode =
  | 'xs'
  | 'compact'
  | 'balanced'
  | 'tall'
  | 'cinematic';
export type ImageFitMode = 'cover' | 'contain' | 'fill';
export type ImageFocusX = 'left' | 'center' | 'right';
export type OverlayStrength =
  | 'none'
  | 'ultra_light'
  | 'light'
  | 'medium'
  | 'strong'
  | 'cinema';
export type ElementSide = 'left' | 'right';
export type ElementLang = 'ar' | 'en';
export type TextScale = 'sm' | 'normal' | 'lg';

export interface TechBannerSettings {
  id: string;
  is_enabled: boolean;
  english_words: string;
  arabic_title: string;
  arabic_subtitle: string;
  cta_label: string;
  cta_href: string;
  show_cta: boolean;
  active_image_url: string;
  active_image_alt: string;
  banner_height_mode: BannerHeightMode;
  image_fit_mode: ImageFitMode;
  image_focus_x: ImageFocusX;
  nav_offset_px: number;
  overlay_strength: OverlayStrength;
  badge_position: ElementSide;
  badge_lang: ElementLang;
  title_position: ElementSide;
  title_lang: ElementLang;
  subtitle_position: ElementSide;
  subtitle_lang: ElementLang;
  cta_position: ElementSide;
  cta_lang: ElementLang;
  text_scale: TextScale;
  flip_horizontal: boolean;
  image_zoom: string;
}

const DEFAULT_BANNER: TechBannerSettings = {
  id: 'default',
  is_enabled: true,
  english_words: 'Tech Spotlight',
  arabic_title: 'أحدث تقنيات الأجهزة بأعلى أداء',
  arabic_subtitle:
    'لابتوبات، هواتف، سماعات، وإكسسوارات أصلية بتجربة سلسة وتوصيل سريع.',
  cta_label: 'استكشف المنتجات',
  cta_href: '#products',
  show_cta: true,
  active_image_url: '',
  active_image_alt: 'أحدث الأجهزة الإلكترونية',
  banner_height_mode: 'balanced',
  image_fit_mode: 'cover',
  image_focus_x: 'right',
  nav_offset_px: 64,
  overlay_strength: 'medium',
  badge_position: 'left',
  badge_lang: 'en',
  title_position: 'left',
  title_lang: 'ar',
  subtitle_position: 'left',
  subtitle_lang: 'ar',
  cta_position: 'left',
  cta_lang: 'ar',
  text_scale: 'normal',
  flip_horizontal: false,
  image_zoom: '100',
};

// 5 درجات للارتفاع متجاوبة مع الموبايل والشاشات الكبيرة
const HEIGHT_CLASSES: Record<BannerHeightMode, string> = {
  xs: 'min-h-[155px] sm:min-h-[185px] md:min-h-[210px]',
  compact: 'min-h-[185px] sm:min-h-[220px] md:min-h-[250px]',
  balanced: 'min-h-[215px] sm:min-h-[265px] md:min-h-[305px]',
  tall: 'min-h-[250px] sm:min-h-[310px] md:min-h-[360px]',
  cinematic: 'min-h-[290px] sm:min-h-[365px] md:min-h-[420px]',
};

const FOCUS_CLASSES: Record<ImageFocusX, string> = {
  left: 'object-left',
  center: 'object-center',
  right: 'object-right',
};

// 6 درجات لكثافة التدرج فوق الصورة
const OVERLAY_CLASSES: Record<OverlayStrength, string> = {
  none: 'bg-transparent',
  ultra_light: 'bg-[#07090e]/25',
  light: 'bg-gradient-to-r from-[#07090e]/75 via-[#07090e]/35 to-transparent',
  medium: 'bg-gradient-to-r from-[#07090e]/90 via-[#07090e]/55 to-rose-950/15',
  strong: 'bg-gradient-to-r from-[#07090e]/95 via-[#07090e]/75 to-[#07090e]/35',
  cinema:
    'bg-[radial-gradient(circle_at_center,rgba(7,9,14,0.35)_0%,rgba(7,9,14,0.92)_100%)]',
};

const TITLE_SIZE_CLASSES: Record<TextScale, string> = {
  sm: 'text-sm sm:text-lg md:text-xl',
  normal: 'text-base sm:text-xl md:text-2xl',
  lg: 'text-lg sm:text-2xl md:text-3xl',
};

const SUBTITLE_SIZE_CLASSES: Record<TextScale, string> = {
  sm: 'text-[11px] sm:text-xs',
  normal: 'text-xs sm:text-sm',
  lg: 'text-xs sm:text-base',
};

const FALLBACK_TECH_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 460" width="1400" height="460">
    <defs>
      <radialGradient id="blueGlow" cx="62%" cy="35%" r="40%">
        <stop offset="0%" stop-color="#2563eb" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#07090e" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="redGlow" cx="88%" cy="35%" r="35%">
        <stop offset="0%" stop-color="#e11d48" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#07090e" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="50%" stop-color="#a855f7"/>
        <stop offset="100%" stop-color="#f43f5e"/>
      </linearGradient>
    </defs>
    <rect width="1400" height="460" fill="#07090e"/>
    <rect width="1400" height="460" fill="url(#blueGlow)"/>
    <rect width="1400" height="460" fill="url(#redGlow)"/>
    <rect x="640" y="105" width="250" height="165" rx="10" fill="#111827" stroke="#475569" stroke-width="3"/>
    <rect x="652" y="117" width="226" height="140" rx="5" fill="url(#screenGrad)"/>
    <polygon points="605,270 925,270 950,283 580,283" fill="#334155"/>
    <rect x="975" y="110" width="95" height="175" rx="16" fill="#0f172a" stroke="#64748b" stroke-width="3"/>
    <rect x="984" y="120" width="77" height="155" rx="11" fill="url(#screenGrad)" opacity="0.85"/>
    <rect x="1095" y="155" width="78" height="130" rx="14" fill="#111827" stroke="#8b5cf6" stroke-width="2.5"/>
    <circle cx="1134" cy="220" r="24" fill="none" stroke="#38bdf8" stroke-width="4"/>
    <rect x="1195" y="210" width="62" height="75" rx="14" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
    <rect x="1275" y="205" width="95" height="80" rx="16" fill="#111827" stroke="#f43f5e" stroke-width="2.5"/>
  </svg>
`);

export default function TechShowcaseBanner() {
  const [config, setConfig] = useState<TechBannerSettings>(DEFAULT_BANNER);
  const [loaded, setLoaded] = useState(false);

  const loadConfig = useCallback(async () => {
    const { data } = await supabase
      .from('tech_banner_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (data) {
      setConfig({
        ...DEFAULT_BANNER,
        ...(data as TechBannerSettings),
      });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadConfig();

    const channel = supabase
      .channel('tech_showcase_banner_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tech_banner_settings' },
        () => loadConfig(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConfig]);

  if (!loaded || !config.is_enabled) {
    return null;
  }

  const imageSrc = config.active_image_url?.trim() || FALLBACK_TECH_DATA_URI;
  const heightCls =
    HEIGHT_CLASSES[config.banner_height_mode] || HEIGHT_CLASSES.balanced;
  const focusCls = FOCUS_CLASSES[config.image_focus_x] || FOCUS_CLASSES.right;
  const overlayCls =
    OVERLAY_CLASSES[config.overlay_strength] || OVERLAY_CLASSES.medium;
  const fitCls =
    config.image_fit_mode === 'contain'
      ? 'object-contain'
      : config.image_fit_mode === 'fill'
        ? 'object-fill'
        : 'object-cover';

  const zoomScale = (Number(config.image_zoom) || 100) / 100;
  const transformStyle = `${config.flip_horizontal ? 'scaleX(-1) ' : ''}scale(${zoomScale})`;

  // مساعد لتحديد مكان كل جملة (يمين أو شمال) واتجاهها (عربي أو إنجليزي)
  const getElementLayout = (side: ElementSide, lang: ElementLang) => {
    const placeClass =
      side === 'right'
        ? 'ml-auto mr-0 text-right items-end'
        : 'mr-auto ml-0 text-left items-start';
    const dirAttr = lang === 'ar' ? 'rtl' : 'ltr';
    const alignText = lang === 'ar' ? 'text-right' : 'text-left';
    return { placeClass, dirAttr, alignText };
  };

  const badgeLayout = getElementLayout(
    config.badge_position,
    config.badge_lang,
  );
  const titleLayout = getElementLayout(
    config.title_position,
    config.title_lang,
  );
  const subtitleLayout = getElementLayout(
    config.subtitle_position,
    config.subtitle_lang,
  );
  const ctaLayout = getElementLayout(config.cta_position, config.cta_lang);
// ========
// ========
// ========
const isDesktopContain =
  String(config.image_fit_mode || '') === 'contain' ||
  String(config.image_fit_mode || '') === 'contain_blur';
// ========
// ========
// ========
// ========

// ========
// ========
// ========
// ========
// ========
// ========
  return (
    <section
      aria-label={config.english_words || 'Tech Spotlight'}
      style={{
        scrollMarginTop: `${Math.max(0, config.nav_offset_px || 64) + 12}px`,
      }}
      className='relative w-full px-2.5 sm:px-6 py-2 sm:py-3.5'
    >
      <div
        className={`relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#07090e] shadow-xl ${heightCls}`}
      >
        {/* صورة البانر محسّنة عبر Next Image مع أولوية التحميل في الواجهة */}
        {/* خلفية مالئة للفراغات على الشاشات الكبيرة عند استخدام contain */}
        {/* خلفية ميكس (أحمر، أزرق، بنفسجي، وأسود) بدرجة وسط مايلة للغامق لملء فراغات contain على الشاشات الكبيرة */}
        {/* خلفية مستخرجة من ألوان الصورة (أحمر، أزرق، بنفسجي، وأسود) بدرجة وسط مايلة للغامق */}
        {isDesktopContain && (
          <div
            aria-hidden='true'
            className='hidden md:block pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_35%,rgba(239,45,55,0.30),transparent_48%),radial-gradient(circle_at_72%_32%,rgba(25,130,255,0.30),transparent_50%),radial-gradient(circle_at_62%_75%,rgba(148,52,235,0.28),transparent_52%),linear-gradient(135deg,#05070d_0%,#0a1120_55%,#070912_100%)]'
          />
        )}

        {/* صورة البانر محسّنة عبر Next Image مع أولوية التحميل في الواجهة */}
        <Image
          src={imageSrc}
          alt={
            config.active_image_alt || config.english_words || 'Tech Showcase'
          }
          fill
          priority
          unoptimized
          sizes='(max-width: 768px) 100vw, 1152px'
          style={{ transform: transformStyle }}
          className={`relative z-[1] ${fitCls} ${focusCls} transition-transform duration-500 ease-out`}
        />

        {/* صورة البانر محسّنة عبر Next Image مع أولوية التحميل في الواجهة */}
        <Image
          src={imageSrc}
          alt={
            config.active_image_alt || config.english_words || 'Tech Showcase'
          }
          fill
          priority
          unoptimized
          sizes='(max-width: 768px) 100vw, 1152px'
          style={{ transform: transformStyle }}
          className={`relative z-[1] ${fitCls} ${focusCls} transition-transform duration-500 ease-out`}
        />

        {/* إضاءة لونية خفيفة */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(168,85,247,0.16),transparent_45%),radial-gradient(circle_at_85%_50%,rgba(56,189,248,0.14),transparent_45%)]'
        />

        {/* طبقة التدرج حسب الكثافة المختارة */}
        <div
          aria-hidden='true'
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${overlayCls}`}
        />

        {/* حاوية النصوص بتحكم مستقل لكل جملة (يمين أو شمال + عربي أو إنجليزي) */}
        <div
          dir='ltr'
          className='relative z-10 flex h-full min-h-[inherit] flex-col justify-center gap-2 sm:gap-2.5 p-3.5 sm:p-6 md:p-8'
        >
          {/* 1. الشارة / الكلمتين المميزة */}
          {config.english_words?.trim() && (
            <div
              dir={badgeLayout.dirAttr}
              className={`flex max-w-[85%] sm:max-w-md ${badgeLayout.placeClass}`}
            >
              <span className='inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-[#0b111e]/80 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-extrabold tracking-wide text-sky-200 shadow-sm'>
                <Zap className='h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-300 shrink-0 animate-pulse' />
                <span>{config.english_words.trim()}</span>
              </span>
            </div>
          )}

          {/* 2. العنوان الرئيسي */}
          {config.arabic_title?.trim() && (
            <div
              dir={titleLayout.dirAttr}
              className={`w-full max-w-[88%] sm:max-w-lg ${titleLayout.placeClass}`}
            >
              <h2
                className={`${
                  TITLE_SIZE_CLASSES[config.text_scale] ||
                  TITLE_SIZE_CLASSES.normal
                } ${titleLayout.alignText} font-extrabold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]`}
              >
                {config.arabic_title}
              </h2>
            </div>
          )}

          {/* 3. الوصف المختصر */}
          {config.arabic_subtitle?.trim() &&
            (() => {
              const words = config.arabic_subtitle.trim().split(/\s+/);
              const maxWordsPerLine = 4; // تقدر تغيرها لـ 4 أو 5 حسب ما يناسبك
              const shouldSplitIntoTwoLines = words.length > maxWordsPerLine;

              const firstLine = shouldSplitIntoTwoLines
                ? words.slice(0, maxWordsPerLine).join(' ')
                : config.arabic_subtitle.trim();

              const secondLine = shouldSplitIntoTwoLines
                ? words.slice(maxWordsPerLine).join(' ')
                : null;

              return (
                <div
                  dir={subtitleLayout.dirAttr}
                  className={`w-full max-w-[88%] sm:max-w-md ${subtitleLayout.placeClass}`}
                >
                  <p
                    className={`${
                      SUBTITLE_SIZE_CLASSES[config.text_scale] ||
                      SUBTITLE_SIZE_CLASSES.normal
                    } ${subtitleLayout.alignText} line-clamp-2 leading-relaxed text-slate-200/95 drop-shadow`}
                  >
                    {secondLine ? (
                      <>
                        <span className='block'>{firstLine}</span>
                        <span className='block'>{secondLine}</span>
                      </>
                    ) : (
                      firstLine
                    )}
                  </p>
                </div>
              );
            })()}

          {/* 4. زر الأكشن بأنيميشن ناعم */}
          {config.show_cta && config.cta_label?.trim() && (
            <div
              dir={ctaLayout.dirAttr}
              className={`pt-0.5 sm:pt-1 ${ctaLayout.placeClass}`}
            >
              <a
                href={config.cta_href || '#products'}
                className='group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-sky-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-950/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-purple-500/30 active:scale-95'
              >
                {/* لمعة متحركة خفيفة على الزر */}
                <span
                  aria-hidden='true'
                  className='pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full'
                />
                <span className='relative'>{config.cta_label}</span>
                <ArrowDown className='relative h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce [animation-duration:1.6s]' />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
