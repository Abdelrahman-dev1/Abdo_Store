'use client';

import React, { useEffect, useState } from 'react';
import {
  Power,
  Save,
  UploadCloud,
  Link2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Images,
  Check,
  FlipHorizontal2,
  Type,
  Zap,
} from 'lucide-react';

// لو عندك عميل Supabase جاهز في مشروعك، استبدل السطر ده بـ:
import { supabase } from '@/lib/supabase';


type BannerHeightMode =
  | 'nano'
  | 'micro'
  | 'xs'
  | 'compact'
  | 'balanced'
  | 'tall'
  | 'cinematic';

type ImageFitMode =
  | 'cover'
  | 'contain'
  | 'contain_blur'
  | 'scale_down'
  | 'fill';

type ImageFocusX = 'left' | 'center' | 'right';
type OverlayStrength =
  | 'none'
  | 'ultra_light'
  | 'light'
  | 'medium'
  | 'strong'
  | 'cinema';
type ElementSide = 'left' | 'right';
type ElementLang = 'ar' | 'en';
type TextScale = 'sm' | 'normal' | 'lg';

interface GalleryImageItem {
  id: string;
  label: string;
  image_url: string;
  cloudinary_public_id: string | null;
  source_type: 'cloudinary' | 'url';
  is_active: boolean;
  is_hidden: boolean;
  created_at: string;
}

export default function TechShowcaseManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
// ==================
// ==================
// ==================
// ==================
// ==================
// ==================
// ==================
  // إعدادات البانر والنصوص
  const [isEnabled, setIsEnabled] = useState(true);
  const [englishWords, setEnglishWords] = useState('Tech Spotlight');
  const [arabicTitle, setArabicTitle] = useState(
    'أحدث تقنيات الأجهزة بأعلى أداء',
  );
  const [arabicSubtitle, setArabicSubtitle] = useState(
    'لابتوبات، هواتف، سماعات، وإكسسوارات أصلية بتجربة سلسة وتوصيل سريع.',
  );
  const [ctaLabel, setCtaLabel] = useState('استكشف المنتجات');
  const [ctaHref, setCtaHref] = useState('#products');
  const [showCta, setShowCta] = useState(true);

  // تحكم تفصيلي في مكان ولغة كل عنصر
  const [badgePosition, setBadgePosition] = useState<ElementSide>('left');
  const [badgeLang, setBadgeLang] = useState<ElementLang>('en');
  const [titlePosition, setTitlePosition] = useState<ElementSide>('left');
  const [titleLang, setTitleLang] = useState<ElementLang>('ar');
  const [subtitlePosition, setSubtitlePosition] = useState<ElementSide>('left');
  const [subtitleLang, setSubtitleLang] = useState<ElementLang>('ar');
  const [ctaPosition, setCtaPosition] = useState<ElementSide>('left');
  const [ctaLang, setCtaLang] = useState<ElementLang>('ar');
  const [textScale, setTextScale] = useState<TextScale>('normal');

  // إعدادات الصورة والأبعاد (لابتوب + موبايل بشكل مستقل)
  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [activeImageAlt, setActiveImageAlt] = useState(
    'أحدث الأجهزة الإلكترونية',
  );
  const [heightMode, setHeightMode] = useState<BannerHeightMode>('balanced');
  const [mobileHeightMode, setMobileHeightMode] =
    useState<BannerHeightMode>('xs');
  const [fitMode, setFitMode] = useState<ImageFitMode>('cover');
  // const [mobileFitMode, setMobileFitMode] = useState<ImageFitMode>('cover');
const [mobileFitMode, setMobileFitMode] = useState<ImageFitMode>('contain');

  const [focusX, setFocusX] = useState<ImageFocusX>('right');
  const [navOffsetPx, setNavOffsetPx] = useState(64);
  const [overlayStrength, setOverlayStrength] =
    useState<OverlayStrength>('medium');
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [imageZoom, setImageZoom] = useState('100');
  const [mobileImageZoom, setMobileImageZoom] = useState('100');

  // إعدادات Cloudinary من متغيرات البيئة
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

  // إضافة صورة جديدة
  const [newImgLabel, setNewImgLabel] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [gallery, setGallery] = useState<GalleryImageItem[]>([]);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

const fetchAll = async () => {
  setLoading(true);
  const [settingsRes, galleryRes] = await Promise.all([
    supabase
      .from('tech_banner_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle(),
    supabase
      .from('tech_banner_gallery')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  if (settingsRes.data) {
    const d = settingsRes.data;
    setIsEnabled(Boolean(d.is_enabled));
    setEnglishWords(d.english_words || 'Tech Spotlight');
    setArabicTitle(d.arabic_title || '');
    setArabicSubtitle(d.arabic_subtitle || '');
    setCtaLabel(d.cta_label || '');
    setCtaHref(d.cta_href || '#products');
    setShowCta(Boolean(d.show_cta));

    setBadgePosition((d.badge_position as ElementSide) || 'left');
    setBadgeLang((d.badge_lang as ElementLang) || 'en');
    setTitlePosition((d.title_position as ElementSide) || 'left');
    setTitleLang((d.title_lang as ElementLang) || 'ar');
    setSubtitlePosition((d.subtitle_position as ElementSide) || 'left');
    setSubtitleLang((d.subtitle_lang as ElementLang) || 'ar');
    setCtaPosition((d.cta_position as ElementSide) || 'left');
    setCtaLang((d.cta_lang as ElementLang) || 'ar');
    setTextScale((d.text_scale as TextScale) || 'normal');

    setActiveImageUrl(d.active_image_url || '');
    setActiveImageAlt(d.active_image_alt || 'أحدث الأجهزة الإلكترونية');
    setHeightMode((d.banner_height_mode as BannerHeightMode) || 'balanced');
    setMobileHeightMode((d.mobile_height_mode as BannerHeightMode) || 'xs');
    setFitMode((d.image_fit_mode as ImageFitMode) || 'cover');
    setMobileFitMode((d.mobile_fit_mode as ImageFitMode) || 'contain');
    setFocusX((d.image_focus_x as ImageFocusX) || 'right');
    setNavOffsetPx(Number(d.nav_offset_px ?? 64));
    setOverlayStrength((d.overlay_strength as OverlayStrength) || 'medium');
    setFlipHorizontal(Boolean(d.flip_horizontal));
    setImageZoom(String(d.image_zoom || '100'));
    setMobileImageZoom(String(d.mobile_image_zoom || '100'));
  }

  if (galleryRes.data) {
    setGallery(galleryRes.data as GalleryImageItem[]);
  }

  setLoading(false);
};

  useEffect(() => {
    fetchAll();
  }, []);

const saveSettings = async (
  overrides: Partial<{
    is_enabled: boolean;
    active_image_url: string;
  }> = {},
) => {
  setSaving(true);
  const nextUrl = overrides.active_image_url ?? activeImageUrl;
  const nextEnabled = overrides.is_enabled ?? isEnabled;

  const payload = {
    id: 'default',
    is_enabled: nextEnabled,
    english_words: englishWords.trim() || 'Tech Spotlight',
    arabic_title: arabicTitle.trim(),
    arabic_subtitle: arabicSubtitle.trim(),
    cta_label: ctaLabel.trim(),
    cta_href: ctaHref.trim() || '#products',
    show_cta: showCta,
    badge_position: badgePosition,
    badge_lang: badgeLang,
    title_position: titlePosition,
    title_lang: titleLang,
    subtitle_position: subtitlePosition,
    subtitle_lang: subtitleLang,
    cta_position: ctaPosition,
    cta_lang: ctaLang,
    text_scale: textScale,
    active_image_url: nextUrl.trim(),
    active_image_alt: activeImageAlt.trim() || 'أحدث الأجهزة الإلكترونية',
    banner_height_mode: heightMode,
    mobile_height_mode: mobileHeightMode,
    image_fit_mode: fitMode,
    mobile_fit_mode: mobileFitMode,
    image_focus_x: focusX,
    nav_offset_px: Math.max(0, Math.min(220, Number(navOffsetPx) || 0)),
    overlay_strength: overlayStrength,
    flip_horizontal: flipHorizontal,
    image_zoom: String(imageZoom || '100'),
    mobile_image_zoom: String(mobileImageZoom || '100'),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('tech_banner_settings')
    .upsert(payload, { onConflict: 'id' });

  setSaving(false);
  if (error) {
    notify('error', `تعذر الحفظ: ${error.message}`);
  } else {
    notify('success', 'تم حفظ جميع التعديلات وتحديث الواجهة فوراً');
  }
};

  const addImageToLibraryAndActivate = async (
    url: string,
    sourceType: 'cloudinary' | 'url',
    publicId: string | null = null,
    activateNow = true,
  ) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      notify('error', 'أدخل رابط صورة أو اختر ملف صورة أولاً');
      return;
    }

    if (activateNow) {
      await supabase
        .from('tech_banner_gallery')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await supabase
      .from('tech_banner_gallery')
      .insert({
        label: newImgLabel.trim() || `صورة ${gallery.length + 1}`,
        image_url: cleanUrl,
        cloudinary_public_id: publicId,
        source_type: sourceType,
        is_active: activateNow,
        is_hidden: false,
      })
      .select()
      .single();

    if (error || !data) {
      notify('error', 'تعذر إضافة الصورة إلى المكتبة');
      return;
    }

    setNewImgLabel('');
    setNewImgUrl('');

    if (activateNow) {
      setActiveImageUrl(cleanUrl);
      await saveSettings({ active_image_url: cleanUrl });
    }

    await fetchAll();
  };

  // رفع مباشر من الجهاز إلى Cloudinary
  const handleDeviceUploadToCloudinary = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!cloudName || !uploadPreset) {
      notify(
        'error',
        'تأكد من ضبط NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME و NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET في متغيرات البيئة',
      );
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );
      const json = await res.json();

      if (res.ok && json.secure_url) {
        await addImageToLibraryAndActivate(
          json.secure_url,
          'cloudinary',
          json.public_id || null,
          true,
        );
        notify(
          'success',
          'تم رفع الصورة من جهازك إلى Cloudinary وتفعيلها بنجاح!',
        );
      } else {
        const reason =
          json?.error?.message ||
          'تأكد أن Upload Preset من نوع Unsigned في Cloudinary';
        notify('error', `فشل الرفع: ${reason}`);
      }
    } catch {
      notify('error', 'تعذر الاتصال بخادم Cloudinary، تأكد من الإنترنت');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveActiveFromBanner = async () => {
    setActiveImageUrl('');
    await supabase
      .from('tech_banner_gallery')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await saveSettings({ active_image_url: '' });
    await fetchAll();
    notify('success', 'تمت إزالة الصورة من البانر وتبقى محفوظة في المكتبة');
  };

  const handleSelectGalleryImage = async (item: GalleryImageItem) => {
    await supabase
      .from('tech_banner_gallery')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase
      .from('tech_banner_gallery')
      .update({ is_active: true, is_hidden: false })
      .eq('id', item.id);

    setActiveImageUrl(item.image_url);
    await saveSettings({ active_image_url: item.image_url });
    await fetchAll();
  };

  const handleUpdateGalleryItem = async (item: GalleryImageItem) => {
    const { error } = await supabase
      .from('tech_banner_gallery')
      .update({
        label: item.label.trim() || 'صورة بانر',
        image_url: item.image_url.trim(),
        is_hidden: item.is_hidden,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (error) {
      notify('error', 'تعذر تعديل بيانات الصورة');
    } else {
      if (item.is_active) {
        setActiveImageUrl(item.image_url.trim());
        await saveSettings({ active_image_url: item.image_url.trim() });
      }
      notify('success', 'تم حفظ تعديل الصورة');
    }
  };

  const handleDeleteGalleryItem = async (item: GalleryImageItem) => {
    const { error } = await supabase
      .from('tech_banner_gallery')
      .delete()
      .eq('id', item.id);
    if (error) {
      notify('error', 'تعذر حذف الصورة من المكتبة');
      return;
    }

    if (activeImageUrl === item.image_url) {
      setActiveImageUrl('');
      await saveSettings({ active_image_url: '' });
    }

    setGallery((prev) => prev.filter((g) => g.id !== item.id));
    notify('success', 'تم حذف الصورة من المكتبة');
  };

  if (loading) {
    return (
      <div
        dir='rtl'
        className='rounded-2xl border border-slate-600/50 bg-slate-800/95 p-6 text-slate-200'
      >
        جاري تحميل لوحة التحكم الخاصة بالبانر...
      </div>
    );
  }
// =================
// =================
// =================
// =================
// =================

// =================
// =================
// =================
  return (
    <div
      dir='rtl'
      className='w-full rounded-2xl border border-slate-600/50 bg-slate-800/95 p-3.5 sm:p-6 text-slate-100 shadow-xl space-y-5'
    >
      {/* الهيدر */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-600/50 pb-4'>
        <div className='flex items-center gap-2.5'>
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-400/40'>
            <Zap className='h-5 w-5 text-purple-300' />
          </span>
          <div>
            <h2 className='text-sm sm:text-lg font-bold text-white'>
              إدارة بانر عرض الأجهزة (Tech Spotlight)
            </h2>
            <p className='text-[11px] sm:text-xs text-slate-300'>
              تخصيص كل جملة (يمين/شمال + عربي/إنجليزي)، قلب الصورة، المقاسات،
              ورفع Cloudinary.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => {
              const next = !isEnabled;
              setIsEnabled(next);
              saveSettings({ is_enabled: next });
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
              isEnabled
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                : 'border-rose-400/50 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
            }`}
          >
            <Power className='h-4 w-4' />
            <span>{isEnabled ? 'مفعّل' : 'متوقف'}</span>
          </button>

          <button
            type='button'
            onClick={() => saveSettings()}
            disabled={saving}
            className='inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-sky-500 hover:opacity-95 px-4 py-2 text-xs font-bold text-white shadow'
          >
            <Save className='h-4 w-4' />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
          </button>
        </div>
      </div>

      {/* إشعار */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm ${
            toast.type === 'success'
              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
              : 'border-rose-400/50 bg-rose-500/20 text-rose-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className='h-4 w-4 shrink-0' />
          ) : (
            <AlertCircle className='h-4 w-4 shrink-0' />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* القسم 1: التحكم التفصيلي المستقل في كل جملة (مكانها + لغتها + حجم الخط) */}
      <div className='rounded-xl border border-slate-600/50 bg-slate-900/65 p-3.5 sm:p-4 space-y-3.5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-xs sm:text-sm font-bold text-sky-300 flex items-center gap-1.5'>
            <Type className='h-4 w-4' />
            <span>
              تخصيص النصوص ومكان كل جملة (يمين أو شمال + عربي أو إنجليزي)
            </span>
          </h3>

          <div className='flex items-center gap-2 text-xs'>
            <span className='text-slate-300'>حجم الخط:</span>
            <select
              value={textScale}
              onChange={(e) => setTextScale(e.target.value as TextScale)}
              className='rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-white'
            >
              <option value='sm'>صغير ملموم</option>
              <option value='normal'>وسط متوازن</option>
              <option value='lg'>كبير واضح</option>
            </select>
          </div>
        </div>

        {/* 1. الشارة / الكلمتين المميزة */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-700/80 bg-slate-800/70 p-2.5 items-center'>
          <div className='md:col-span-6'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              1. الشارة / الكلمتين
            </label>
            <input
              type='text'
              dir={badgeLang === 'ar' ? 'rtl' : 'ltr'}
              value={englishWords}
              onChange={(e) => setEnglishWords(e.target.value)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-1.5 text-xs text-white'
            />
          </div>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              المكان
            </label>
            <select
              value={badgePosition}
              onChange={(e) => setBadgePosition(e.target.value as ElementSide)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='left'>شمال الصورة</option>
              <option value='right'>يمين الصورة</option>
            </select>
          </div>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              الاتجاه / اللغة
            </label>
            <select
              value={badgeLang}
              onChange={(e) => setBadgeLang(e.target.value as ElementLang)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='en'>English (LTR)</option>
              <option value='ar'>عربي (RTL)</option>
            </select>
          </div>
        </div>

        {/* 2. العنوان الرئيسي */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-700/80 bg-slate-800/70 p-2.5 items-center'>
          <div className='md:col-span-6'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              2. العنوان الرئيسي
            </label>
            <input
              type='text'
              dir={titleLang === 'ar' ? 'rtl' : 'ltr'}
              value={arabicTitle}
              onChange={(e) => setArabicTitle(e.target.value)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-1.5 text-xs text-white'
            />
          </div>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              المكان
            </label>
            <select
              value={titlePosition}
              onChange={(e) => setTitlePosition(e.target.value as ElementSide)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='left'>شمال الصورة</option>
              <option value='right'>يمين الصورة</option>
            </select>
          </div>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              الاتجاه / اللغة
            </label>
            <select
              value={titleLang}
              onChange={(e) => setTitleLang(e.target.value as ElementLang)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='ar'>عربي (RTL)</option>
              <option value='en'>English (LTR)</option>
            </select>
          </div>
        </div>

        {/* 3. الوصف المختصر */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-700/80 bg-slate-800/70 p-2.5 items-center'>
          <div className='md:col-span-6'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              3. الوصف المختصر
            </label>
            <input
              type='text'
              dir={subtitleLang === 'ar' ? 'rtl' : 'ltr'}
              value={arabicSubtitle}
              onChange={(e) => setArabicSubtitle(e.target.value)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-1.5 text-xs text-white'
            />
          </div>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              المكان
            </label>
            <select
              value={subtitlePosition}
              onChange={(e) =>
                setSubtitlePosition(e.target.value as ElementSide)
              }
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='left'>شمال الصورة</option>
              <option value='right'>يمين الصورة</option>
            </select>
          </div>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              الاتجاه / اللغة
            </label>
            <select
              value={subtitleLang}
              onChange={(e) => setSubtitleLang(e.target.value as ElementLang)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='ar'>عربي (RTL)</option>
              <option value='en'>English (LTR)</option>
            </select>
          </div>
        </div>

        {/* 4. زر الأكشن */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-700/80 bg-slate-800/70 p-2.5 items-center'>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              4. نص الزر
            </label>
            <input
              type='text'
              dir={ctaLang === 'ar' ? 'rtl' : 'ltr'}
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2.5 py-1.5 text-xs text-white'
            />
          </div>
          <div className='md:col-span-3'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              الرابط
            </label>
            <input
              type='text'
              dir='ltr'
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2.5 py-1.5 text-xs text-white'
            />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              المكان
            </label>
            <select
              value={ctaPosition}
              onChange={(e) => setCtaPosition(e.target.value as ElementSide)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='left'>شمال</option>
              <option value='right'>يمين</option>
            </select>
          </div>
          <div className='md:col-span-2'>
            <label className='block text-[11px] text-slate-300 mb-1'>
              اللغة
            </label>
            <select
              value={ctaLang}
              onChange={(e) => setCtaLang(e.target.value as ElementLang)}
              className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-xs text-white'
            >
              <option value='ar'>عربي</option>
              <option value='en'>English</option>
            </select>
          </div>
          <div className='md:col-span-2 pt-3 md:pt-4'>
            <label className='flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer'>
              <input
                type='checkbox'
                checked={showCta}
                onChange={(e) => setShowCta(e.target.checked)}
              />
              <span>إظهار الزر</span>
            </label>
          </div>
        </div>
      </div>

      {/* القسم 2: مقاسات البانر والصورة للموبايل واللابتوب، قلب الصورة، الزووم، وكثافة التدرج */}
      <div className='rounded-xl border border-slate-600/50 bg-slate-900/65 p-3.5 sm:p-4 space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5'>
            <SlidersHorizontal className='h-4 w-4' />
            <span>
              تحكم مستقل للموبايل واللابتوب (ارتفاع، احتواء، زووم، وتدرج)
            </span>
          </h3>

          <button
            type='button'
            onClick={() => setFlipHorizontal((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
              flipHorizontal
                ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <FlipHorizontal2 className='h-4 w-4' />
            <span>
              {flipHorizontal
                ? 'الصورة معكوسة أفقياً'
                : 'عكس الصورة (يمين ↔ شمال)'}
            </span>
          </button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs'>
          {/* 1. ارتفاع البانر على اللابتوب والشاشات الكبيرة (7 درجات) */}
          <div>
            <label className='block text-[11px] text-slate-300 mb-1'>
              1. ارتفاع اللابتوب والشاشات الكبيرة (7 درجات)
            </label>
            <select
              value={heightMode}
              onChange={(e) =>
                setHeightMode(e.target.value as BannerHeightMode)
              }
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='nano'>1 - شريط نانو نحيف جداً (Nano)</option>
              <option value='micro'>2 - شريط مايكرو رفيع (Micro)</option>
              <option value='xs'>3 - صغير رفيع (XS)</option>
              <option value='compact'>4 - صغير مدمج (Compact)</option>
              <option value='balanced'>5 - وسط متوازن (Balanced)</option>
              <option value='tall'>6 - عريض مرتفع (Tall)</option>
              <option value='cinematic'>7 - سينمائي كبير (Cinematic)</option>
            </select>
          </div>

          {/* 2. ارتفاع البانر على الموبايل بشكل مستقل (7 درجات) */}
          <div>
            <label className='block text-[11px] text-sky-300 font-semibold mb-1'>
              2. ارتفاع الموبايل بشكل مستقل (7 درجات)
            </label>
            <select
              value={mobileHeightMode}
              onChange={(e) =>
                setMobileHeightMode(e.target.value as BannerHeightMode)
              }
              className='w-full rounded-lg border border-sky-500/50 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='nano'>1 - نانو نحيف جداً (~125px)</option>
              <option value='micro'>2 - مايكرو رفيع (~160px)</option>
              <option value='xs'>3 - صغير رفيع (~195px - مثالي للفون)</option>
              <option value='compact'>4 - صغير مدمج (~235px)</option>
              <option value='balanced'>5 - وسط متوازن (~285px)</option>
              <option value='tall'>6 - مرتفع (~340px)</option>
              <option value='cinematic'>7 - كبير (~400px)</option>
            </select>
          </div>
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* ===================== */}
          {/* 3. طريقة احتواء الصورة على اللابتوب فقط */}
          <div>
            <label className='block text-[11px] text-slate-300 mb-1'>
              3. احتواء الصورة (اللابتوب فقط)
            </label>
            <select
              value={fitMode}
              onChange={(e) => {
                const nextDesktopFit = e.target.value as ImageFitMode;
                setFitMode(nextDesktopFit);
              }}
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='cover'>
                ملء الإطار مع الحفاظ على النسبة (Cover)
              </option>
              <option value='contain'>
                إظهار الصورة كاملة بدون قص (Contain)
              </option>
              <option value='contain_blur'>
                صورة كاملة + خلفية مموهة (Smart Blur)
              </option>
              <option value='scale_down'>
                تصغير تلقائي بدون تكبير زائد (Scale Down)
              </option>
              <option value='fill'>تمديد كامل على الإطار (Fill)</option>
            </select>
          </div>

          {/* 4. طريقة احتواء الصورة على الموبايل فقط */}
          <div>
            <label className='block text-[11px] text-sky-300 font-semibold mb-1'>
              4. احتواء الصورة (الموبايل فقط)
            </label>
            <select
              value={mobileFitMode}
              onChange={(e) => {
                const nextMobileFit = e.target.value as ImageFitMode;
                setMobileFitMode(nextMobileFit);
              }}
              className='w-full rounded-lg border border-sky-500/50 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='cover'>
                ملء الإطار مع الحفاظ على النسبة (Cover)
              </option>
              <option value='contain'>
                إظهار الصورة كاملة بدون قص (Contain)
              </option>
              <option value='contain_blur'>
                صورة كاملة + خلفية مموهة (Smart Blur)
              </option>
              <option value='scale_down'>
                تصغير تلقائي بدون تكبير زائد (Scale Down)
              </option>
              <option value='fill'>تمديد كامل على الإطار (Fill)</option>
            </select>
          </div>
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* ================================== */}
          {/* 5. تمركز الصورة أفقياً */}
          <div>
            <label className='block text-[11px] text-slate-300 mb-1'>
              5. تمركز الصورة أفقياً
            </label>
            <select
              value={focusX}
              onChange={(e) => setFocusX(e.target.value as ImageFocusX)}
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='right'>تركيز على اليمين (Right)</option>
              <option value='center'>تركيز في المنتصف (Center)</option>
              <option value='left'>تركيز على اليسار (Left)</option>
            </select>
          </div>

          {/* 6. كثافة التدرج الظلي (6 درجات) */}
          <div>
            <label className='block text-[11px] text-slate-300 mb-1'>
              6. كثافة التدرج الظلي (6 درجات)
            </label>
            <select
              value={overlayStrength}
              onChange={(e) =>
                setOverlayStrength(e.target.value as OverlayStrength)
              }
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='none'>0 - بدون أي تظليل (شفاف تماماً)</option>
              <option value='ultra_light'>1 - لمسة خفيفة جداً (25%)</option>
              <option value='light'>2 - تدرج خفيف (Light)</option>
              <option value='medium'>3 - تدرج وسط متوازن (Medium)</option>
              <option value='strong'>4 - تدرج قوي لوضوح النص (Strong)</option>
              <option value='cinema'>5 - إطار سينمائي دائري (Vignette)</option>
            </select>
          </div>

          {/* 7. زووم الصورة على اللابتوب */}
          <div>
            <label className='block text-[11px] text-slate-300 mb-1'>
              7. مقياس تقريب الصورة - اللابتوب (Zoom)
            </label>
            <select
              value={imageZoom}
              onChange={(e) => setImageZoom(e.target.value)}
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='90'>90% (تصغير خفيف لإظهار الأطراف)</option>
              <option value='100'>100% (الحجم الطبيعي)</option>
              <option value='108'>108% (تقريب بسيط)</option>
              <option value='115'>115% (تقريب متوسط)</option>
              <option value='125'>125% (تقريب قوي)</option>
            </select>
          </div>

          {/* 8. زووم الصورة على الموبايل بشكل مستقل */}
          <div>
            <label className='block text-[11px] text-sky-300 font-semibold mb-1'>
              8. مقياس تقريب الصورة - الموبايل (Zoom)
            </label>
            <select
              value={mobileImageZoom}
              onChange={(e) => setMobileImageZoom(e.target.value)}
              className='w-full rounded-lg border border-sky-500/50 bg-slate-800 px-2.5 py-2 text-white'
            >
              <option value='85'>85% (تصغير أكبر لإظهار كامل الصورة)</option>
              <option value='90'>90% (تصغير خفيف لإظهار الأطراف)</option>
              <option value='100'>100% (الحجم الطبيعي)</option>
              <option value='108'>108% (تقريب بسيط)</option>
              <option value='115'>115% (تقريب متوسط)</option>
            </select>
          </div>

          {/* 9. مسافة تفادي الناف */}
          <div>
            <label className='block text-[11px] text-slate-300 mb-1'>
              9. مسافة تفادي الناف العلوي (px)
            </label>
            <input
              type='number'
              min={0}
              max={220}
              value={navOffsetPx}
              onChange={(e) => setNavOffsetPx(Number(e.target.value))}
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-2 text-white'
            />
          </div>
        </div>
      </div>

      {/* القسم 3: رفع مباشر من الجهاز إلى Cloudinary + إضافة رابط */}
      <div className='rounded-xl border border-slate-600/50 bg-slate-900/65 p-3.5 sm:p-4 space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-1.5'>
            <Link2 className='h-4 w-4' />
            <span>رفع صورة من جهازك إلى Cloudinary أو وضع رابط مباشر</span>
          </h3>

          {activeImageUrl && (
            <button
              type='button'
              onClick={handleRemoveActiveFromBanner}
              className='inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 text-[11px] font-semibold text-amber-200'
            >
              <span>إزالة من البانر</span>
            </button>
          )}
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5'>
          <input
            type='text'
            value={newImgLabel}
            onChange={(e) => setNewImgLabel(e.target.value)}
            placeholder='اسم مميز للصورة (اختياري)'
            className='rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white'
          />

          <input
            type='text'
            dir='ltr'
            value={newImgUrl}
            onChange={(e) => setNewImgUrl(e.target.value)}
            placeholder='https://... رابط صورة مباشر'
            className='rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white'
          />

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() =>
                addImageToLibraryAndActivate(newImgUrl, 'url', null, true)
              }
              className='flex-1 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-2 text-xs font-bold text-white'
            >
              اعتماد الرابط
            </button>

            <label className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3.5 py-2 text-xs font-bold text-white shadow'>
              <UploadCloud className='h-4 w-4' />
              <span>{uploading ? 'جاري الرفع...' : 'رفع من الجهاز'}</span>
              <input
                type='file'
                accept='image/*'
                onChange={handleDeviceUploadToCloudinary}
                disabled={uploading}
                className='hidden'
              />
            </label>
          </div>
        </div>
      </div>

      {/* القسم 4: مكتبة الصور المحفوظة */}
      <div className='rounded-xl border border-slate-600/50 bg-slate-900/65 p-3.5 sm:p-4 space-y-3'>
        <h3 className='text-xs sm:text-sm font-bold text-purple-300 flex items-center gap-1.5'>
          <Images className='h-4 w-4' />
          <span>مكتبة الصور المحفوظة (تبديل، تعديل، إخفاء، أو حذف)</span>
        </h3>

        {gallery.length === 0 ? (
          <p className='text-xs text-slate-300'>
            لا توجد صور محفوظة بعد؛ أي صورة ترفعها من جهازك أو تضيف رابطها ستظهر
            هنا فوراً.
          </p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {gallery.map((item) => {
              const isCurrent = activeImageUrl === item.image_url;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 space-y-2 ${
                    isCurrent
                      ? 'border-emerald-400/60 bg-slate-800'
                      : item.is_hidden
                        ? 'border-slate-700 bg-slate-800/40 opacity-65'
                        : 'border-slate-600/60 bg-slate-800/85'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <img
                      src={item.image_url}
                      alt={item.label}
                      className='h-14 w-24 shrink-0 rounded-lg object-cover border border-slate-600'
                    />
                    <div className='min-w-0 flex-1 space-y-1'>
                      <div className='flex items-center gap-1.5'>
                        <span className='truncate text-xs font-bold text-white'>
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className='inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-200'>
                            <Check className='h-2.5 w-2.5' />
                            <span>نشطة</span>
                          </span>
                        )}
                      </div>
                      <span className='block text-[10px] text-slate-300'>
                        {item.source_type === 'cloudinary'
                          ? 'Cloudinary'
                          : 'رابط مباشر'}
                      </span>
                    </div>
                  </div>

                  <input
                    type='text'
                    value={item.label}
                    onChange={(e) =>
                      setGallery((prev) =>
                        prev.map((g) =>
                          g.id === item.id
                            ? { ...g, label: e.target.value }
                            : g,
                        ),
                      )
                    }
                    className='w-full rounded-lg border border-slate-600 bg-slate-900/90 px-2.5 py-1 text-xs text-white'
                  />

                  <div className='flex items-center justify-between gap-1.5 pt-1'>
                    <button
                      type='button'
                      onClick={() => handleSelectGalleryImage(item)}
                      className='rounded-lg bg-sky-600 hover:bg-sky-500 px-2.5 py-1 text-[11px] font-bold text-white'
                    >
                      تفعيل في البانر
                    </button>

                    <div className='flex items-center gap-1'>
                      <button
                        type='button'
                        onClick={() => {
                          const nextHidden = !item.is_hidden;
                          const updated = { ...item, is_hidden: nextHidden };
                          setGallery((prev) =>
                            prev.map((g) => (g.id === item.id ? updated : g)),
                          );
                          handleUpdateGalleryItem(updated);
                        }}
                        title={item.is_hidden ? 'إظهار' : 'إخفاء'}
                        className='rounded-lg border border-slate-600 bg-slate-700/70 p-1.5 text-slate-200 hover:text-white'
                      >
                        {item.is_hidden ? (
                          <EyeOff className='h-3.5 w-3.5' />
                        ) : (
                          <Eye className='h-3.5 w-3.5' />
                        )}
                      </button>

                      <button
                        type='button'
                        onClick={() => handleUpdateGalleryItem(item)}
                        title='حفظ التعديل'
                        className='rounded-lg border border-emerald-400/40 bg-emerald-500/20 p-1.5 text-emerald-200 hover:bg-emerald-500/30'
                      >
                        <Save className='h-3.5 w-3.5' />
                      </button>

                      <button
                        type='button'
                        onClick={() => handleDeleteGalleryItem(item)}
                        title='حذف نهائي'
                        className='rounded-lg border border-rose-400/40 bg-rose-500/20 p-1.5 text-rose-200 hover:bg-rose-500/30'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
