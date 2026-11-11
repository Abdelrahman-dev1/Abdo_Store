'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Settings,
  Plus,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';

// 1. Types for Admin Customization
export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  discountPercentage: number;
  originalPrice?: number;
  discountedPrice?: number;
  rating?: number;
  imageUrl: string;
}

interface HeroSectionProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
}

// Default dynamic slides (Admin initial state)
const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: '1',
    title: 'تجميعه الألعاب الاحترافية - Cyber Edition',
    subtitle: 'أعلى أداء للجيمرز وصناع المحتوى مع ضمان واستبدال فوري',
    badge: 'عرض لفترة محدودة جداً',
    discountPercentage: 25,
    originalPrice: 45000,
    discountedPrice: 33750,
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'سماعات الألعاب المحيطية Wireless Pro',
    subtitle: 'عزل صوتي تام مع مايكروفون كريستالي ونقاء استثنائي',
    badge: 'عرض لفترة محدودة جداً',
    discountPercentage: 40,
    originalPrice: 3200,
    discountedPrice: 1920,
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'ماوس وكيبورد ميكانيكي RGB Ultra-Fast',
    subtitle:
      'سرعة استجابة متناهية في الأجزاء من الثانية لمنافسات الـ E-Sports',
    badge: 'عرض لفترة محدودة جداً',
    discountPercentage: 30,
    originalPrice: 2800,
    discountedPrice: 1960,
    rating: 5.0,
    imageUrl:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=1200&auto=format&fit=crop',
  },
];

const TOP_ANNOUNCEMENTS = [
  'اطمئن.. هنا هتلاقي كل احتياجاتك بأقل سعر وأعلى جودة ✨',
  'شحن سريع لجميع المحافظات + ضمان استرجاع 14 يوم 🚀',
  'خصومات حصرية لفترة محدودة تصل إلى 50% على المنتجات الأكثر طلباً 💥',
];

export default function HeroSection({
  slides: initialSlides = DEFAULT_SLIDES,
  autoPlayInterval = 5000,
}: HeroSectionProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  // Wishlist & Cart state toggles for feedback animation
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});
  const [cartAdded, setCartAdded] = useState<Record<string, boolean>>({});

  // Admin Modal state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newSlide, setNewSlide] = useState<Omit<HeroSlide, 'id'>>({
    title: '',
    subtitle: '',
    badge: 'عرض لفترة محدودة جداً',
    discountPercentage: 20,
    originalPrice: 1000,
    discountedPrice: 800,
    rating: 5,
    imageUrl: '',
  });

  // Top Rotating Announcement Header
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % TOP_ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Carousel Auto Play Handler
  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isHovered, slides.length, autoPlayInterval, nextSlide]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlisted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartAdded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentSlide = slides[currentIndex] || slides[0];

  // Admin Actions
  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.title || !newSlide.imageUrl) return;
    const created: HeroSlide = {
      ...newSlide,
      id: Date.now().toString(),
    };
    setSlides((prev) => [...prev, created]);
    setNewSlide({
      title: '',
      subtitle: '',
      badge: 'عرض لفترة محدودة جداً',
      discountPercentage: 20,
      originalPrice: 1000,
      discountedPrice: 800,
      rating: 5,
      imageUrl: '',
    });
  };

  const handleDeleteSlide = (id: string) => {
    const filtered = slides.filter((s) => s.id !== id);
    setSlides(filtered);
    if (currentIndex >= filtered.length) {
      setCurrentIndex(Math.max(0, filtered.length - 1));
    }
  };

  return (
    <header
      dir='rtl'
      className='relative bg-[#090d16] border-b border-slate-800/80 pt-10 pb-14 px-4 sm:px-6 overflow-hidden select-none font-sans'
    >
      {/* Dynamic Background Glow Effects */}
      <div className='absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none' />
      <div className='absolute bottom-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none' />




      <div className='max-w-6xl mx-auto space-y-8 relative z-10'>
        {/* 1. Rotating Animated Dynamic Tagline */}
        <div className='flex justify-center'>
          <div className='h-9 flex items-center px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-medium shadow-xl backdrop-blur-md overflow-hidden'>
            <Zap className='w-4 h-4 text-yellow-400 shrink-0 ml-2 animate-pulse' />
            <AnimatePresence mode='wait'>
              <motion.span
                key={announcementIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className='inline-block text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-rose-200 to-slate-300 font-bold'
              >
                {TOP_ANNOUNCEMENTS[announcementIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* 2. Main Hero Dynamic Slider Card */}
        {slides.length > 0 && (
          <div
            className='relative w-full rounded-3xl overflow-hidden border border-slate-800/90 bg-[#0e1626]/80 shadow-2xl shadow-black/60 group'
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Slide Active Image + Motion Wrapper */}
            <div className='relative h-[380px] sm:h-[460px] md:h-[520px] w-full overflow-hidden'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className='absolute inset-0'
                >
                  {/* Background Image with Ambient Gradient Overlay */}
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title}
                    className='w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/60 to-black/30' />
                  <div className='absolute inset-0 bg-gradient-to-r from-[#090d16]/90 via-transparent to-[#090d16]/40' />
                </motion.div>
              </AnimatePresence>

              {/* Top Overlays: Badges & Action Buttons */}
              <div className='absolute top-4 sm:top-6 right-4 sm:right-6 left-4 sm:left-6 flex items-center justify-between z-20 pointer-events-none'>
                {/* Right Badges */}
                <div className='flex items-center gap-2 flex-wrap pointer-events-auto'>
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black shadow-lg shadow-red-950/50 animate-bounce-slow'>
                    <Clock size={14} />
                    {currentSlide.badge}
                  </span>
                  {currentSlide.discountPercentage > 0 && (
                    <span className='px-3 py-1.5 rounded-xl bg-amber-500/90 border border-amber-300/40 text-black text-xs font-extrabold shadow-md backdrop-blur-md'>
                      خصم %{currentSlide.discountPercentage}-
                    </span>
                  )}
                </div>

                {/* Left Action Buttons (Wishlist & Cart) */}
                <div className='flex items-center gap-2 pointer-events-auto'>
                  {/* Wishlist Heart Icon */}
                  <button
                    onClick={(e) => toggleWishlist(currentSlide.id, e)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-xl backdrop-blur-md active:scale-90 ${
                      wishlisted[currentSlide.id]
                        ? 'bg-rose-600 border-rose-500 text-white scale-110'
                        : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-rose-400 hover:border-rose-500/50'
                    }`}
                    title='إضافة للمفضلة'
                  >
                    <Heart
                      size={18}
                      className={
                        wishlisted[currentSlide.id] ? 'fill-current' : ''
                      }
                    />
                  </button>

                  {/* Cart Icon */}
                  <button
                    onClick={(e) => toggleCart(currentSlide.id, e)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-xl backdrop-blur-md active:scale-90 ${
                      cartAdded[currentSlide.id]
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50'
                    }`}
                    title='إضافة إلى السلة'
                  >
                    {cartAdded[currentSlide.id] ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <ShoppingCart size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Details Content Overlay */}
              <div className='absolute bottom-0 right-0 left-0 p-6 sm:p-10 z-20 flex flex-col justify-end'>
                <div className='max-w-2xl space-y-3'>
                  {/* Rating display */}
                  {currentSlide.rating && (
                    <div className='flex items-center gap-1 text-amber-400 text-xs font-bold'>
                      <Star size={14} className='fill-amber-400' />
                      <span>{currentSlide.rating}</span>
                      <span className='text-slate-400 font-normal mr-1'>
                        (تقييمات المستخدمين)
                      </span>
                    </div>
                  )}

                  <h2 className='text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md'>
                    {currentSlide.title}
                  </h2>

                  <p className='text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed max-w-xl'>
                    {currentSlide.subtitle}
                  </p>

                  {/* Pricing Display */}
                  <div className='flex items-center gap-3 pt-2'>
                    {currentSlide.discountedPrice && (
                      <span className='text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300'>
                        {currentSlide.discountedPrice.toLocaleString()} ج.م
                      </span>
                    )}
                    {currentSlide.originalPrice && (
                      <span className='text-sm sm:text-base text-slate-500 line-through font-semibold'>
                        {currentSlide.originalPrice.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Slider Navigation Arrows */}
              <button
                onClick={prevSlide}
                className='absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/70 border border-slate-700/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:border-red-500 transition-all duration-300 shadow-xl backdrop-blur-sm'
                aria-label='السابق'
              >
                <ChevronRight size={22} />
              </button>
              <button
                onClick={nextSlide}
                className='absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/70 border border-slate-700/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 shadow-xl backdrop-blur-sm'
                aria-label='التالي'
              >
                <ChevronLeft size={22} />
              </button>

              {/* Slide Progress Indicator Bar */}
              <div className='absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 z-30'>
                {!isHovered && (
                  <motion.div
                    key={currentIndex}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: autoPlayInterval / 1000,
                      ease: 'linear',
                    }}
                    className='h-full bg-gradient-to-r from-red-500 via-rose-500 to-blue-500'
                  />
                )}
              </div>
            </div>

            {/* Slider Dots/Pagination */}
            <div className='bg-[#0e1626] py-3 border-t border-slate-800/80 flex items-center justify-center gap-2'>
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-8 bg-gradient-to-r from-red-500 to-rose-500'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`الانتقال للسلايد ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. Reusable Feature Highlights Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/60'>
          <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition duration-300'>
            <div className='w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0'>
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

          <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition duration-300'>
            <div className='w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0'>
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

          <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800/80 hover:border-rose-500/40 transition duration-300'>
            <div className='w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0'>
              <Headphones size={20} />
            </div>
            <div>
              <h4 className='text-xs font-bold text-white'>
                دعم فني متواصل 24/7
              </h4>
              <p className='text-[11px] text-slate-400'>
                فريق متواجد دائماً لخدمتك وإجابة استفساراتك
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Admin Drawer/Modal (Dynamic Slide Manager) */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4'
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className='bg-[#0e1626] border border-slate-700 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white shadow-2xl space-y-6'
            >
              <div className='flex items-center justify-between border-b border-slate-800 pb-4'>
                <div className='flex items-center gap-2'>
                  <Settings className='text-rose-500' size={20} />
                  <h3 className='text-lg font-bold'>
                    لوحة التحكم - إدارة صور السلايدر
                  </h3>
                </div>
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className='p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition'
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form to Add New Slide */}
              <form onSubmit={handleAddSlide} className='space-y-4'>
                <h4 className='text-xs font-bold text-rose-400 uppercase tracking-wider'>
                  إضافة سلايد جديد
                </h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <input
                    type='text'
                    placeholder='عنوان العرض (مثلاً: تجميعه ألعاب)'
                    value={newSlide.title}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, title: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500'
                    required
                  />
                  <input
                    type='text'
                    placeholder='رابط الصورة (Image URL)'
                    value={newSlide.imageUrl}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, imageUrl: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500'
                    required
                  />
                  <input
                    type='text'
                    placeholder='الوصف المختصر'
                    value={newSlide.subtitle}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, subtitle: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500'
                  />
                  <input
                    type='text'
                    placeholder='الشارة (مثلاً: عرض لفترة محدودة)'
                    value={newSlide.badge}
                    onChange={(e) =>
                      setNewSlide({ ...newSlide, badge: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500'
                  />
                  <input
                    type='number'
                    placeholder='السعر قبل الخصم'
                    value={newSlide.originalPrice || ''}
                    onChange={(e) =>
                      setNewSlide({
                        ...newSlide,
                        originalPrice: Number(e.target.value),
                      })
                    }
                    className='w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500'
                  />
                  <input
                    type='number'
                    placeholder='السعر بعد الخصم'
                    value={newSlide.discountedPrice || ''}
                    onChange={(e) =>
                      setNewSlide({
                        ...newSlide,
                        discountedPrice: Number(e.target.value),
                      })
                    }
                    className='w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500'
                  />
                </div>
                <button
                  type='submit'
                  className='w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg'
                >
                  <Plus size={16} />
                  <span>إضافة السلايد للمعرض</span>
                </button>
              </form>

              {/* Current Slides List */}
              <div className='space-y-3 pt-4 border-t border-slate-800'>
                <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                  السلايدات الحالية ({slides.length})
                </h4>
                <div className='space-y-2 max-h-48 overflow-y-auto pr-1'>
                  {slides.map((s, i) => (
                    <div
                      key={s.id}
                      className='flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs'
                    >
                      <div className='flex items-center gap-3 overflow-hidden'>
                        <img
                          src={s.imageUrl}
                          alt={s.title}
                          className='w-10 h-10 rounded-lg object-cover shrink-0'
                        />
                        <div className='truncate'>
                          <p className='font-bold text-white truncate'>
                            {i + 1}. {s.title}
                          </p>
                          <p className='text-[10px] text-slate-400 truncate'>
                            {s.badge}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSlide(s.id)}
                        className='p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition shrink-0'
                        title='حذف'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
