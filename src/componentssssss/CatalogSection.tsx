import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Star,
  Heart,
  Eye,
  ArrowLeft,
  Flame,
  ShieldCheck,
  Zap,
  Check,
  SlidersHorizontal,
  X,
  Share2,
} from 'lucide-react';

// المنتجات الافتراضية بدقة عالي وصور ممتازة من Unsplash
const INITIAL_PRODUCTS = [
  {
    id: 1,
    title: 'ساعة الكرونوغراف الفاخرة',
    category: 'إكسسوارات',
    price: 899,
    originalPrice: 1200,
    rating: 4.9,
    reviewsCount: 128,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    badge: 'الأكثر مبيعاً',
    badgeColor: 'from-amber-500 to-orange-600',
    isNew: true,
    inStock: true,
  },
  {
    id: 2,
    title: 'سماعات Pro اللاسلكية الذكية',
    category: 'إلكترونيات',
    price: 450,
    originalPrice: 599,
    rating: 4.8,
    reviewsCount: 95,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    badge: 'خصم 25%',
    badgeColor: 'from-emerald-500 to-teal-600',
    isNew: false,
    inStock: true,
  },
  {
    id: 3,
    title: 'نظارة شمسية كلاسيكية قطبية',
    category: 'موضة',
    price: 299,
    originalPrice: 380,
    rating: 4.7,
    reviewsCount: 64,
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
    badge: 'حصرية',
    badgeColor: 'from-purple-500 to-indigo-600',
    isNew: true,
    inStock: true,
  },
  {
    id: 4,
    title: 'حذاء رياضي متطور UltraBoost',
    category: 'رياضة',
    price: 620,
    originalPrice: 750,
    rating: 5.0,
    reviewsCount: 210,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    badge: 'تريند',
    badgeColor: 'from-pink-500 to-rose-600',
    isNew: false,
    inStock: true,
  },
  {
    id: 5,
    title: 'حقيبة جلدية مصنوعة يدوياً',
    category: 'موضة',
    price: 540,
    originalPrice: 680,
    rating: 4.9,
    reviewsCount: 88,
    image:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800',
    badge: 'اصدار محدود',
    badgeColor: 'from-blue-600 to-cyan-500',
    isNew: true,
    inStock: true,
  },
  {
    id: 6,
    title: 'مكبر صوت بلوتوث محمول Premium',
    category: 'إلكترونيات',
    price: 380,
    originalPrice: 450,
    rating: 4.6,
    reviewsCount: 142,
    image:
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800',
    badge: 'صفقة اليوم',
    badgeColor: 'from-red-500 to-amber-600',
    isNew: false,
    inStock: true,
  },
  {
    id: 7,
    title: 'زجاجة عطر سحرية فاخرة',
    category: 'عطور',
    price: 730,
    originalPrice: 900,
    rating: 4.9,
    reviewsCount: 310,
    image:
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800',
    badge: 'الأعلى تقييماً',
    badgeColor: 'from-violet-600 to-fuchsia-600',
    isNew: true,
    inStock: true,
  },
  {
    id: 8,
    title: 'كاميرا كلاسيكية احترافية',
    category: 'إلكترونيات',
    price: 1450,
    originalPrice: 1700,
    rating: 5.0,
    reviewsCount: 77,
    image:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800',
    badge: 'خصم مميز',
    badgeColor: 'from-cyan-500 to-blue-600',
    isNew: false,
    inStock: false,
  },
];

const CATEGORIES = ['الكل', 'إلكترونيات', 'موضة', 'إكسسوارات', 'رياضة', 'عطور'];

export default function CatalogSection() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(40); // سرعة الحركة التلقائية بالثواني (كلما زاد الرقم زادت النعومة والبطء)
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // للمودال التفاعلي
  const [toastMessage, setToastMessage] = useState('');

  const sliderRef = useRef(null);

  // تصفية المنتجات حسب القسم المختص
  const filteredProducts =
    selectedCategory === 'الكل'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // مضاعفة العناصر لإنشاء شريط تكراري لا نهائي وبدون توقف (Continuous Infinite Loop)
  const infiniteProducts = [
    ...filteredProducts,
    ...filteredProducts,
    ...filteredProducts,
  ];

  // إشعار بسيط
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // التحكم في المفضلة
  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id));
      showToast('تمت إزالة المنتج من المفضلة');
    } else {
      setFavorites([...favorites, id]);
      showToast('تمت إضافة المنتج إلى المفضلة ❤️');
    }
  };

  // التحكم في السلة
  const addToCart = (product, e) => {
    e.stopPropagation();
    setCart([...cart, product]);
    showToast(`تمت إضافة "${product.title}" إلى السلة 🛒`);
  };

  // التمرير يدويًا
  const scrollManual = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 340;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      dir='rtl'
      className='min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black py-16 px-4 relative overflow-hidden'
    >
      {/* خلفيات وعناصر ديكور ضوئية (Glow Background Blobs) */}
      <div className='absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none' />
      <div className='absolute bottom-10 left-1/4 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-blue-600/5 rounded-full blur-[180px] pointer-events-none' />

      {/* أنماط CSS المخصصة للـ Custom Smooth Scroll & Infinite Animation */}
      <style>{`
        @keyframes marqueeSlow {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(33.333%);
          }
        }

        .animate-marquee-slow {
          display: flex;
          width: max-content;
          animation: marqueeSlow ${speed}s linear infinite;
        }

        .animate-marquee-slow:hover {
          animation-play-state: ${isPaused ? 'paused' : 'running'};
        }

        /* اخفاء شريط التمرير */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* تأثيرات لمعان Glassmorphic */
        .glass-card {
          background: rgba(18, 24, 38, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .glass-card:hover {
          border-color: rgba(6, 182, 212, 0.4);
          box-shadow: 0 12px 40px -10px rgba(6, 182, 212, 0.25);
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        .shimmer-effect::after {
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.05) 20%,
            rgba(255, 255, 255, 0.15) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: shimmer 3s infinite;
          content: '';
        }
      `}</style>

      {/* إشعار التوست (Toast Notification) */}
      {toastMessage && (
        <div className='fixed bottom-6 left-6 z-50 bg-cyan-500 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-2xl shadow-cyan-500/40 flex items-center gap-3 animate-bounce'>
          <Zap className='w-5 h-5 fill-current' />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className='max-w-7xl mx-auto relative z-10 space-y-10'>
        {/* Header - هيدر الكتالوج */}
        <div className='flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-8'>
          <div className='space-y-3'>
            <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide'>
              <Sparkles className='w-4 h-4 animate-spin-slow' />
              <span>كتالوج المنتجات الحصري 2026</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight'>
              استكشف مجموعتنا{' '}
              <span className='bg-clip-text text-transparent bg-gradient-to-l from-cyan-400 via-teal-300 to-purple-500'>
                الفائقة والجديدة
              </span>
            </h2>
            <p className='text-slate-400 text-sm md:text-base max-w-xl'>
              تصفح التشكيلة التفاعلية بسلاسة فائقة، انقر على أي منتج لمعاينة
              التفاصيل أو أضفه مباشرة إلى حقيبة تسوقك.
            </p>
          </div>

          {/* أزرار التمرير اليدوي والتحكم */}
          <div className='flex items-center gap-3 self-start md:self-end'>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-slate-500'
              }`}
            >
              {isPaused ? '▶ استئناف الحركة' : '⏸ إيقاف موقت'}
            </button>

            <div className='flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800'>
              <button
                onClick={() => scrollManual('right')}
                className='p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500 hover:text-black text-slate-300 transition-all duration-200 active:scale-95 shadow-md'
                title='السابق'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
              <button
                onClick={() => scrollManual('left')}
                className='p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500 hover:text-black text-slate-300 transition-all duration-200 active:scale-95 shadow-md'
                title='التالي'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
            </div>
          </div>
        </div>

        {/* أزرار التصفية حسب الأقسام (Category Pills) */}
        <div className='flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1'>
          <span className='text-xs text-slate-400 ml-2 font-medium flex items-center gap-1'>
            <SlidersHorizontal className='w-3.5 h-3.5 text-cyan-400' /> التصنيف:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 scale-105'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* منطقة السلايدر التلقائي السلس (Continuous Infinite Carousel) */}
        <div
          className='relative w-full overflow-hidden rounded-3xl py-4'
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* ظلال الفيد الجانبي لتلطيف حواف التمرير (Fade Edges) */}
          <div className='absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-[#0b0f19] to-transparent z-20 pointer-events-none' />
          <div className='absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-[#0b0f19] to-transparent z-20 pointer-events-none' />

          {/* الحاوية المتحركة */}
          <div
            ref={sliderRef}
            className='flex gap-6 overflow-x-auto no-scrollbar scroll-smooth'
            style={{ scrollBehavior: 'smooth' }}
          >
            <div
              className={`flex gap-6 ${!isPaused ? 'animate-marquee-slow' : ''}`}
            >
              {infiniteProducts.map((item, index) => {
                const isFav = favorites.includes(item.id);
                return (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => setSelectedProduct(item)}
                    className='glass-card group relative w-[280px] sm:w-[310px] flex-shrink-0 rounded-2xl p-4 transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col justify-between overflow-hidden'
                  >
                    {/* لمعان تفاعلي خلف البطاقة */}
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/10 pointer-events-none' />

                    <div>
                      {/* حاوية الصورة والبادجات */}
                      <div className='relative w-full h-48 sm:h-52 rounded-xl overflow-hidden bg-slate-900 mb-4'>
                        <img
                          src={item.image}
                          alt={item.title}
                          className='w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700 ease-out'
                          loading='lazy'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity' />

                        {/* شارة التمييز العلوية (Badge) */}
                        <div className='absolute top-3 right-3 z-10 flex flex-col gap-1 items-start'>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${item.badgeColor} shadow-md`}
                          >
                            {item.badge}
                          </span>
                        </div>

                        {/* زر المفضلة والمعاينة السريعة */}
                        <div className='absolute top-3 left-3 z-10 flex flex-col gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0'>
                          <button
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${
                              isFav
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-900/80 text-slate-300 hover:bg-rose-500 hover:text-white'
                            }`}
                            title='حفظ في المفضلة'
                          >
                            <Heart
                              className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`}
                            />
                          </button>
                        </div>

                        {/* التقييم الأسفل */}
                        <div className='absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-xs text-amber-400'>
                          <Star className='w-3.5 h-3.5 fill-amber-400' />
                          <span className='font-bold text-slate-100'>
                            {item.rating}
                          </span>
                          <span className='text-[10px] text-slate-400'>
                            ({item.reviewsCount})
                          </span>
                        </div>
                      </div>

                      {/* معلومات المنتج */}
                      <div className='space-y-2'>
                        <span className='text-[11px] font-semibold text-cyan-400 uppercase tracking-wider'>
                          {item.category}
                        </span>
                        <h3 className='text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1'>
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {/* السعر وخيارات الشراء */}
                    <div className='pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between'>
                      <div>
                        <div className='flex items-baseline gap-2'>
                          <span className='text-lg font-extrabold text-slate-100'>
                            {item.price}{' '}
                            <span className='text-xs text-cyan-400 font-normal'>
                              ر.س
                            </span>
                          </span>
                          {item.originalPrice && (
                            <span className='text-xs text-slate-500 line-through'>
                              {item.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => addToCart(item, e)}
                        className='p-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 transition-all duration-300 flex items-center justify-center group/btn shadow-md active:scale-90'
                        title='إضافة للسلة'
                      >
                        <ShoppingBag className='w-4 h-4 transform group-hover/btn:scale-110 transition-transform' />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* مميزات إضافية أسفل الكتالوج (Trust Badges) */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-6'>
          <div className='p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400'>
              <Zap className='w-5 h-5' />
            </div>
            <div>
              <h4 className='text-xs font-bold text-slate-200'>
                شحن سريع ومجاني
              </h4>
              <p className='text-[11px] text-slate-400'>للطلبات فوق 300 ريال</p>
            </div>
          </div>

          <div className='p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-purple-500/10 text-purple-400'>
              <ShieldCheck className='w-5 h-5' />
            </div>
            <div>
              <h4 className='text-xs font-bold text-slate-200'>
                ضمان أصل الجودة
              </h4>
              <p className='text-[11px] text-slate-400'>منتجات مضمونة 100%</p>
            </div>
          </div>

          <div className='p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-amber-500/10 text-amber-400'>
              <Flame className='w-5 h-5' />
            </div>
            <div>
              <h4 className='text-xs font-bold text-slate-200'>
                عروض يومية خيالية
              </h4>
              <p className='text-[11px] text-slate-400'>تخفيضات تصل إلى 40%</p>
            </div>
          </div>

          <div className='p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400'>
              <Check className='w-5 h-5' />
            </div>
            <div>
              <h4 className='text-xs font-bold text-slate-200'>إرجاع سهـل</h4>
              <p className='text-[11px] text-slate-400'>خلال 14 يوم عمل</p>
            </div>
          </div>
        </div>
      </div>

      {/* نافذة التفاصيل السريعة (Product Quick View Modal) */}
      {selectedProduct && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in'>
          <div className='relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl'>
            {/* زر الإغلاق */}
            <button
              onClick={() => setSelectedProduct(null)}
              className='absolute top-4 left-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors'
            >
              <X className='w-5 h-5' />
            </button>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-center'>
              <div className='relative h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-950'>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className='w-full h-full object-cover'
                />
                <span
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${selectedProduct.badgeColor}`}
                >
                  {selectedProduct.badge}
                </span>
              </div>

              <div className='space-y-4'>
                <span className='text-xs text-cyan-400 font-semibold'>
                  {selectedProduct.category}
                </span>
                <h3 className='text-2xl font-bold text-white'>
                  {selectedProduct.title}
                </h3>

                <div className='flex items-center gap-2 text-amber-400 text-sm'>
                  <Star className='w-4 h-4 fill-current' />
                  <span className='font-bold'>{selectedProduct.rating}</span>
                  <span className='text-slate-400'>
                    ({selectedProduct.reviewsCount} تقييم للمنتج)
                  </span>
                </div>

                <p className='text-xs text-slate-400 leading-relaxed'>
                  هذا المنتج مصمم بعناية فائقة لضمان أعلى مستويات الأداء
                  والأناقة. خامات ممتازة وضمان كامل لراحتك.
                </p>

                <div className='flex items-baseline gap-3 pt-2'>
                  <span className='text-2xl font-black text-white'>
                    {selectedProduct.price} ر.س
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className='text-sm text-slate-500 line-through'>
                      {selectedProduct.originalPrice} ر.س
                    </span>
                  )}
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    onClick={(e) => {
                      addToCart(selectedProduct, e);
                      setSelectedProduct(null);
                    }}
                    className='flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2'
                  >
                    <ShoppingBag className='w-4 h-4' /> إضافة للسلة الآن
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                    className='p-3 rounded-xl border border-slate-700 text-slate-300 hover:text-rose-500 hover:border-rose-500 transition-colors'
                  >
                    <Heart
                      className={`w-5 h-5 ${favorites.includes(selectedProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
