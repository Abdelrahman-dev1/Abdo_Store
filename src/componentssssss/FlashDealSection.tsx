'use client';

import React, { useRef } from 'react';
import {
  Flame,
  Heart,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export interface FlashDealSection {
  id: string | number;
  name: string;
  category?: string;
  image?: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
}

interface FlashDealsProps {
  flashDeals?: FlashDealSection[];
  wishlist?: (string | number)[];
  toggleWishlist: (item: FlashDealSection) => void;
  addToCart: (e: React.MouseEvent, item: FlashDealSection) => void;
}

const DEFAULT_DEALS: FlashDealSection[] = [
  {
    id: 1,
    name: 'سماعات ألعاب لاسلكية بروفيشنال RGB',
    category: 'إكسسوارات ألعاب',
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop',
    price: 1920,
    originalPrice: 3200,
    discountPercentage: 40,
  },
  {
    id: 2,
    name: 'كيبورد ميكانيكي مخصص للمحترفين',
    category: 'لوحات مفاتيح',
    image:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
    price: 1960,
    originalPrice: 2800,
    discountPercentage: 30,
  },
  {
    id: 3,
    name: 'ماوس الألعاب الخارق بمستشعر ضوئي دقيق',
    category: 'ملحقات PC',
    image:
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop',
    price: 950,
    originalPrice: 1500,
    discountPercentage: 35,
  },
  {
    id: 4,
    name: 'قاعدة شحن مزدوجة سريعة للوحدات',
    category: 'قواعد شحن',
    image:
      'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?q=80&w=600&auto=format&fit=crop',
    price: 680,
    originalPrice: 1200,
    discountPercentage: 43,
  },
  {
    id: 5,
    name: 'شاشة ألعاب منحنية 27 بوصة 165Hz',
    category: 'شاشات عرض',
    image:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop',
    price: 7499,
    originalPrice: 9999,
    discountPercentage: 25,
  },
];

export default function FlashDealsSlider({
  flashDeals = DEFAULT_DEALS,
  wishlist = [],
  toggleWishlist,
  addToCart,
}: FlashDealsProps) {
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

  if (!flashDeals || flashDeals.length === 0) return null;

  return (
    <section
      dir=''
      className='max-w-7xl mx-auto px-4 sm:px-6 py-12 border-b border-slate-800/80'
    >
      {/* Section Header: Left aligned English title & Arabic description */}
      <div className='flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4'>
        <div className='flex items-start gap-3.5 text-left'>
          <div className='p-2.5 bg-blue-950/60 border border-blue-500/30 rounded-xl text-blue-400 mt-1 shrink-0'>
            <Flame
              size={22}
              className='text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            />
          </div>
          <div className='space-y-1'>
            <h2 className='text-2xl font-black text-white tracking-tight'>
              Flash Deals
            </h2>
            <p className='text-xs text-slate-400'>
              تخفيضات لفترة محدوده جدا 🔥🔥
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
          className='flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-1'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {flashDeals.map((item) => {
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
                  <span className='absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider'>
                    عرض لفترة محدودة جداً
                  </span>

                  {/* Discount percentage tag if available */}
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
                      {item.category || 'عروض مميزة'}
                    </span>
                    <h3 className='font-bold text-sm text-slate-100 line-clamp-1 leading-snug'>
                      {item.name}
                    </h3>

                    {/* Pricing (Current & Original) */}
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

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => addToCart(e, item)}
                    className='w-full py-3 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-red-950/20 cursor-pointer active:scale-95'
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
