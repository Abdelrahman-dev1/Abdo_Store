'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ChevronRight,
  ChevronLeft,
  Heart,
  ShoppingCart,
  Clock,
  Sparkles,
  Truck,
  ShieldCheck,
  Headphones,
  Star,
  Flame,
  CheckCircle2,
} from 'lucide-react';

// --- Interfaces ---
export interface ProductItem {
  id: string | number;
  name: string;
  subtitle?: string;
  category?: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  badge?: string;
  rating?: number;
}

// --- Default Mock Data ---
const DEFAULT_HERO_SLIDES: ProductItem[] = [
  {
    id: 'h1',
    name: 'تجميعه الألعاب الاحترافية - Cyber Edition',
    subtitle: 'أعلى أداء للجيمرز وصناع المحتوى مع ضمان واستبدال فوري',
    badge: 'عرض لفترة محدودة جداً',
    discountPercentage: 25,
    originalPrice: 45000,
    price: 33750,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop',
    category: 'PC Systems',
  },
  {
    id: 'h2',
    name: 'سماعات الألعاب المحيطية Wireless Pro',
    subtitle: 'عزل صوتي تام مع مايكروفون كريستالي ونقاء استثنائي',
    badge: 'عرض لفترة محدودة جداً',
    discountPercentage: 40,
    originalPrice: 3200,
    price: 1920,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1200&auto=format&fit=crop',
    category: 'Audio',
  },
  {
    id: 'h3',
    name: 'ماوس وكيبورد ميكانيكي RGB Ultra-Fast',
    subtitle:
      'سرعة استجابة متناهية في الأجزاء من الثانية لمنافسات الـ E-Sports',
    badge: 'عرض لفترة محدودة جداً',
    discountPercentage: 30,
    originalPrice: 2800,
    price: 1960,
    rating: 5.0,
    image:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=1200&auto=format&fit=crop',
    category: 'Keyboards',
  },
];

const FLASH_DEALS: ProductItem[] = [
  {
    id: 'f1',
    name: 'سماعات ألعاب لاسلكية بروفيشنال RGB',
    category: 'إكسسوارات ألعاب',
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop',
    price: 1920,
    originalPrice: 3200,
    discountPercentage: 40,
  },
  {
    id: 'f2',
    name: 'كيبورد ميكانيكي مخصص للمحترفين',
    category: 'لوحات مفاتيح',
    image:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
    price: 1960,
    originalPrice: 2800,
    discountPercentage: 30,
  },
  {
    id: 'f3',
    name: 'ماوس الألعاب الخارق بمستشعر ضوئي دقيق',
    category: 'ملحقات PC',
    image:
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop',
    price: 950,
    originalPrice: 1500,
    discountPercentage: 35,
  },
  {
    id: 'f4',
    name: 'شاشة ألعاب منحنية 27 بوصة 165Hz',
    category: 'شاشات عرض',
    image:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop',
    price: 7499,
    originalPrice: 9999,
    discountPercentage: 25,
  },
];

const TOP_ANNOUNCEMENTS = [
  'اطمئن.. هنا هتلاقي كل احتياجاتك بأقل سعر وأعلى جودة ✨',
  'شحن سريع لجميع المحافظات + ضمان استرجاع 14 يوم 🚀',
  'خصومات حصرية لفترة محدودة تصل إلى 50% على المنتجات الأكثر طلباً 💥',
];

export default function StorefrontSection() {
  // States
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [cartAdded, setCartAdded] = useState<Record<string, boolean>>({});

  // Refs for Sliders
  const flashScrollRef = useRef<HTMLDivElement>(null);
  const slider1Ref = useRef<HTMLDivElement>(null);
  const slider2Ref = useRef<HTMLDivElement>(null);

  // Top Announcement Rotator
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % TOP_ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Hero Auto Play
  const nextHero = useCallback(() => {
    setHeroIndex((prev) => (prev + 1) % DEFAULT_HERO_SLIDES.length);
  }, []);

  const prevHero = () => {
    setHeroIndex(
      (prev) =>
        (prev - 1 + DEFAULT_HERO_SLIDES.length) % DEFAULT_HERO_SLIDES.length,
    );
  };

  useEffect(() => {
    if (isHeroHovered) return;
    const interval = setInterval(nextHero, 5000);
    return () => clearInterval(interval);
  }, [isHeroHovered, nextHero]);

  // Wishlist & Cart Handlers
  const toggleWishlist = (id: string | number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = (id: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartAdded((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCartAdded((prev) => ({ ...prev, [id]: false }));
    }, 1500);
  };

  // Generic Manual Scroll Handler
  const scrollContainer = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
  ) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const amount = clientWidth * 0.75;
      ref.current.scrollTo({
        left: direction === 'left' ? scrollLeft - amount : scrollLeft + amount,
        behavior: 'smooth',
      });
    }
  };

  const currentHero = DEFAULT_HERO_SLIDES[heroIndex];

  return (
    <div
      dir='rtl'
      className='bg-[#090d16] min-h-screen text-white font-sans selection:bg-rose-500 selection:text-white pb-20'
    >
      {/* ========================================================= */}
      {/* 1. HERO SECTION & DYNAMIC CAROUSEL                         */}
      {/* ========================================================= */}
      <header className='relative border-b border-slate-800/80 pt-8 pb-14 px-4 sm:px-6 overflow-hidden'>
        <div className='absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none' />
        <div className='absolute bottom-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none' />

        <div className='max-w-6xl mx-auto space-y-8 relative z-10'>
          {/* Animated Announcement Tagline */}
          <div className='flex justify-center'>
            <div className='h-9 flex items-center px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-medium shadow-xl backdrop-blur-md overflow-hidden'>
              <Zap className='w-4 h-4 text-yellow-400 shrink-0 ml-2 animate-pulse' />
              <AnimatePresence mode='wait'>
                <motion.span
                  key={announcementIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className='inline-block text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-rose-200 to-slate-300 font-bold'
                >
                  {TOP_ANNOUNCEMENTS[announcementIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Main Hero Slider */}
          <div
            className='relative w-full rounded-3xl overflow-hidden border border-slate-800/90 bg-[#0e1626]/80 shadow-2xl shadow-black/60 group'
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
          >
            <div className='relative h-[380px] sm:h-[460px] md:h-[520px] w-full overflow-hidden'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentHero.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className='absolute inset-0'
                >
                  <img
                    src={currentHero.image}
                    alt={currentHero.name}
                    className='w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/60 to-black/30' />
                  <div className='absolute inset-0 bg-gradient-to-r from-[#090d16]/90 via-transparent to-[#090d16]/40' />
                </motion.div>
              </AnimatePresence>

              {/* Top Badges & Actions */}
              <div className='absolute top-4 sm:top-6 right-4 sm:right-6 left-4 sm:left-6 flex items-center justify-between z-20 pointer-events-none'>
                <div className='flex items-center gap-2 flex-wrap pointer-events-auto'>
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black shadow-lg'>
                    <Clock size={14} />
                    {currentHero.badge}
                  </span>
                  {currentHero.discountPercentage && (
                    <span className='px-3 py-1.5 rounded-xl bg-amber-500/90 text-black text-xs font-extrabold shadow-md backdrop-blur-md'>
                      خصم %{currentHero.discountPercentage}-
                    </span>
                  )}
                </div>

                <div className='flex items-center gap-2 pointer-events-auto'>
                  <button
                    onClick={(e) => toggleWishlist(currentHero.id, e)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition shadow-xl backdrop-blur-md ${
                      wishlist[currentHero.id]
                        ? 'bg-rose-600 border-rose-500 text-white scale-110'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-rose-400'
                    }`}
                  >
                    <Heart
                      size={18}
                      className={wishlist[currentHero.id] ? 'fill-current' : ''}
                    />
                  </button>
                  <button
                    onClick={(e) => handleAddToCart(currentHero.id, e)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition shadow-xl backdrop-blur-md ${
                      cartAdded[currentHero.id]
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-emerald-400'
                    }`}
                  >
                    {cartAdded[currentHero.id] ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <ShoppingCart size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Content */}
              <div className='absolute bottom-0 right-0 left-0 p-6 sm:p-10 z-20 flex flex-col justify-end'>
                <div className='max-w-2xl space-y-3'>
                  {currentHero.rating && (
                    <div className='flex items-center gap-1 text-amber-400 text-xs font-bold'>
                      <Star size={14} className='fill-amber-400' />
                      <span>{currentHero.rating}</span>
                      <span className='text-slate-400 font-normal mr-1'>
                        (تقييمات العملاء)
                      </span>
                    </div>
                  )}
                  <h2 className='text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md'>
                    {currentHero.name}
                  </h2>
                  <p className='text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed max-w-xl'>
                    {currentHero.subtitle}
                  </p>
                  <div className='flex items-center gap-3 pt-2'>
                    {currentHero.price && (
                      <span className='text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300'>
                        {currentHero.price.toLocaleString()} ج.م
                      </span>
                    )}
                    {currentHero.originalPrice && (
                      <span className='text-sm sm:text-base text-slate-500 line-through font-semibold'>
                        {currentHero.originalPrice.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrows */}
              <button
                onClick={prevHero}
                className='absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/70 border border-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition shadow-xl'
              >
                <ChevronRight size={22} />
              </button>
              <button
                onClick={nextHero}
                className='absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/70 border border-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition shadow-xl'
              >
                <ChevronLeft size={22} />
              </button>
            </div>

            {/* Dots */}
            <div className='bg-[#0e1626] py-3 border-t border-slate-800 flex items-center justify-center gap-2'>
              {DEFAULT_HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === heroIndex
                      ? 'w-8 bg-gradient-to-r from-red-500 to-rose-500'
                      : 'w-2 bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/60'>
            <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800'>
              <div className='w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400'>
                <Truck size={20} />
              </div>
              <div>
                <h4 className='text-xs font-bold text-white'>
                  توصيل سريع لجميع المحافظات
                </h4>
                <p className='text-[11px] text-slate-400'>
                  شحن مباشر وآمن حتى باب المنزل
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800'>
              <div className='w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400'>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className='text-xs font-bold text-white'>
                  ضمان الجودة والأصالة
                </h4>
                <p className='text-[11px] text-slate-400'>
                  منتجات أصلية 100% مع ضمان استبدال
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800'>
              <div className='w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400'>
                <Headphones size={20} />
              </div>
              <div>
                <h4 className='text-xs font-bold text-white'>
                  دعم فني متواصل 24/7
                </h4>
                <p className='text-[11px] text-slate-400'>
                  فريق متواجد دائماً لخدمتك وإجابتك
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. FLASH DEALS SLIDER SECTION                              */}
      {/* ========================================================= */}
      <section className='max-w-7xl mx-auto px-4 sm:px-6 py-12 border-b border-slate-800'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4'>
          <div className='flex items-start gap-3.5 text-left'>
            <div className='p-2.5 bg-red-950/60 border border-red-500/30 rounded-xl text-red-500 mt-1 shrink-0'>
              <Flame size={22} className='text-red-400 animate-pulse' />
            </div>
            <div className='space-y-1'>
              <h2 className='text-2xl font-black text-white tracking-tight'>
                Flash Deals
              </h2>
              <p className='text-xs text-slate-400'>
                تخفيضات كبرى بكميات محدودة لفترة وجيزة، لا تفوت الفرصة
              </p>
            </div>
          </div>

          <div className='hidden sm:flex items-center gap-2 self-end sm:self-auto'>
            <button
              onClick={() => scrollContainer(flashScrollRef, 'left')}
              className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-red-500 flex items-center justify-center transition shadow-md'
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollContainer(flashScrollRef, 'right')}
              className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-red-500 flex items-center justify-center transition shadow-md'
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={flashScrollRef}
          dir='rtl'
          className='flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FLASH_DEALS.map((item) => {
            const isWish = wishlist[item.id];
            const isAdded = cartAdded[item.id];
            return (
              <div
                key={item.id}
                className='w-[270px] sm:w-[290px] shrink-0 bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between group'
              >
                <div className='relative aspect-square bg-slate-900 border-b border-slate-800 overflow-hidden'>
                  <img
                    src={item.image}
                    alt={item.name}
                    className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
                  />
                  <button
                    onClick={(e) => toggleWishlist(item.id, e)}
                    className={`absolute top-3 left-3 p-2.5 rounded-xl backdrop-blur-md border transition z-10 ${
                      isWish
                        ? 'bg-rose-950/90 text-rose-500 border-rose-500/40'
                        : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Heart
                      size={16}
                      className={isWish ? 'fill-rose-500' : ''}
                    />
                  </button>
                  <span className='absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md'>
                    عرض لفترة محدودة جداً
                  </span>
                  {item.discountPercentage && (
                    <span className='absolute bottom-3 left-3 bg-amber-500/90 text-black font-black text-[10px] px-2 py-0.5 rounded-md'>
                      خصم %{item.discountPercentage}-
                    </span>
                  )}
                </div>

                <div className='p-4 space-y-3 flex-1 flex flex-col justify-between'>
                  <div className='space-y-1.5'>
                    <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                      {item.category}
                    </span>
                    <h3 className='font-bold text-sm text-slate-100 line-clamp-1'>
                      {item.name}
                    </h3>
                    <div className='flex items-center gap-2.5 pt-1'>
                      <span className='text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300'>
                        {item.price.toLocaleString()}{' '}
                        <span className='text-[11px] text-slate-400 font-normal'>
                          ج.م
                        </span>
                      </span>
                      {item.originalPrice && (
                        <span className='text-xs text-slate-500 line-through font-semibold'>
                          {item.originalPrice.toLocaleString()} ج.م
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(item.id, e)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-95 text-white'
                    }`}
                  >
                    {isAdded ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <ShoppingCart size={15} />
                    )}
                    <span>
                      {isAdded ? 'تمت الإضافة بنجاح' : 'أضف إلى السلة'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DUAL LARGE CATALOG SLIDERS (Hot & Cyber)                */}
      {/* ========================================================= */}
      <section className='max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-20'>
        {/* Slider 1: Hot Trend (Red/Rose Theme) */}
        <div className='space-y-6'>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div className='flex items-start gap-3.5 text-left'>
              <div className='p-2.5 bg-red-950/60 border border-red-500/30 rounded-2xl text-red-500 mt-1 shrink-0'>
                <Flame size={22} className='text-red-400 animate-pulse' />
              </div>
              <div className='space-y-1'>
                <h2 className='text-2xl font-black text-white tracking-tight'>
                  Hot Trend Collection
                </h2>
                <p className='text-xs text-slate-400'>
                  تشكيلة المنتجات الأكثر طلباً واشتعالاً في المتجر هذا الأسبوع
                </p>
              </div>
            </div>

            <div className='hidden sm:flex items-center gap-2 self-end sm:self-auto'>
              <button
                onClick={() => scrollContainer(slider1Ref, 'left')}
                className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-red-500 flex items-center justify-center transition shadow-md'
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollContainer(slider1Ref, 'right')}
                className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-red-500 flex items-center justify-center transition shadow-md'
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={slider1Ref}
            dir='rtl'
            className='flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FLASH_DEALS.map((product) => {
              const isWish = wishlist[product.id];
              const isAdded = cartAdded[product.id];
              return (
                <div
                  key={`s1-${product.id}`}
                  className='w-[300px] sm:w-[330px] shrink-0 bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden hover:border-red-500/40 transition flex flex-col justify-between group'
                >
                  <div>
                    <div className='w-full aspect-square bg-slate-900 relative overflow-hidden border-b border-slate-800'>
                      <img
                        src={product.image}
                        alt={product.name}
                        className='w-full h-full object-cover group-hover:scale-108 transition duration-700'
                      />
                      <span className='absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-md'>
                        عرض حصري
                      </span>
                      <button
                        onClick={(e) => toggleWishlist(product.id, e)}
                        className={`absolute top-3 left-3 p-3 rounded-xl backdrop-blur-md border transition z-10 ${
                          isWish
                            ? 'bg-rose-950/90 text-rose-500 border-rose-500/40'
                            : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        <Heart
                          size={18}
                          className={isWish ? 'fill-rose-500' : ''}
                        />
                      </button>
                    </div>

                    <div className='p-6 space-y-3'>
                      <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>
                        {product.category}
                      </span>
                      <h3 className='font-bold text-slate-100 line-clamp-1 text-base group-hover:text-red-400 transition'>
                        {product.name}
                      </h3>
                      <div className='font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300 pt-1'>
                        {product.price.toLocaleString()}{' '}
                        <span className='text-xs text-slate-400 font-normal'>
                          EGP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='p-6 pt-0'>
                    <button
                      onClick={(e) => handleAddToCart(product.id, e)}
                      className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                      <span>
                        {isAdded ? 'تمت الإضافة بنجاح' : 'Add to Cart'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slider 2: Cyber Edition (Blue/Indigo Theme) */}
        <div className='space-y-6 pt-6 border-t border-slate-800/80'>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div className='flex items-start gap-3.5 text-left'>
              <div className='p-2.5 bg-blue-950/60 border border-blue-500/30 rounded-2xl text-blue-400 mt-1 shrink-0'>
                <Sparkles size={22} className='text-blue-400 animate-pulse' />
              </div>
              <div className='space-y-1'>
                <h2 className='text-2xl font-black text-white tracking-tight'>
                  Cyber Edition Catalog
                </h2>
                <p className='text-xs text-slate-400'>
                  أحدث إصدارات الأجهزة الذكية وملحقات الألعاب الفائقة
                </p>
              </div>
            </div>

            <div className='hidden sm:flex items-center gap-2 self-end sm:self-auto'>
              <button
                onClick={() => scrollContainer(slider2Ref, 'left')}
                className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500 flex items-center justify-center transition shadow-md'
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollContainer(slider2Ref, 'right')}
                className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500 flex items-center justify-center transition shadow-md'
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={slider2Ref}
            dir='rtl'
            className='flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FLASH_DEALS.map((product) => {
              const isWish = wishlist[product.id];
              const isAdded = cartAdded[product.id];
              return (
                <div
                  key={`s2-${product.id}`}
                  className='w-[300px] sm:w-[330px] shrink-0 bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden hover:border-blue-500/40 transition flex flex-col justify-between group'
                >
                  <div>
                    <div className='w-full aspect-square bg-slate-900 relative overflow-hidden border-b border-slate-800'>
                      <img
                        src={product.image}
                        alt={product.name}
                        className='w-full h-full object-cover group-hover:scale-108 transition duration-700'
                      />
                      <span className='absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-md'>
                        إصدار مميز
                      </span>
                      <button
                        onClick={(e) => toggleWishlist(product.id, e)}
                        className={`absolute top-3 left-3 p-3 rounded-xl backdrop-blur-md border transition z-10 ${
                          isWish
                            ? 'bg-rose-950/90 text-rose-500 border-rose-500/40'
                            : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        <Heart
                          size={18}
                          className={isWish ? 'fill-rose-500' : ''}
                        />
                      </button>
                    </div>

                    <div className='p-6 space-y-3'>
                      <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>
                        {product.category}
                      </span>
                      <h3 className='font-bold text-slate-100 line-clamp-1 text-base group-hover:text-blue-400 transition'>
                        {product.name}
                      </h3>
                      <div className='font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 pt-1'>
                        {product.price.toLocaleString()}{' '}
                        <span className='text-xs text-slate-400 font-normal'>
                          EGP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='p-6 pt-0'>
                    <button
                      onClick={(e) => handleAddToCart(product.id, e)}
                      className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                      <span>
                        {isAdded ? 'تمت الإضافة بنجاح' : 'Add to Cart'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
