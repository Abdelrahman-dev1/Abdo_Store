'use client';

import React, { useRef } from 'react';
import {
  Sparkles,
  Heart,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Star,
} from 'lucide-react';
import { FlashDealSection } from './FlashDealsSlider'; // (يمكنك استيراد أو إعادة استخدام نفس الـ Interface)

interface FeaturedProductsProps {
  products?: FlashDealSection[];
  wishlist?: (string | number)[];
  toggleWishlist: (item: FlashDealSection) => void;
  addToCart: (e: React.MouseEvent, item: FlashDealSection) => void;
}

const DEFAULT_PRODUCTS: FlashDealSection[] = [
  {
    id: 101,
    name: 'تجميعه الألعاب الاحترافية - Cyber Edition',
    category: 'PC Systems',
    image:
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=600&auto=format&fit=crop',
    price: 33750,
    originalPrice: 45000,
    discountPercentage: 25,
  },
  {
    id: 102,
    name: 'شاشة ألعاب احترافية 240Hz منحنية',
    category: 'Displays',
    image:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop',
    price: 12500,
    originalPrice: 15999,
    discountPercentage: 22,
  },
  {
    id: 103,
    name: 'سماعات رأس لاسلكية بنقاء صوتي فائق',
    category: 'Audio',
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop',
    price: 1920,
    originalPrice: 3200,
    discountPercentage: 40,
  },
  {
    id: 104,
    name: 'لوحة مفاتيح ميكانيكية بإضاءة RGB مخصصة',
    category: 'Keyboards',
    image:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
    price: 1960,
    originalPrice: 2800,
    discountPercentage: 30,
  },
  {
    id: 105,
    name: 'ماوس ألعاب سلكي فائق السرعة والخفة',
    category: 'Mice',
    image:
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop',
    price: 950,
    originalPrice: 1500,
    discountPercentage: 35,
  },
];

export default function FeaturedProductsSlider({
  products = DEFAULT_PRODUCTS,
  wishlist = [],
  toggleWishlist,
  addToCart,
}: FeaturedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Manual smooth scroll handlers (Right & Left)
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left:
          direction === 'left'
            ? scrollLeft - scrollAmount
            : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className='max-w-7xl mx-auto px-4 sm:px-6 py-12 border-b border-slate-800/80'>
      {/* Section Header: Left aligned English title & Arabic description */}
      <div className='flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4'>
        <div className='flex items-start gap-3.5 text-left'>
          <div className='p-2.5 bg-blue-950/60 border border-blue-500/30 rounded-xl text-blue-400 mt-1 shrink-0'>
            <Star
              size={22}
              className='text-blue-500 fill-blue-500 animate-pulse drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]'
            />
          </div>
          <div className='space-y-1'>
            <h2 className='text-2xl font-black text-white tracking-tight'>
              Featured Products
            </h2>
            <p className='text-xs text-slate-400'>
              تشكيلة مختارة بعناية لأفضل المنتجات والأجهزة الحصرية لتلبية
              احتياجاتك
            </p>
          </div>
        </div>

        {/* Scroll Manual Control Arrows */}
        <div className='hidden sm:flex items-center gap-2 self-end sm:self-auto'>
          <button
            onClick={() => scroll('left')}
            className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/50 flex items-center justify-center transition shadow-md'
            aria-label='السابق'
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => scroll('right')}
            className='w-10 h-10 rounded-xl bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/50 flex items-center justify-center transition shadow-md'
            aria-label='التالي'
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Infinite/Smooth Auto-scrolling & Manual Container */}
      <div className='relative group/slider'>
        <div
          ref={scrollRef}
          dir='rtl'
          className='flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((item) => {
            const displayImage = item.image || item.images?.[0];
            const isWish = wishlist.includes(item.id);

            return (
              <div
                key={item.id}
                className='w-[260px] sm:w-[280px] shrink-0 bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition duration-300 flex flex-col justify-between group'
              >
                {/* Product Image & Badges */}
                <div className='relative aspect-square bg-slate-900 border-b border-slate-800 overflow-hidden'>
                  <img
                    src={displayImage || 'https://via.placeholder.com/300'}
                    alt={item.name}
                    className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
                  />

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={() => toggleWishlist(item)}
                    className={`absolute top-3 left-3 p-2.5 rounded-xl backdrop-blur-md border transition z-10 ${
                      isWish
                        ? 'bg-rose-950/90 text-rose-500 border-rose-500/40 shadow-lg shadow-rose-950/50'
                        : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title='إضافة للمفضلة'
                  >
                    <Heart
                      size={16}
                      className={isWish ? 'fill-rose-500' : ''}
                    />
                  </button>

                  {/* Limited Time Offer Badge */}
                  <span className='absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider'>
                    عرض لفترة محدودة جداً
                  </span>

                  {/* Discount percentage tag */}
                  {item.discountPercentage && (
                    <span className='absolute bottom-3 left-3 bg-amber-500/90 text-black font-black text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm'>
                      خصم %{item.discountPercentage}-
                    </span>
                  )}
                </div>

                {/* Product Details */}
                <div className='p-4 space-y-3 flex-1 flex flex-col justify-between'>
                  <div className='space-y-1.5'>
                    <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                      {item.category || 'Featured'}
                    </span>
                    <h3 className='font-bold text-sm text-slate-100 line-clamp-1 leading-snug'>
                      {item.name}
                    </h3>

                    {/* Pricing (Current & Original) */}
                    <div className='flex items-center gap-2.5 pt-1'>
                      <span className='text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300'>
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

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => addToCart(e, item)}
                    className='w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-950/20 cursor-pointer active:scale-95'
                  >
                    <ShoppingCart size={15} />
                    <span>أضف إلى السلة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
