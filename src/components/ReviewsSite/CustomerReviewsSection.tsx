'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Heart,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Quote,
  Maximize2,
  X,
  Pause,
  Play,
  Layers,
  Eye,
} from 'lucide-react';



export type ReviewSourceType = 'admin_manual' | 'customer_text';

export interface StoreReviewItem {
  id: string;
  source_type: ReviewSourceType;
  reviewer_name: string;
  reviewer_channel: string;
  rating: number;
  comment_text: string | null;
  image_url: string | null;
  admin_reply: string | null;
  likes_count: number;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface StoreReviewsSettings {
  id: string;
  is_section_enabled: boolean;
  allow_customer_reviews: boolean;
  admin_only_mode: boolean;
  auto_publish_customer: boolean;
  cards_per_page: number;
  auto_slide_interval_ms: number;
}

const DEFAULT_SETTINGS: StoreReviewsSettings = {
  id: 'default',
  is_section_enabled: true,
  allow_customer_reviews: true,
  admin_only_mode: false,
  auto_publish_customer: true,
  cards_per_page: 4,
  auto_slide_interval_ms: 4500,
};

export default function CustomerReviewsSection() {
  const [settings, setSettings] =
    useState<StoreReviewsSettings>(DEFAULT_SETTINGS);
  const [reviews, setReviews] = useState<StoreReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // فورم العميل الخفيفة
  const [formOpen, setFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerRating, setCustomerRating] = useState(5);
  const [customerComment, setCustomerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const fractionalScrollRef = useRef<number>(0);

  // ندمج الكروت مرتين علشان يعمل Infinite Loop ناعم بدون أي نطة مفاجئة
  const loopReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    if (reviews.length === 1)
      return reviews.map((r, i) => ({ ...r, _realIndex: i }));
    const mapped = reviews.map((r, i) => ({ ...r, _realIndex: i }));
    return [...mapped, ...mapped];
  }, [reviews]);

  const fetchData = useCallback(async () => {
    const [settingsRes, itemsRes] = await Promise.all([
      supabase
        .from('store_reviews_settings')
        .select(
          'id, is_section_enabled, allow_customer_reviews, admin_only_mode, auto_publish_customer, cards_per_page, auto_slide_interval_ms',
        )
        .eq('id', 'default')
        .maybeSingle(),
      supabase
        .from('store_reviews_items')
        .select(
          'id, source_type, reviewer_name, reviewer_channel, rating, comment_text, image_url, admin_reply, likes_count, is_visible, is_featured, created_at',
        )
        .eq('is_visible', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data as StoreReviewsSettings);
    }

    if (itemsRes.data) {
      setReviews(itemsRes.data as StoreReviewItem[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('store_reviews_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_reviews_settings' },
        () => fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_reviews_items' },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('abdo_store_liked_reviews');
      if (saved) setLikedIds(JSON.parse(saved));
    } catch {
      // تجاهل
    }
  }, []);

  // حساب الكروت المعروضة حالياً ورقم الكارت النشط بدقة
  const updateMetrics = useCallback(() => {
    const el = scrollTrackRef.current;
    if (!el || reviews.length === 0) return;

    const firstCard = el.querySelector<HTMLElement>('[data-review-card]');
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth + 12; // 12px = gap-3
    const containerWidth = el.clientWidth;
    const currentlyVisible = Math.min(
      reviews.length,
      Math.max(1, Math.round(containerWidth / cardWidth)),
    );
    setVisibleCount(currentlyVisible);

    const scrolledDistance = Math.abs(el.scrollLeft);
    const rawIndex = Math.round(scrolledDistance / cardWidth) % reviews.length;
    setActiveIndex(rawIndex);
  }, [reviews.length]);

  useEffect(() => {
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics, reviews.length]);

  // حركة Marquee انسيابية مستمرة (60fps) بدون أي تقطيع أو نطات مفاجئة
  useEffect(() => {
    if (
      loading ||
      !settings.is_section_enabled ||
      reviews.length <= 1 ||
      isPaused ||
      isInteracting ||
      formOpen ||
      Boolean(lightboxImage)
    ) {
      lastTimeRef.current = null;
      return;
    }

    const el = scrollTrackRef.current;
    if (!el) return;

    // سرعة الحركة بالبكسل في الثانية بناءً على إعدادات الأدمن
    const speedPxPerSec = Math.max(
      24,
      Math.min(
        90,
        160000 / Math.max(2000, settings.auto_slide_interval_ms || 4500),
      ),
    );

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const halfScrollWidth = el.scrollWidth / 2;
      if (halfScrollWidth > 0) {
        fractionalScrollRef.current += speedPxPerSec * deltaSec;

        if (fractionalScrollRef.current >= 1) {
          const step = Math.floor(fractionalScrollRef.current);
          fractionalScrollRef.current -= step;

          // في RTL قيمة scrollLeft بتكون سالبة أو صفرية حسب المتصفح
          const currentAbs = Math.abs(el.scrollLeft);
          const nextAbs = currentAbs + step;

          if (nextAbs >= halfScrollWidth) {
            // رجوع صامت لنقطة البداية المطابقة بصرياً 100%
            el.scrollLeft = -(nextAbs - halfScrollWidth);
          } else {
            el.scrollLeft = -nextAbs;
          }
          updateMetrics();
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      lastTimeRef.current = null;
    };
  }, [
    loading,
    settings.is_section_enabled,
    settings.auto_slide_interval_ms,
    reviews.length,
    isPaused,
    isInteracting,
    formOpen,
    lightboxImage,
    updateMetrics,
  ]);

  const canCustomerSubmit =
    settings.allow_customer_reviews && !settings.admin_only_mode;

  // تحريك يدوي ناعم خطوة واحدة يمين أو شمال
  const handleStepSlide = (direction: 'next' | 'prev') => {
    const el = scrollTrackRef.current;
    if (!el || reviews.length <= 1) return;

    setIsInteracting(true);
    const firstCard = el.querySelector<HTMLElement>('[data-review-card]');
    const step = (firstCard?.offsetWidth || 260) + 12;
    const halfWidth = el.scrollWidth / 2;
    const currentAbs = Math.abs(el.scrollLeft);

    if (direction === 'next') {
      const target = currentAbs + step;
      if (target >= halfWidth) {
        el.scrollLeft = -(currentAbs - halfWidth);
        el.scrollBy({ left: -step, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -step, behavior: 'smooth' });
      }
    } else {
      if (currentAbs <= step) {
        el.scrollLeft = -(currentAbs + halfWidth);
        el.scrollBy({ left: step, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }

    setTimeout(() => {
      updateMetrics();
      setIsInteracting(false);
    }, 550);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollTrackRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setIsInteracting(true);
    dragStartXRef.current = e.pageX - el.offsetLeft;
    dragStartScrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollTrackRef.current) return;
    e.preventDefault();
    const el = scrollTrackRef.current;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.3;
    el.scrollLeft = dragStartScrollLeftRef.current - walk;
    updateMetrics();
  };

  const stopDragging = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setTimeout(() => setIsInteracting(false), 700);
  };

  const handleToggleLike = async (review: StoreReviewItem) => {
    const alreadyLiked = Boolean(likedIds[review.id]);
    const nextLikes = alreadyLiked
      ? Math.max(0, review.likes_count - 1)
      : review.likes_count + 1;

    setReviews((prev) =>
      prev.map((item) =>
        item.id === review.id ? { ...item, likes_count: nextLikes } : item,
      ),
    );

    const nextLikedMap = { ...likedIds, [review.id]: !alreadyLiked };
    setLikedIds(nextLikedMap);
    try {
      localStorage.setItem(
        'abdo_store_liked_reviews',
        JSON.stringify(nextLikedMap),
      );
    } catch {
      // تجاهل
    }

    await supabase
      .from('store_reviews_items')
      .update({ likes_count: nextLikes })
      .eq('id', review.id);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!canCustomerSubmit) {
      setFormFeedback({
        type: 'error',
        text: 'إضافة آراء العملاء متوقفة حالياً من الإدارة.',
      });
      return;
    }

    const cleanName = customerName.trim();
    const cleanComment = customerComment.trim();

    if (!cleanName || !cleanComment) {
      setFormFeedback({
        type: 'error',
        text: 'من فضلك اكتب اسمك وتعليقك.',
      });
      return;
    }

    setSubmitting(true);
    const shouldPublishNow = settings.auto_publish_customer;

    const { error } = await supabase.from('store_reviews_items').insert({
      source_type: 'customer_text',
      reviewer_name: cleanName,
      reviewer_channel: 'المتجر',
      rating: customerRating,
      comment_text: cleanComment,
      image_url: null,
      admin_reply: null,
      likes_count: 0,
      is_visible: shouldPublishNow,
      is_featured: false,
    });

    setSubmitting(false);

    if (error) {
      setFormFeedback({
        type: 'error',
        text: 'تعذر إرسال رأيك الآن، حاول مرة أخرى.',
      });
      return;
    }

    setCustomerName('');
    setCustomerComment('');
    setCustomerRating(5);
    setFormFeedback({
      type: 'success',
      text: shouldPublishNow
        ? 'تم نشر رأيك فوراً في السلايدر!'
        : 'تم استلام رأيك وسيظهر بعد مراجعة الإدارة.',
    });

    if (shouldPublishNow) {
      if (scrollTrackRef.current) {
        scrollTrackRef.current.scrollLeft = 0;
      }
      fetchData();
    }
  };

  // حساب نطاق الكروت المعروضة حالياً (مثلاً: 1 - 3)
  const rangeLabel = useMemo(() => {
    if (reviews.length === 0) return '0';
    const start = activeIndex + 1;
    const end = ((activeIndex + visibleCount - 1) % reviews.length) + 1;
    return start === end ? `${start}` : `${start} – ${end}`;
  }, [activeIndex, visibleCount, reviews.length]);

  if (loading || !settings.is_section_enabled) {
    return null;
  }

  return (
    <section
      dir='rtl'
      aria-label='آراء العملاء'
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      className='relative w-full py-6 sm:py-9 px-3 sm:px-6 text-slate-100'
    >
      <div className='mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#090f19]/95 p-4 sm:p-6 shadow-2xl overflow-hidden'>
        {/* الهيدر + بوكس الإحصائيات + أزرار التحكم */}
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 border-b border-white/10 pb-4'>
          {/* العنوان */}
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/25 via-purple-500/25 to-sky-500/25 border border-white/15 shadow-inner'>
              <Quote className='h-4 w-4 text-purple-300' />
            </span>
            <div>
              <h2 className='text-sm sm:text-base font-bold text-white'>
                آراء عملائنا وتجاربهم
              </h2>
              <p className='text-[11px] sm:text-xs text-slate-400'>
                تقييمات حقيقية ولقطات موثقة من تواصل العملاء
              </p>
            </div>
          </div>

          {/* بوكس عداد التقييمات والمعروض حالياً + أزرار التحكم */}
          <div className='flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5'>
            {/* البوكس الجذاب لإجمالي الكروت والمعروض */}
            {reviews.length > 0 && (
              <div
                dir='ltr'
                className='w-fit me-auto flex flex-wrap items-center gap-1.5 sm:gap-3 rounded-xl border border-purple-400/25 bg-gradient-to-r from-[#0e1626] via-[#131d33] to-[#0e1626] px-2.5 sm:px-3 py-1.5 shadow-md'
              >
                <div className='flex items-center gap-1.5'>
                  <span className='relative flex h-2 w-2'>
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${
                        !isPaused ? 'animate-ping' : ''
                      }`}
                    />
                    <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-400' />
                  </span>
                  <Eye className='h-3.5 w-3.5 text-sky-400' />
                  <span className='text-[11px] text-slate-300'>Showing:</span>
                  <span className='rounded-md bg-sky-500/15 border border-sky-400/30 px-1.5 py-0.5 text-[11px] font-bold text-sky-300 tabular-nums'>
                    {rangeLabel} ({visibleCount})
                  </span>
                </div>

                <span className='h-3.5 w-px bg-white/10' />

                <div className='flex items-center gap-1.5'>
                  <Layers className='h-3.5 w-3.5 text-purple-400' />
                  <span className='text-[11px] text-slate-300'>Total:</span>
                  <span className='rounded-md bg-purple-500/15 border border-purple-400/30 px-1.5 py-0.5 text-[11px] font-bold text-purple-300 tabular-nums'>
                    {reviews.length}{' '}
                    {reviews.length === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </div>
            )}
            {/* أزرار التفاعل */}
            <div className='flex items-center gap-1.5'>
              {canCustomerSubmit && (
                <button
                  type='button'
                  onClick={() => {
                    setFormOpen((prev) => !prev);
                    setFormFeedback(null);
                  }}
                  className='inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-sky-600 hover:brightness-110 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95'
                >
                  <MessageSquarePlus className='h-3.5 w-3.5' />
                  <span>{formOpen ? 'إغلاق' : 'أضف رأيك'}</span>
                </button>
              )}

              {reviews.length > 1 && (
                <>
                  <button
                    type='button'
                    onClick={() => setIsPaused((p) => !p)}
                    title={isPaused ? 'تشغيل الحركة' : 'إيقاف الحركة'}
                    className='flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0e1626] text-slate-300 hover:border-purple-400/50 hover:text-white transition-all active:scale-95'
                  >
                    {isPaused ? (
                      <Play className='h-3.5 w-3.5 text-emerald-400' />
                    ) : (
                      <Pause className='h-3.5 w-3.5' />
                    )}
                  </button>

                  <button
                    type='button'
                    onClick={() => handleStepSlide('prev')}
                    aria-label='السابق'
                    className='flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0e1626] text-slate-200 hover:border-sky-400/50 hover:bg-sky-500/10 transition-all active:scale-95'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>

                  <button
                    type='button'
                    onClick={() => handleStepSlide('next')}
                    aria-label='التالي'
                    className='flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0e1626] text-slate-200 hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-all active:scale-95'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* فورم العميل */}
        {canCustomerSubmit && formOpen && (
          <form
            onSubmit={handleCustomerSubmit}
            className='mt-4 rounded-xl border border-purple-400/30 bg-[#0e1626] p-3.5 space-y-2.5 animate-fadeIn'
          >
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-xs font-semibold text-purple-200'>
                اكتب رأيك باختصار
              </span>

              <div
                className='flex items-center gap-1'
                role='group'
                aria-label='التقييم'
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => setCustomerRating(star)}
                    className='p-0.5 transition-transform hover:scale-125'
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= customerRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
              <input
                type='text'
                maxLength={40}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder='اسمك'
                className='rounded-lg border border-white/10 bg-[#07090e] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none'
              />
              <input
                type='text'
                maxLength={240}
                value={customerComment}
                onChange={(e) => setCustomerComment(e.target.value)}
                placeholder='شاركنا تجربتك مع المتجر...'
                className='sm:col-span-2 rounded-lg border border-white/10 bg-[#07090e] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none'
              />
            </div>

            <div className='flex items-center justify-between gap-2 pt-0.5'>
              {formFeedback ? (
                <p
                  className={`text-[11px] font-medium ${
                    formFeedback.type === 'success'
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                >
                  {formFeedback.text}
                </p>
              ) : (
                <span className='text-[11px] text-slate-400'>
                  رأيك يهمنا ويساعد عملاءنا الآخرين
                </span>
              )}

              <button
                type='submit'
                disabled={submitting}
                className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3.5 py-1.5 text-xs font-bold text-white transition-all active:scale-95'
              >
                <Send className='h-3 w-3' />
                <span>{submitting ? 'جاري الإرسال...' : 'إرسال'}</span>
              </button>
            </div>
          </form>
        )}

        {/* مسار السلايدر الانسيابي المستمر */}
        {loopReviews.length === 0 ? (
          <div className='py-8 text-center text-xs text-slate-400'>
            لا توجد آراء معروضة حالياً.
          </div>
        ) : (
          <div className='relative mt-4'>
            {/* تدرج ناعم على الأطراف لإعطاء عمق بصري */}
            <div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-4 sm:w-8 bg-gradient-to-l from-[#090f19] to-transparent' />
            <div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-4 sm:w-8 bg-gradient-to-r from-[#090f19] to-transparent' />

            <div
              ref={scrollTrackRef}
              onScroll={updateMetrics}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              onTouchStart={() => setIsInteracting(true)}
              onTouchEnd={() => setTimeout(() => setIsInteracting(false), 800)}
              className='reviews-h-scroll flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 select-none cursor-grab active:cursor-grabbing'
            >
              {loopReviews.map((review, idx) => {
                const isLiked = Boolean(likedIds[review.id]);
                const isAdminScreenshot = review.source_type === 'admin_manual';
                const cardNumber = review._realIndex + 1;

                return (
                  <article
                    key={`${review.id}-${idx}`}
                    data-review-card
                    className='group relative shrink-0 w-[82%] sm:w-[46%] md:w-[32%] lg:w-[24.2%] flex flex-col justify-between rounded-xl border border-white/10 bg-gradient-to-b from-[#111b2e] to-[#0b1220] p-3 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/50 hover:shadow-purple-500/10'
                  >
                    {/* شريط علوي مضيء خفيف عند الهوفر */}
                    <div className='pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

                    <div className='space-y-2'>
                      {/* صف رقم الكارت + النجوم */}
                      <div className='flex items-center justify-between gap-2'>
                        <span className='inline-flex items-center gap-1 rounded-lg border border-purple-400/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-extrabold text-purple-200 tabular-nums shadow-sm'>
                          <span>#{String(cardNumber).padStart(2, '0')}</span>
                          <span className='text-purple-400/60'>/</span>
                          <span className='text-slate-400 font-medium'>
                            {reviews.length}
                          </span>
                        </span>

                        <div className='flex items-center gap-0.5'>
                          {Array.from({ length: 5 }).map((_, starIdx) => (
                            <Star
                              key={starIdx}
                              className={`h-3 w-3 transition-transform duration-300 group-hover:scale-110 ${
                                starIdx < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* اسم العميل وشارة التوثيق */}
                      <div className='min-w-0 pt-0.5'>
                        <div className='flex items-center gap-1.5'>
                          <h3 className='truncate text-xs sm:text-[13px] font-bold text-white'>
                            {review.reviewer_name}
                          </h3>
                          {review.is_featured && (
                            <span className='shrink-0 rounded-md bg-amber-500/15 border border-amber-400/35 px-1.5 py-0.2 text-[9px] font-bold text-amber-300'>
                              مميز
                            </span>
                          )}
                        </div>
                        <span className='inline-flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-full'>
                          {isAdminScreenshot && (
                            <ShieldCheck className='h-3 w-3 text-emerald-400 shrink-0' />
                          )}
                          <span className='truncate'>
                            {isAdminScreenshot
                              ? `موثق • ${review.reviewer_channel}`
                              : review.reviewer_channel}
                          </span>
                        </span>
                      </div>

                      {/* صورة السكرين شوت إن وجدت */}
                      {review.image_url && (
                        <div className='relative overflow-hidden rounded-lg border border-white/10 bg-[#07090e]'>
                          <img
                            src={review.image_url}
                            alt={`رأي ${review.reviewer_name}`}
                            draggable={false}
                            className='h-24 sm:h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105'
                            loading='lazy'
                          />
                          <button
                            type='button'
                            onClick={() =>
                              setLightboxImage({
                                url: review.image_url!,
                                name: review.reviewer_name,
                              })
                            }
                            title='تكبير الصورة'
                            className='absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/75 text-white backdrop-blur-sm transition-transform hover:scale-110 hover:bg-purple-600'
                          >
                            <Maximize2 className='h-3 w-3' />
                          </button>
                        </div>
                      )}

                      {/* نص التعليق */}
                      {review.comment_text && (
                        <p className='line-clamp-3 text-[11px] sm:text-xs leading-relaxed text-slate-200'>
                          {review.comment_text}
                        </p>
                      )}

                      {/* رد الإدارة */}
                      {review.admin_reply && (
                        <div className='rounded-lg border-r-2 border-sky-400 bg-sky-500/10 px-2.5 py-1.5 text-[10px] leading-snug text-sky-200'>
                          <span className='font-bold text-sky-300'>الرد: </span>
                          <span className='line-clamp-2'>
                            {review.admin_reply}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* الفوتر: التاريخ + اللايك */}
                    <div className='mt-3 flex items-center justify-between border-t border-white/10 pt-2'>
                      <span className='text-[10px] text-slate-500'>
                        {new Date(review.created_at).toLocaleDateString(
                          'ar-EG',
                        )}
                      </span>

                      <button
                        type='button'
                        onClick={() => handleToggleLike(review)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all active:scale-90 ${
                          isLiked
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-rose-300'
                        }`}
                      >
                        <Heart
                          className={`h-3 w-3 transition-transform ${
                            isLiked
                              ? 'fill-rose-400 text-rose-400 scale-110'
                              : ''
                          }`}
                        />
                        <span className='tabular-nums'>
                          {review.likes_count}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* نافذة معاينة مكبرة لصورة السكرين شوت */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='relative max-w-lg w-full rounded-2xl border border-white/15 bg-[#090f19] p-3.5 shadow-2xl'
          >
            <div className='mb-2.5 flex items-center justify-between px-1'>
              <span className='text-xs font-bold text-slate-200'>
                {lightboxImage.name}
              </span>
              <button
                type='button'
                onClick={() => setLightboxImage(null)}
                className='rounded-lg bg-white/10 p-1 text-slate-300 hover:bg-white/20 hover:text-white transition-colors'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className='max-h-[75vh] w-full rounded-xl object-contain bg-[#07090e]'
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .reviews-h-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .reviews-h-scroll::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
