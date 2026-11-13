'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from './../lib/supabase';
import {
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  Search,
  X,
  Trash2,
  Plus,
  Minus,
  User,
  ShieldAlert,
  Flame,
  Truck,
  ShieldCheck,
  Headphones,
  ArrowRight,
  Heart,
  Loader2,
  Zap,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ShareButton from '@/components/ShareButton';
export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Cart Drawer & Toast State
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Visibility States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  // References for Sliders Auto-scroll control
  const heroScrollRef = useRef(null);
  const flashScrollRef = useRef(null);
  const catalogScrollRef = useRef(null);

  // States for pause/play on each slider
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [isFlashPaused, setIsFlashPaused] = useState(false);
  const [isCatalogPaused, setIsCatalogPaused] = useState(false);

  // ==========================================
  // ==========================================
const [announcementBar, setAnnouncementBar] = useState<{
  enabled: boolean;
  text: string;
  startEmoji: string;
  endEmoji: string;
} | null>(null);
  // ==========================================
  // ==========================================
  // ==========================================
useEffect(() => {
  let active = true;

  const loadAnnouncementBar = async () => {
    const { data } = await supabase
      .from('settings')
      .select(
        'announcement_enabled, announcement_text, announcement_emoji_start, announcement_emoji_end',
      )
      .limit(1)
      .maybeSingle();

    if (!active) return;

    setAnnouncementBar({
      enabled: data?.announcement_enabled ?? true,
      text:
        data?.announcement_text ||
        'FLASH SALE: Enjoy Up To 40% OFF On Selected Cyber Tech Items! Limited Time Only.',
      startEmoji: data?.announcement_emoji_start || '💸',
      endEmoji: data?.announcement_emoji_end || '🔥',
    });
  };

  void loadAnnouncementBar();
  return () => {
    active = false;
  };
}, []);

  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // محرك الحركة المستمرة لسكشن الهيرو
  useEffect(() => {
    if (isHeroPaused) return;

    let animationFrameId: number;
    const container = heroScrollRef.current;
    if (!container) return;

    const step = () => {
      if (container && !isHeroPaused) {
        container.scrollLeft += 0.8;

        if (
          container.scrollLeft >=
          container.scrollWidth - container.clientWidth - 5
        ) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHeroPaused]); // <--- شلنا heroProducts من هنا لأنها مش متعرّفة

  // ==========================================
  // ==========================================
  // const [isCatalogPaused, setIsCatalogPaused] = useState(false);

  // محرك الحركة المستمرة والناعمة (Continuous Smooth Scroll)
  useEffect(() => {
    if (isCatalogPaused) return;

    let animationFrameId: number;
    const container = catalogScrollRef.current;
    if (!container) return;

    const step = () => {
      if (container && !isCatalogPaused) {
        container.scrollLeft += 0.8; // سرعة الحركة (كل ما تقلل الرقم تبقي أبطأ وأنعم، زوّده لو عايز تسرعها)

        // لو وصلنا للنهاية، ارجع للبداية بذكاء عشان تفضل الحركة شغالة على طول
        if (
          container.scrollLeft >=
          container.scrollWidth - container.clientWidth - 5
        ) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isCatalogPaused, filteredProducts]);

  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // محرك الحركة المستمرة لسكشن Flash Deals
  useEffect(() => {
    if (isFlashPaused) return;

    let animationFrameId: number;
    const container = flashScrollRef.current;
    if (!container) return;

    const step = () => {
      if (container && !isFlashPaused) {
        container.scrollLeft += 0.8;

        // لو وصلنا للنهاية ارجع للبداية بذكاء
        if (
          container.scrollLeft >=
          container.scrollWidth - container.clientWidth - 5
        ) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isFlashPaused]);
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================

  useEffect(() => {
    fetchProducts();
    loadCartFromStorage();
    loadWishlistFromStorage();
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  const fetchProducts = async () => {
    setLoading(true);

    // 1. جلب المنتجات النشطة فقط بدون شرط الكاتلوج الصارم مؤقتاً لكي تظهر وتراها بنفسك
    const { data: productsData, error: prodError } = await supabase
      .from('products')
      .select('*, categories(id, name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // 2. جلب جميع التصنيفات المتاحة من جدول categories
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (productsData) {
      setProducts(productsData);
      setFilteredProducts(productsData);
    }

    if (categoriesData) {
      setCategories(categoriesData);
    }

    setLoading(false);
  };
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // const fetchProducts = async () => {
  //   setLoading(true);
  //   const { data } = await supabase
  //     .from('products')
  //     .select('*')
  //     .eq('is_active', true)
  //     // .eq('show_in_catalog', true) // ⚡ هذا هو الشرط المطلوب لضمان عدم ظهور المنتج في الكاتلوج إلا إذا حددته أنت يدوياً
  //     .order('created_at', { ascending: false });

  //   if (data) {
  //     setProducts(data);
  //     setFilteredProducts(data);

  //     // Extract unique categories dynamically
  //     const uniqueCats = Array.from(
  //       new Set(data.map((p) => p.category).filter(Boolean)),
  //     ) as string[];
  //     setCategories(['All', ...uniqueCats]);
  //   }
  //   setLoading(false);
  // };

  // =============================================
  // =============================================
  // =============================================
  // =============================================
  // =============================================
  const loadCartFromStorage = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  };

  const loadWishlistFromStorage = () => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist.map((item: any) => item.id));
  };

  const saveCartToStorage = (updatedCart: any[]) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const toggleWishlist = (product: any) => {
    let savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const exists = savedWishlist.some((item: any) => item.id === product.id);

    if (exists) {
      savedWishlist = savedWishlist.filter(
        (item: any) => item.id !== product.id,
      );
      setWishlist((prev) => prev.filter((id) => id !== product.id));
      setToastMessage(`Removed "${product.name}" from wishlist`);
    } else {
      savedWishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || product.images?.[0] || '',
      });
      setWishlist((prev) => [...prev, product.id]);
      setToastMessage(`Added "${product.name}" to wishlist`);
    }
    localStorage.setItem('wishlist', JSON.stringify(savedWishlist));
    setTimeout(() => setToastMessage(null), 2000);
  };
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================

  // ⚡ الكود المسؤول عن فلترة المنتجات لحظياً عند الضغط على أي بوكس تصنيف
  useEffect(() => {
    let result = products;

    // 1. تصفية حسب البحث إن وجد
    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 2. تصفية حسب التصنيف المختار (هنا بيشغل البوكسات وتظهر منتجات التصنيف دا فقط!)
    if (
      selectedCategory &&
      selectedCategory !== 'All' &&
      selectedCategory !== 'الكل'
    ) {
      result = result.filter((p) => {
        const catObj = categories.find(
          (c) => c.name === selectedCategory || c.id === selectedCategory,
        );
        return (
          p.category_id === catObj?.id ||
          p.category === selectedCategory ||
          p.categories?.name === selectedCategory ||
          p.categories?.id === catObj?.id
        );
      });
    }

    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products, categories]);

  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // ===========================================
  // // Live Filter by Category & Search Query
  // useEffect(() => {
  //   let updated = [...products];

  //   if (selectedCategory !== 'All') {
  //     updated = updated.filter((p) => p.category === selectedCategory);
  //   }

  //   if (searchQuery.trim() !== '') {
  //     const q = searchQuery.toLowerCase();
  //     updated = updated.filter(
  //       (p) =>
  //         p.name.toLowerCase().includes(q) ||
  //         p.category?.toLowerCase().includes(q) ||
  //         p.description?.toLowerCase().includes(q),
  //     );
  //   }

  //   setFilteredProducts(updated);
  // }, [searchQuery, selectedCategory, products]);

  const addToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();

    const existingIndex = cart.findIndex((item: any) => item.id === product.id);
    const productImage = product.image || (product.images?.[0] ?? '');
    const updatedCart = [...cart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImage,
        quantity: 1,
      });
    }

    saveCartToStorage(updatedCart);
    setToastMessage(`Added "${product.name}" to your cart!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    saveCartToStorage(updated);
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    saveCartToStorage(updated);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // ----------------------------------------------------
  // ADMIN CUSTOMIZATION HOOKS / SLICE CONTROLS:
  // يمكنك لاحقاً ربط هذه المتغيرات (مثل heroProducts, flashProducts, catalogProducts)
  // بجدول في Supabase أو صفحة الـ Product Admin لتحديد تخصيص صور وعناصر كل سكشن على حدة.
  // ----------------------------------------------------
  // ========================
  // ========================
  // ========================
  // ========================

  const heroProducts = products.filter((p) => p.show_in_hero);
  const flashDeals = products.filter((p) => p.show_in_flash);

  const heroIds = new Set(heroProducts.map((p) => p.id));
  const flashIds = new Set(flashDeals.map((p) => p.id));

  // تصفية الكتالوج: يظهر لو مخصص للكاتلوج، ومش موجود كـ Hero أساسي فوق
  // تصفية الكتالوج: يظهر فوراً لو الأدمن معلّم عليه صح في الكتالوج (بغض النظر عن الهيرو أو الفلاش)
  const catalogProducts = filteredProducts.filter((p) => {
    return p.show_in_catalog === true;
  });

  // ========================
  // ========================
  // ========================
  // ========================

  // General Slider manual scroll helper
  const handleScrollManual = (ref: any, direction: string, amount = 380) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  // Hero Slider Infinite Auto-Scroll Effect (Medium Speed)
  useEffect(() => {
    const container = heroScrollRef.current;
    if (loading || heroProducts.length === 0 || isHeroPaused || !container)
      return;

    const scrollInterval = setInterval(() => {
      if (!container) return;

      const { scrollLeft, clientWidth, scrollWidth } = container;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;

      if (isAtEnd) {
        clearInterval(scrollInterval);
      } else {
        container.scrollBy({ left: 0.8, behavior: 'smooth' });
      }
    }, 60);

    return () => clearInterval(scrollInterval);
  }, [loading, heroProducts.length, isHeroPaused, heroProducts]);

  // Flash Deals Slider Auto-Scroll Effect (Slow & Smooth)
  useEffect(() => {
    const container = flashScrollRef.current;
    if (loading || flashDeals.length === 0 || isFlashPaused || !container)
      return;

    const scrollInterval = setInterval(() => {
      if (!container) return;

      const { scrollLeft, clientWidth, scrollWidth } = container;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;

      if (isAtEnd) {
        clearInterval(scrollInterval);
      } else {
        container.scrollBy({ left: 0.8, behavior: 'smooth' });
      }
    }, 60);

    return () => clearInterval(scrollInterval);
  }, [loading, flashDeals.length, isFlashPaused, flashDeals]);
  // Main Catalog Slider Auto-Scroll Effect (Ultra Smooth & Slow)

  useEffect(() => {
    const container = catalogScrollRef.current;
    if (
      loading ||
      catalogProducts.length === 0 ||
      isCatalogPaused ||
      !container
    )
      return;

    const scrollInterval = setInterval(() => {
      if (!container) return;

      const { scrollLeft, clientWidth, scrollWidth } = container;

      // بنتاكد لو وصلنا للنهاية تقريباً (سيبنا هامش بسيط 5 بكسل للتأكيد)
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;

      if (isAtEnd) {
        // وصل للنهاية -> بنوقف الـ Interval تماماً عشان يثبت مكانه ومايعملش أي حركة تاني
        clearInterval(scrollInterval);
      } else {
        // بيتحرك خطوة بسيطة وهادية (سرعة متوسطة وناعمة)
        container.scrollBy({ left: 0.8, behavior: 'smooth' });
      }
    }, 60); // كل 60 ملي ثانية عشان الحركة تكون سموث ومتوسطة السرعة

    return () => clearInterval(scrollInterval);
  }, [loading, catalogProducts.length, isCatalogPaused, catalogProducts]);

  // =======================
  // =======================
  // زر المشاركة الشامل (Universal Share) اللي بيخلي أي حد يشير المنتج

  // const handleUniversalShare = (productItem) => {
  //   const productUrl = `${window.location.origin}/?product=${productItem.id}`;
  //   const shareText = `🔥 متفوتش العرض ده من Abdo Store!\n\n📦 المنتج: ${productItem.name}\n💰 السعر: ${productItem.price} EGP\n\nاطلبه دلوقتي من هنا:`;

  //   if (navigator.share) {
  //     navigator
  //       .share({
  //         title: productItem.name,
  //         text: shareText,
  //         url: productUrl,
  //       })
  //       .catch((error) => console.log('Error sharing:', error));
  //   } else {
  //     navigator.clipboard.writeText(`${shareText} ${productUrl}`);
  //     alert('✅ تم نسخ تفاصيل ورابط المنتج للحافظة!');
  //   }
  // };
  // =======================
  // =======================
  // =======================

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 font-sans relative selection:bg-red-500 selection:text-white'>
      {/* Background Glow Orbs */}
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* 1. Top Announcement Bar */}
      <div className='bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 text-white text-[11px] sm:text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md relative z-50'>
        <Flame className='w-4 h-4 animate-bounce text-yellow-300' />
        <span>
          🔥 FLASH SALE: Enjoy Up To 40% OFF On Selected Cyber Tech Items!
          Limited Time Only.
        </span>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className='fixed bottom-6 right-6 z-50 bg-[#0e1626]/95 backdrop-blur-xl text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/80 animate-bounce'>
          <CheckCircle2 size={20} className='text-emerald-400' />
          <span className='text-xs font-bold'>{toastMessage}</span>
        </div>
      )}

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div className='fixed inset-0 z-50 overflow-hidden font-sans'>
          <div
            className='absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity'
            onClick={() => setIsCartOpen(false)}
          />
          <div className='absolute inset-y-0 right-0 max-w-full flex pl-10'>
            <div className='w-screen max-w-md bg-[#0e1626] border-l border-slate-800 shadow-2xl flex flex-col'>
              <div className='flex items-center justify-between p-5 border-b border-slate-800'>
                <h2 className='text-base font-black text-white flex items-center gap-2.5'>
                  <ShoppingCart size={20} className='text-blue-400' />
                  <span>Shopping Cart ({totalItemsCount})</span>
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className='p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition'
                >
                  <X size={18} />
                </button>
              </div>

              <div className='flex-1 overflow-y-auto p-5 space-y-4'>
                {cart.length === 0 ? (
                  <div className='text-center py-24 text-slate-500 space-y-3'>
                    <ShoppingBag size={48} className='mx-auto text-slate-700' />
                    <p className='text-xs font-bold'>
                      Your cart is currently empty.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const itemImg =
                      item.image ||
                      item.images?.[0] ||
                      'https://via.placeholder.com/80';
                    return (
                      <div
                        key={item.id}
                        className='flex items-center gap-4 bg-[#141d2f]/70 p-3.5 rounded-2xl border border-slate-800'
                      >
                        <img
                          src={itemImg}
                          alt={item.name}
                          className='w-16 h-16 object-cover rounded-xl border border-slate-700 bg-slate-900'
                        />
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-bold text-xs text-slate-100 truncate'>
                            {item.name}
                          </h4>
                          <div className='text-xs font-black text-blue-400 mt-1'>
                            {item.price} EGP
                          </div>
                          <div className='flex items-center gap-2 mt-2'>
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className='p-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700 transition'
                            >
                              <Minus size={12} />
                            </button>
                            <span className='text-xs font-black px-2 text-white'>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className='p-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700 transition'
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className='p-2 bg-red-950/40 text-red-400 hover:bg-red-900/40 rounded-xl border border-red-500/30 transition'
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className='p-5 border-t border-slate-800 bg-[#07090e] space-y-3'>
                  <div className='flex justify-between text-xs font-bold text-slate-400'>
                    <span>Subtotal:</span>
                    <span className='text-base text-white font-black'>
                      {subtotal} EGP
                    </span>
                  </div>
                  <Link
                    href='/checkout'
                    onClick={() => setIsCartOpen(false)}
                    className='w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-center rounded-xl font-bold block shadow-lg shadow-red-950/50 transition text-xs'
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Navbar (Sticky and includes Wishlist Icon linked to logic) */}
      <nav className=' fixed top-0 left-0 right-0  w-full bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/85 z-50'>
        {/* تم تعديل الارتفاع على الموبايل ليكون h-16 بدلاً من h-20، وزيادة المسافات الجانبية px-5 */}
        <div className='max-w-7xl mx-auto px-5 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4'>
          <Link
            href='/'
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className='text-sm sm:text-lg font-black flex items-center gap-2 sm:gap-3 text-white shrink-0 cursor-pointer group'
          >
            {/* تصغير حجم الصورة على الموبايل w-9 h-9 وعلى الشاشات الأكبر ترجع w-12 h-12 */}
            <div className='w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-xl shadow-red-600/30 overflow-hidden flex items-center justify-center'>
              <img
                src='/we11.jpg'
                alt='Abdo'
                className='w-full h-full object-cover rounded-[10px] sm:rounded-[14px] transform group-hover:scale-110 transition-transform duration-500'
              />
            </div>

            {/* تصغير حجم خط Abdo Store على الموبايل ليكون text-sm وفي الشاشات الأكبر sm:text-xl */}
            <span className='text-sm sm:text-xl font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
              Abdo Store
            </span>
          </Link>

          {/* Search Input Bar
          <div className='relative flex-1 max-w-md hidden md:block'>
            <Search
              size={17}
              className='absolute left-3.5 top-3 text-slate-400'
            />
            <input
              type='text'
              placeholder='Search products, brands, categories...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
            />
          </div> */}

          {/* ============================================== */}
          {/* ============================================== */}

          {/* Welcome Banner / Bar */}

          {/*
          <div className='relative flex-1 max-w-md hidden md:flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-950 via-[#141d2f] to-red-950 border border-blue-500/30 rounded-xl text-xs text-white shadow-lg shadow-blue-950/20 transition'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/10 to-red-500/10 rounded-xl pointer-events-none' />

            <span className='relative z-10 font-semibold tracking-wide flex items-center gap-2'>
              <span className='bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent text-sm'>
                Welcome to Abdo Store
              </span>
              <span className=' text-base'>❤️👋</span>
            </span>
          </div> */}

          {/* ============================================== */}
          {/* ============================================== */}
          {/* Actions & Wishlist / Account / Cart */}
          {/* تقليل المسافات البينية بين الأزرار على الموبايل gap-1.5 لتوفير مساحة */}
          <div className='flex items-center gap-1.5 sm:gap-2.5 shrink-0'>
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}

            {/* Wishlist Button in Navbar linked with Wishlist count logic */}
            <button
              type='button'
              onClick={() => setIsWishlistModalOpen(true)}
              className='flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 p-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition border border-slate-700/60 relative cursor-pointer'
              title='My Wishlist'
            >
              <Heart
                size={14}
                className='sm:w-[15px] sm:h-[15px] text-rose-500 fill-rose-500'
              />
              <span className='hidden lg:inline'>Wishlist</span>
              {wishlist.length > 0 && (
                <span className='absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] sm:text-[10px] font-black w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center shadow-md ring-2 ring-slate-900'>
                  {wishlist.length}
                </span>
              )}
            </button>
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            <Link
              href='/admin/login'
              className='flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 p-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition border border-slate-700/60'
              title='Admin Portal'
            >
              <ShieldAlert
                size={14}
                className='sm:w-[15px] sm:h-[15px] text-red-400'
              />
              <span className='hidden lg:inline'>Admin</span>
            </Link>
            {/* =============================== */}
            {/* =============================== */}

            <button
              type='button'
              onClick={() => {
                if (currentUser) {
                  window.location.href = '/profile';
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className='flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 p-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition border border-slate-700/60 cursor-pointer'
              title={currentUser ? 'My Profile' : 'Sign In'}
            >
              <User
                size={14}
                className='sm:w-[15px] sm:h-[15px] text-blue-400'
              />
              <span className='hidden lg:inline'>
                {currentUser ? 'Account' : 'Sign In'}
              </span>
            </button>
            {/* =============================== */}
            {/* =============================== */}

            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className='flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/40 relative cursor-pointer'
            >
              <ShoppingCart size={14} className='sm:w-4 sm:h-4' />
              <span className='hidden sm:inline'>Cart</span>
              {totalItemsCount > 0 && (
                <span className='absolute -top-1.5 -right-1.5 bg-white text-slate-900 text-[9px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md ring-2 ring-red-600'>
                  {totalItemsCount}
                </span>
              )}
            </button>
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
          </div>
        </div>
      </nav>

      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}

      {/* 3. SECTION 1: HERO BANNER SLIDER (متوسط السرعة مع أزرار تحكم مخصصة وتخصيص للصور وحركة أوتوماتيكية ذكية) */}
      <section className='mt-2 sm:mt-6 mb-3 relative w-full py-2 sm:py-4 bg-gradient-to-b from-[#070b14] via-[#0b1324] to-[#070b14] overflow-hidden border-b border-slate-800/80 text-[11px] sm:text-sm'>
        {/* Background Ambient Glows */}
        <div className='absolute top-1/4 left-1/4 w-32 sm:w-96 h-32 sm:h-96 bg-blue-600/10 rounded-full blur-2xl sm:blur-3xl pointer-events-none' />
        <div className='absolute bottom-1/4 right-1/4 w-32 sm:w-96 h-32 sm:h-96 bg-red-600/10 rounded-full blur-2xl sm:blur-3xl pointer-events-none' />

        <div className='max-w-7xl mx-auto px-2 sm:px-6 space-y-2 sm:space-y-4 relative z-10'>
          {/* Header & Controls */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-2 sm:pb-3 gap-2 sm:gap-4'>
            <div className='flex items-center gap-2 pt-1 sm:pt-2 my-1'>
              <div className='p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-red-600 to-blue-600 text-white shadow-lg shrink-0'>
                <Zap size={16} className='sm:w-5 sm:h-5 text-blue-400' />
              </div>
              <div>
                <h1 className='text-lg sm:text-2xl font-black text-white tracking-tight'>
                  Featured Hero Showcase
                </h1>
                <p className='text-[10px] sm:text-xs text-slate-300 mt-0.5'>
                  Explore our top-tier hero catalog selections with continuous
                  smooth preview
                </p>
              </div>
            </div>

            {/* Slider Controls for Hero Section */}
            {heroProducts.length > 0 && !loading && (
              <div className='flex items-center gap-2 self-end sm:self-auto shrink-0'>
                {/* Pause / Resume Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById('hero-slider-ref');
                    if (!slider) return;
                    const currentPaused = slider.dataset.isPaused === 'true';
                    slider.dataset.isPaused = currentPaused ? 'false' : 'true';
                    if (typeof setIsHeroPaused === 'function') {
                      setIsHeroPaused(!currentPaused);
                    }
                  }}
                  className='p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-red-600/90 to-blue-600/90 hover:from-red-500 hover:to-blue-500 border border-blue-500/30 text-white shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center'
                  title='Toggle Hero Scroll'
                >
                  {isHeroPaused ? (
                    <Play size={14} className='sm:w-4 sm:h-4' />
                  ) : (
                    <Pause size={14} className='sm:w-4 sm:h-4' />
                  )}
                </button>

                {/* Scroll Left Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById('hero-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    slider.scrollBy({
                      left: -320,
                      behavior: 'smooth',
                    });

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                        }
                      }, 1500),
                    );
                  }}
                  className='p-2 sm:p-2.5 rounded-xl bg-[#0e1626]/90 border border-slate-700 text-slate-200 hover:text-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center'
                  title='السابق'
                >
                  <ChevronLeft
                    size={16}
                    className='sm:w-5 sm:h-5 text-blue-400'
                  />
                </button>

                {/* Scroll Right Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById('hero-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    slider.scrollBy({
                      left: 320,
                      behavior: 'smooth',
                    });

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                        }
                      }, 1500),
                    );
                  }}
                  className='p-2 sm:p-2.5 rounded-xl bg-[#0e1626]/90 border border-slate-700 text-slate-200 hover:text-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center'
                  title='التالي'
                >
                  <ChevronRight
                    size={16}
                    className='sm:w-5 sm:h-5 text-red-400'
                  />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className='py-16 flex flex-col items-center justify-center text-slate-400 space-y-2'>
              <Loader2 className='w-7 h-7 animate-spin text-blue-500' />
              <p className='text-[11px] font-medium'>
                Loading hero collection...
              </p>
            </div>
          ) : heroProducts.length === 0 ? null : (
            <div className='relative'>
              <div
                id='hero-slider-ref'
                dir='ltr'
                onPointerDown={(e) => {
                  const node = e.currentTarget;
                  node.dataset.isPaused = 'true';
                  if (node.dataset.resumeTimer) {
                    clearTimeout(Number(node.dataset.resumeTimer));
                  }
                }}
                onPointerUp={(e) => {
                  const node = e.currentTarget;
                  node.dataset.resumeTimer = String(
                    window.setTimeout(() => {
                      if (node.isConnected) {
                        node.dataset.isPaused = 'false';
                      }
                    }, 1600),
                  );
                }}
                onPointerCancel={(e) => {
                  const node = e.currentTarget;
                  node.dataset.resumeTimer = String(
                    window.setTimeout(() => {
                      if (node.isConnected) {
                        node.dataset.isPaused = 'false';
                      }
                    }, 600),
                  );
                }}
                onWheel={(e) => {
                  const node = e.currentTarget;
                  node.dataset.isPaused = 'true';
                  if (node.dataset.resumeTimer) {
                    clearTimeout(Number(node.dataset.resumeTimer));
                  }
                  node.dataset.resumeTimer = String(
                    window.setTimeout(() => {
                      if (node.isConnected) {
                        node.dataset.isPaused = 'false';
                      }
                    }, 1200),
                  );
                }}
                onMouseEnter={() => {
                  const node = document.getElementById('hero-slider-ref');
                  if (node) node.dataset.isPaused = 'true';
                }}
                onMouseLeave={() => {
                  const node = document.getElementById('hero-slider-ref');
                  if (node) node.dataset.isPaused = 'false';
                }}
                ref={(node) => {
                  if (!node || node.dataset.initAuto === 'true') return;

                  node.dataset.initAuto = 'true';
                  node.dataset.isPaused = 'false';

                  let groupWidth = 0;
                  let lastTime = 0;

                  const animate = (time: number) => {
                    if (!node.isConnected) return;

                    const centerGroup = node.querySelector<HTMLElement>(
                      '[data-hero-group="4"]',
                    );

                    if (centerGroup) {
                      const newWidth =
                        centerGroup.getBoundingClientRect().width;

                      // تحديث القياسات عند تغيير الشاشة
                      if (newWidth > 0 && Math.abs(newWidth - groupWidth) > 1) {
                        groupWidth = newWidth;
                        node.scrollLeft = groupWidth * 4;
                      }

                      if (groupWidth > 0) {
                        const delta = lastTime
                          ? Math.min(time - lastTime, 40)
                          : 0;

                        // Auto Scroll Speed (سرعة الهيرو مظبوطة وسلسة)
                        if (node.dataset.isPaused !== 'true') {
                          node.scrollLeft += (35 * delta) / 1000;
                        }

                        // Infinite Loop Forward
                        if (node.scrollLeft >= groupWidth * 5) {
                          node.scrollLeft -= groupWidth;
                        }
                        // Infinite Loop Backward
                        else if (node.scrollLeft <= groupWidth * 3) {
                          node.scrollLeft += groupWidth;
                        }
                      }
                    }

                    lastTime = time;
                    requestAnimationFrame(animate);
                  };

                  requestAnimationFrame(animate);
                }}
                className='flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-2 px-1 touch-pan-x overscroll-x-contain'
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'auto',
                }}
              >
                {/* 9 Repeated Groups for Infinite Seamless Flow */}
                <div className='flex w-max'>
                  {Array.from({ length: 9 }, (_, copy) => (
                    <div
                      key={`hero-group-${copy}`}
                      data-hero-group={copy}
                      aria-hidden={copy !== 4}
                      className='flex shrink-0 items-center gap-3 sm:gap-5 pr-3 sm:pr-5'
                    >
                      {heroProducts.map((product) => {
                        const displayImage =
                          product.image || product.images?.[0];
                        const isWish = wishlist.includes(product.id);
                        const oldPrice =
                          product.originalPrice ||
                          product.oldPrice ||
                          product.compare_at_price;
                        const stockQty =
                          product.stock_quantity ?? product.stock ?? 10;
                        const ratingVal = product.rating || 5;

                        return (
                          <Link
                            key={`hero-${copy}-${product.id}`}
                            href={`/products/${product.id}`}
                            tabIndex={copy === 4 ? undefined : -1}
                            className='w-[240px] sm:w-[320px] shrink-0 bg-[#0e172a]/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-800/90 shadow-xl overflow-hidden hover:border-blue-500/50 transition duration-300 group flex flex-col justify-between cursor-pointer'
                          >
                            <div>
                              {/* Image Container */}
                              <div className='w-full h-44 sm:h-56 bg-slate-950 relative overflow-hidden border-b border-slate-800/80'>
                                {displayImage ? (
                                  <img
                                    src={displayImage}
                                    alt={product.name}
                                    className='w-full h-full object-cover group-hover:scale-105 transition duration-700'
                                  />
                                ) : (
                                  <div className='flex items-center justify-center h-full text-slate-600 text-[11px] font-medium'>
                                    No Image Available
                                  </div>
                                )}

                                <div className='absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow-md'>
                                  <Flame size={10} className='fill-white' />{' '}
                                  Hero Featured
                                </div>

                                <button
                                  type='button'
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleWishlist(product);
                                  }}
                                  className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md border transition ${
                                    isWish
                                      ? 'bg-rose-950/80 text-rose-500 border-rose-500/40'
                                      : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                                  }`}
                                >
                                  <Heart
                                    size={14}
                                    className={isWish ? 'fill-rose-500' : ''}
                                  />
                                </button>
                              </div>

                              {/* Details */}
                              <div className='p-3 sm:p-4 space-y-2'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-[9px] font-bold text-blue-400 uppercase tracking-widest block'>
                                    {product.category || 'Hero Series'}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold text-[9px] border ${
                                      stockQty > 0
                                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                        : 'bg-red-950/60 text-red-300 border-red-500/30'
                                    }`}
                                  >
                                    {stockQty > 0
                                      ? `${stockQty} in stock`
                                      : 'Out of Stock'}
                                  </span>
                                </div>

                                <h3 className='font-extrabold text-white line-clamp-1 text-xs sm:text-sm group-hover:text-blue-400 transition'>
                                  {product.name}
                                </h3>

                                <p className='text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-relaxed'>
                                  {product.description ||
                                    'No description available for this product.'}
                                </p>

                                {/* النجوم */}
                                <div className='flex items-center gap-1 text-amber-400 text-[11px]'>
                                  <div className='flex items-center'>
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={
                                          i < ratingVal
                                            ? 'text-amber-400'
                                            : 'text-slate-700'
                                        }
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span className='text-[9px] text-slate-400 font-medium'>
                                    ({ratingVal}.0)
                                  </span>
                                </div>

                                {/* الأسعار والشير */}
                                <div className='flex items-center justify-between pt-2 border-t border-slate-800/80'>
                                  <div className='flex items-baseline gap-1.5'>
                                    <span className='font-black text-sm sm:text-base text-white tracking-tight'>
                                      {product.price}{' '}
                                      <span className='text-[9px] text-slate-400 font-semibold'>
                                        EGP
                                      </span>
                                    </span>
                                    {oldPrice && oldPrice > product.price && (
                                      <span className='text-[10px] text-slate-400/80 line-through font-light'>
                                        {oldPrice}{' '}
                                        <span className='text-[8px]'>EGP</span>
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    className='scale-75 origin-center inline-block'
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ShareButton
                                      productId={product.id}
                                      productName={product.name}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className='p-3 sm:p-4 pt-0'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type='button'
                                onClick={(e) => addToCart(e, product)}
                                className='w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white rounded-xl text-[11px] sm:text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer'
                              >
                                <ShoppingCart size={14} /> Add to Cart
                              </button>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}

      {/* Feature Highlights Grid Info */}

      <div className='max-w-7xl mx-auto px-4 sm:px-6 my-10'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800/80'>
            <div className='w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0'>
              <Truck size={20} />
            </div>
            <div>
              <h4 className='text-xs font-bold text-white'>
                Fast Nationwide Delivery
              </h4>
              <p className='text-[11px] text-slate-400'>
                Quick dispatch to all cities
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800/80'>
            <div className='w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0'>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className='text-xs font-bold text-white'>
                Authentic Warranty
              </h4>
              <p className='text-[11px] text-slate-400'>
                Guaranteed original items
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3.5 bg-[#0e1626]/70 p-4 rounded-2xl border border-slate-800/80'>
            <div className='w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0'>
              <Headphones size={20} />
            </div>
            <div>
              <h4 className='text-xs font-bold text-white'>24/7 Support</h4>
              <p className='text-[11px] text-slate-400'>
                Always here to help you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}

      {/* 1. Top Announcement Bar (متحرك بـ Animation خفيف ونار من الناحيتين) */}

      {/* Top Announcement Bar - Dynamic from Supabase */}
      {announcementBar?.enabled && announcementBar.text.trim() && (
        <div className='w-full py-3 px-4 bg-[#07090e] flex items-center justify-center border-b border-slate-800/60'>
          <div className='inline-flex max-w-full items-center justify-center gap-2.5 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-600/90 via-emerald-600/90 to-blue-600/90 px-4 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-red-950/40 backdrop-blur-md sm:px-6 sm:text-sm'>
            <span className='shrink-0 animate-pulse text-sm sm:text-base'>
              {announcementBar.startEmoji}
            </span>
            <span className='break-words text-center tracking-wide'>
              {announcementBar.text}
            </span>
            <span className='shrink-0 animate-bounce text-sm sm:text-base'>
              {announcementBar.endEmoji}
            </span>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}

      {/* ===============2================ */}
      {flashDeals.length > 0 && (
        <section className='max-w-7xl mx-auto px-2 sm:px-6 my-3 sm:my-6 py-3 sm:py-5 border-b border-slate-800/80 relative'>
          {/* Header & Controls */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-5 gap-3'>
            <div className='flex items-center gap-2 sm:gap-3'>
              <div className='p-2 bg-red-950/60 border border-red-500/30 rounded-xl text-red-500 shrink-0'>
                <Flame size={16} className='sm:w-5 sm:h-5 animate-pulse' />
              </div>
              <div>
                <h2 className='text-sm sm:text-xl font-black text-white tracking-tight flex items-center gap-2'>
                  Hot Flash Deals Slider ⚡
                </h2>
                <p className='text-[10px] sm:text-xs text-slate-300 mt-0.5'>
                  Limited quantity discounts available now in continuous smooth
                  motion
                </p>
              </div>
            </div>

            {/* Slider Controls */}
            {!loading && (
              <div className='flex items-center gap-2 self-end sm:self-auto'>
                {/* Pause / Resume Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById('flash-slider-ref');
                    if (!slider) return;
                    const currentPaused = slider.dataset.isPaused === 'true';
                    slider.dataset.isPaused = currentPaused ? 'false' : 'true';
                    if (typeof setIsFlashPaused === 'function') {
                      setIsFlashPaused(!currentPaused);
                    }
                  }}
                  className='p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-red-600/90 to-blue-600/90 hover:from-red-500 hover:to-blue-500 border border-blue-500/30 text-white shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center'
                  title={
                    isFlashPaused ? 'Resume Flash Deals' : 'Pause Flash Deals'
                  }
                >
                  {isFlashPaused ? (
                    <Play size={14} className='sm:w-4 sm:h-4' />
                  ) : (
                    <Pause size={14} className='sm:w-4 sm:h-4' />
                  )}
                </button>

                {/* Scroll Left Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById('flash-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    slider.scrollBy({
                      left: -280,
                      behavior: 'smooth',
                    });

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                        }
                      }, 1500),
                    );
                  }}
                  className='p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-red-600/20 border border-blue-500/40 text-slate-100 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center'
                  title='السابق'
                >
                  <ChevronLeft size={16} className='sm:w-5 sm:h-5' />
                </button>

                {/* Scroll Right Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById('flash-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    slider.scrollBy({
                      left: 280,
                      behavior: 'smooth',
                    });

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                        }
                      }, 1500),
                    );
                  }}
                  className='p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-red-600/20 to-blue-600/20 border border-red-500/40 text-slate-100 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center'
                  title='التالي'
                >
                  <ChevronRight size={16} className='sm:w-5 sm:h-5' />
                </button>
              </div>
            )}
          </div>

          {/* Slider Container */}
          <div className='relative'>
            <div
              id='flash-slider-ref'
              dir='ltr'
              onPointerDown={(e) => {
                const node = e.currentTarget;
                node.dataset.isPaused = 'true';
                if (node.dataset.resumeTimer) {
                  clearTimeout(Number(node.dataset.resumeTimer));
                }
              }}
              onPointerUp={(e) => {
                const node = e.currentTarget;
                node.dataset.resumeTimer = String(
                  window.setTimeout(() => {
                    if (node.isConnected) {
                      node.dataset.isPaused = 'false';
                    }
                  }, 1600),
                );
              }}
              onPointerCancel={(e) => {
                const node = e.currentTarget;
                node.dataset.resumeTimer = String(
                  window.setTimeout(() => {
                    if (node.isConnected) {
                      node.dataset.isPaused = 'false';
                    }
                  }, 600),
                );
              }}
              onWheel={(e) => {
                const node = e.currentTarget;
                node.dataset.isPaused = 'true';
                if (node.dataset.resumeTimer) {
                  clearTimeout(Number(node.dataset.resumeTimer));
                }
                node.dataset.resumeTimer = String(
                  window.setTimeout(() => {
                    if (node.isConnected) {
                      node.dataset.isPaused = 'false';
                    }
                  }, 1200),
                );
              }}
              onMouseEnter={() => {
                const node = document.getElementById('flash-slider-ref');
                if (node) node.dataset.isPaused = 'true';
              }}
              onMouseLeave={() => {
                const node = document.getElementById('flash-slider-ref');
                if (node) node.dataset.isPaused = 'false';
              }}
              ref={(node) => {
                if (!node || node.dataset.initAuto === 'true') return;

                node.dataset.initAuto = 'true';
                node.dataset.isPaused = 'false';

                let groupWidth = 0;
                let lastTime = 0;

                const animate = (time: number) => {
                  if (!node.isConnected) return;

                  const centerGroup = node.querySelector<HTMLElement>(
                    '[data-flash-group="4"]',
                  );

                  if (centerGroup) {
                    const newWidth = centerGroup.getBoundingClientRect().width;

                    if (newWidth > 0 && Math.abs(newWidth - groupWidth) > 1) {
                      groupWidth = newWidth;
                      node.scrollLeft = groupWidth * 4;
                    }

                    if (groupWidth > 0) {
                      const delta = lastTime
                        ? Math.min(time - lastTime, 40)
                        : 0;

                      // سرعة عروض الفلاش (40px/s لحركة أسرع وأكثر حيوية)
                      if (node.dataset.isPaused !== 'true') {
                        node.scrollLeft += (40 * delta) / 1000;
                      }

                      // Infinite Loop Forward
                      if (node.scrollLeft >= groupWidth * 5) {
                        node.scrollLeft -= groupWidth;
                      }
                      // Infinite Loop Backward
                      else if (node.scrollLeft <= groupWidth * 3) {
                        node.scrollLeft += groupWidth;
                      }
                    }
                  }

                  lastTime = time;
                  requestAnimationFrame(animate);
                };

                requestAnimationFrame(animate);
              }}
              className='overflow-x-auto scrollbar-none py-2 px-1 touch-pan-x overscroll-x-contain'
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'auto',
              }}
            >
              {/* 9 Repeated Groups */}
              <div className='flex w-max'>
                {Array.from({ length: 9 }, (_, copy) => (
                  <div
                    key={`flash-group-${copy}`}
                    data-flash-group={copy}
                    aria-hidden={copy !== 4}
                    className='flex shrink-0 items-center gap-2.5 sm:gap-4 pr-2.5 sm:pr-4'
                  >
                    {flashDeals.map((item) => {
                      const displayImage = item.image || item.images?.[0];
                      const isWish = wishlist.includes(item.id);
                      const oldPrice =
                        item.originalPrice ||
                        item.oldPrice ||
                        item.compare_at_price;
                      const stockQty = item.stock_quantity ?? item.stock ?? 10;
                      const ratingVal = item.rating || 5;

                      return (
                        <Link
                          key={`flash-${copy}-${item.id}`}
                          href={`/products/${item.id}`}
                          tabIndex={copy === 4 ? undefined : -1}
                          className='w-[220px] sm:w-[260px] shrink-0 bg-[#0e1626]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:border-red-500/50 transition duration-300 group flex flex-col justify-between cursor-pointer'
                        >
                          <div>
                            <div className='relative w-full h-38 sm:h-48 bg-slate-900 border-b border-slate-800 overflow-hidden'>
                              <img
                                src={
                                  displayImage ||
                                  'https://via.placeholder.com/300'
                                }
                                alt={item.name}
                                className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
                              />
                              <button
                                type='button'
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleWishlist(item);
                                }}
                                className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md border transition ${
                                  isWish
                                    ? 'bg-rose-950/80 text-rose-500 border-rose-500/40'
                                    : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                                }`}
                              >
                                <Heart
                                  size={14}
                                  className={isWish ? 'fill-rose-500' : ''}
                                />
                              </button>
                              <span className='absolute top-2.5 left-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md'>
                                Hot Deal
                              </span>
                            </div>

                            <div className='p-3 sm:p-3.5 space-y-1.5'>
                              <div className='flex items-center justify-between'>
                                <span className='text-[9px] font-bold text-red-400 uppercase tracking-wider block'>
                                  {item.category || 'Special Offer'}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold text-[9px] border ${
                                    stockQty > 0
                                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                      : 'bg-red-950/60 text-red-300 border-red-500/30'
                                  }`}
                                >
                                  {stockQty > 0
                                    ? `${stockQty} in stock`
                                    : 'Out of Stock'}
                                </span>
                              </div>

                              <h3 className='font-bold text-xs sm:text-sm text-slate-100 line-clamp-1 group-hover:text-red-400 transition'>
                                {item.name}
                              </h3>

                              <p className='text-[10px] text-slate-400 line-clamp-1 leading-relaxed'>
                                {item.description ||
                                  'Limited time flash deal offer available now.'}
                              </p>

                              <div className='flex items-center gap-1 text-amber-400 text-[11px] pt-0.5'>
                                <div className='flex items-center'>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={
                                        i < ratingVal
                                          ? 'text-amber-400'
                                          : 'text-slate-700'
                                      }
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className='text-[9px] text-slate-400 font-medium'>
                                  ({ratingVal}.0)
                                </span>
                              </div>

                              <div className='flex items-center justify-between pt-1.5 border-t border-slate-800/80'>
                                <div className='flex items-baseline gap-1.5'>
                                  <span className='text-sm sm:text-base font-black text-white tracking-tight'>
                                    {item.price}{' '}
                                    <span className='text-[9px] text-slate-400 font-semibold'>
                                      EGP
                                    </span>
                                  </span>
                                  {oldPrice && oldPrice > item.price && (
                                    <span className='text-[10px] text-slate-400/80 line-through font-light'>
                                      {oldPrice}{' '}
                                      <span className='text-[8px]'>EGP</span>
                                    </span>
                                  )}
                                </div>

                                <div
                                  className='scale-75 origin-center inline-block'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ShareButton
                                    productId={item.id}
                                    productName={item.name}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            className='p-3 sm:p-3.5 pt-0'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type='button'
                              onClick={(e) => addToCart(e, item)}
                              className='w-full py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg cursor-pointer'
                            >
                              <ShoppingCart size={14} /> Add to Cart
                            </button>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}

      {/* 5. SECTION 3: MAIN CATALOG & SLIDER SECTION (الكاتالوج الكامل مع تحكم كامل، فلتر التصنيفات، حركة بطيئة جداً، وأزرار تحكم) */}

      {/* 5. SECTION 3: MAIN CATALOG & SLIDER SECTION - Ultra Compact & Optimized */}

      {/* 5. SECTION 3: MAIN CATALOG & SLIDER SECTION - Final Smooth Infinite */}
      <main
        id='products-grid'
        className='max-w-7xl mx-auto px-2 sm:px-4 my-2 sm:my-4 py-2 sm:py-4 space-y-3 sm:space-y-4'
      >
        {/* Section Title & Slider Controls */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2'>
          <div className='min-w-0 flex-1'>
            <h2 className='text-sm sm:text-lg font-black text-white tracking-tight'>
              {searchQuery
                ? `Search Results: "${searchQuery}"`
                : 'Our Complete Product Catalog 🏷️'}
            </h2>

            <p className='text-[9px] sm:text-[11px] text-slate-300'>
              Browse all items with smooth touch & scroll preview
            </p>
          </div>

          {/* Slider Navigation */}
          <div className='flex items-center gap-1.5 shrink-0 self-end sm:self-auto'>
            {!loading && catalogProducts.length > 0 && (
              <div className='flex items-center gap-1.5'>
                {/* Previous */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = catalogScrollRef.current;
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';

                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                      delete slider.dataset.resumeTimer;
                    }

                    const maxScroll = Math.max(
                      0,
                      slider.scrollWidth - slider.clientWidth,
                    );

                    const target = slider.scrollLeft - 260;

                    slider.dataset.manualTarget = String(
                      Math.max(0, Math.min(maxScroll, target)),
                    );
                  }}
                  className='p-1.5 sm:p-2 rounded-lg bg-[#0e1626]/90 border border-slate-700 text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow'
                  title='السابق'
                >
                  <ChevronLeft size={14} className='text-blue-400' />
                </button>

                {/* Next */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = catalogScrollRef.current;
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';

                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                      delete slider.dataset.resumeTimer;
                    }

                    const maxScroll = Math.max(
                      0,
                      slider.scrollWidth - slider.clientWidth,
                    );

                    const target = slider.scrollLeft + 260;

                    slider.dataset.manualTarget = String(
                      Math.max(0, Math.min(maxScroll, target)),
                    );
                  }}
                  className='p-1.5 sm:p-2 rounded-lg bg-[#0e1626]/90 border border-slate-700 text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow'
                  title='التالي'
                >
                  <ChevronRight size={14} className='text-red-400' />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Cards */}
        <div className='space-y-1.5'>
          <span className='text-[9px] sm:text-[10px] font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1'>
            ⚡ Filter by Categories:
          </span>

          <div className='grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1'>
            {/* All Categories */}
            {(() => {
              const allCount = products.filter(
                (p) => p.show_in_catalog === true,
              ).length;

              const isAllSelected =
                selectedCategory === 'All' ||
                selectedCategory === 'الكل' ||
                !selectedCategory;

              return (
                <button
                  type='button'
                  onClick={() => setSelectedCategory('All')}
                  className={`p-1.5 sm:p-2 rounded-lg border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-0.5 ${
                    isAllSelected
                      ? 'bg-gradient-to-br from-red-600 to-blue-600 border-transparent text-white shadow'
                      : 'bg-[#0e1626]/90 hover:bg-[#141d2f] border-slate-800 text-slate-300'
                  }`}
                >
                  <span className='text-[10px] font-bold truncate w-full'>
                    All Categories
                  </span>

                  <div className='flex items-center justify-between text-[8px]'>
                    <span
                      className={`px-1 rounded ${
                        isAllSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {allCount}
                    </span>

                    <span>📦</span>
                  </div>
                </button>
              );
            })()}

            {/* Dynamic Categories */}
            {categories.map((cat) => {
              const catName = typeof cat === 'object' ? cat.name : cat;
              const catId = typeof cat === 'object' ? cat.id : cat;

              const count = products.filter((p) => {
                const matchesCategory =
                  p.category_id === catId ||
                  p.category === catName ||
                  p.categories?.id === catId ||
                  p.categories?.name === catName;

                return matchesCategory && p.show_in_catalog === true;
              }).length;

              const isSelected =
                selectedCategory === catName ||
                selectedCategory === catId ||
                selectedCategory === cat;

              return (
                <button
                  key={`cat-box-${catId || catName}`}
                  type='button'
                  onClick={() => setSelectedCategory(catName)}
                  className={`p-1.5 sm:p-2 rounded-lg border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-0.5 ${
                    isSelected
                      ? 'bg-gradient-to-br from-red-600 to-blue-600 border-transparent text-white shadow'
                      : 'bg-[#0e1626]/90 hover:bg-[#141d2f] border-slate-800 text-slate-300'
                  }`}
                >
                  <span className='text-[10px] font-bold truncate w-full'>
                    {catName}
                  </span>

                  <div className='flex items-center justify-between text-[8px]'>
                    <span
                      className={`px-1 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>

                    <span>🏷️</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Slider */}
        {loading ? (
          <div className='py-12 flex flex-col items-center justify-center text-slate-400 space-y-1.5'>
            <Loader2 className='w-6 h-6 animate-spin text-blue-500' />

            <p className='text-[10px] font-medium'>Loading store products...</p>
          </div>
        ) : catalogProducts.length === 0 ? (
          <div className='text-center py-8 bg-[#0e1626]/90 rounded-xl border border-slate-800 shadow max-w-xs mx-auto space-y-2'>
            <ShoppingBag size={28} className='mx-auto text-slate-600' />

            <p className='text-xs font-bold text-white'>No products found</p>

            <button
              type='button'
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className='px-3 py-1.5 bg-gradient-to-r from-red-600 to-blue-600 text-white text-[10px] font-bold rounded-lg cursor-pointer'
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className='relative'>
            {/* Slider Container */}
            <div
              id='catalog-slider-ref'
              ref={(node) => {
                catalogScrollRef.current = node;

                if (!node || node.dataset.initAuto === 'true') return;

                node.dataset.initAuto = 'true';
                node.dataset.isPaused = 'false';

                let groupWidth = 0;
                let lastTime = 0;
                let lastLoopMode: boolean | null = null;

                const animate = (time: number) => {
                  if (!node.isConnected) return;

                  // تحديد المجموعات الموجودة حاليًا
                  const groups = node.querySelectorAll<HTMLElement>(
                    '[data-catalog-group]',
                  );

                  const shouldLoop = groups.length === 3;

                  const centerGroup = groups[shouldLoop ? 1 : 0];

                  if (centerGroup) {
                    const newWidth = centerGroup.getBoundingClientRect().width;

                    // تحديث القياسات عند تغيير الشاشة أو عدد المجموعات
                    if (
                      newWidth > 0 &&
                      (Math.abs(newWidth - groupWidth) > 1 ||
                        lastLoopMode !== shouldLoop)
                    ) {
                      groupWidth = newWidth;
                      lastLoopMode = shouldLoop;

                      node.scrollLeft = shouldLoop ? groupWidth : 0;

                      delete node.dataset.manualTarget;
                    }

                    if (groupWidth > 0) {
                      const maxScroll = Math.max(
                        0,
                        node.scrollWidth - node.clientWidth,
                      );

                      const rightBoundary = Math.min(groupWidth * 2, maxScroll);

                      // Manual Navigation Animation
                      const manualTarget = node.dataset.manualTarget;

                      if (manualTarget !== undefined) {
                        const target = Number(manualTarget);

                        const distance = target - node.scrollLeft;

                        if (Math.abs(distance) > 0.8) {
                          // حركة ناعمة للأسهم بدون تعارض مع Auto Scroll
                          node.scrollLeft += distance * 0.2;
                        } else {
                          node.scrollLeft = target;

                          delete node.dataset.manualTarget;

                          // الحفاظ على Infinite Loop بعد حركة الأسهم
                          if (shouldLoop) {
                            if (node.scrollLeft >= rightBoundary - 1) {
                              node.scrollLeft = Math.max(
                                0,
                                node.scrollLeft - groupWidth,
                              );
                            } else if (node.scrollLeft <= 1) {
                              node.scrollLeft = Math.min(
                                maxScroll,
                                node.scrollLeft + groupWidth,
                              );
                            }
                          }

                          // استئناف الحركة التلقائية بعد انتهاء تحريك الزر
                          if (node.dataset.resumeTimer) {
                            clearTimeout(Number(node.dataset.resumeTimer));
                          }

                          node.dataset.resumeTimer = String(
                            window.setTimeout(() => {
                              if (
                                node.isConnected &&
                                node.dataset.manualTarget === undefined
                              ) {
                                node.dataset.isPaused = 'false';
                              }
                            }, 800),
                          );
                        }
                      }

                      // Automatic Infinite Scroll
                      else if (shouldLoop) {
                        const delta = lastTime
                          ? Math.min(time - lastTime, 40)
                          : 0;

                        // سرعة الحركة التلقائية: 15px per second
                        if (node.dataset.isPaused !== 'true') {
                          node.scrollLeft += (15 * delta) / 1000;
                        }

                        // Infinite Loop Forward
                        if (node.scrollLeft >= rightBoundary - 1) {
                          node.scrollLeft = Math.max(
                            0,
                            node.scrollLeft - groupWidth,
                          );
                        }

                        // Infinite Loop Backward
                        else if (node.scrollLeft <= 1) {
                          node.scrollLeft = Math.min(
                            maxScroll,
                            node.scrollLeft + groupWidth,
                          );
                        }
                      }
                    }
                  }

                  lastTime = time;

                  requestAnimationFrame(animate);
                };

                requestAnimationFrame(animate);
              }}
              dir='ltr'
              onPointerDown={(e) => {
                const node = e.currentTarget;

                node.dataset.isPaused = 'true';

                delete node.dataset.manualTarget;

                if (node.dataset.resumeTimer) {
                  clearTimeout(Number(node.dataset.resumeTimer));
                  delete node.dataset.resumeTimer;
                }
              }}
              onPointerUp={(e) => {
                const node = e.currentTarget;

                node.dataset.resumeTimer = String(
                  window.setTimeout(() => {
                    if (node.isConnected) {
                      node.dataset.isPaused = 'false';
                    }
                  }, 1600),
                );
              }}
              onPointerCancel={(e) => {
                const node = e.currentTarget;

                node.dataset.resumeTimer = String(
                  window.setTimeout(() => {
                    if (node.isConnected) {
                      node.dataset.isPaused = 'false';
                    }
                  }, 500),
                );
              }}
              onWheel={(e) => {
                const node = e.currentTarget;

                node.dataset.isPaused = 'true';

                delete node.dataset.manualTarget;

                if (node.dataset.resumeTimer) {
                  clearTimeout(Number(node.dataset.resumeTimer));
                  delete node.dataset.resumeTimer;
                }

                node.dataset.resumeTimer = String(
                  window.setTimeout(() => {
                    if (node.isConnected) {
                      node.dataset.isPaused = 'false';
                    }
                  }, 1000),
                );
              }}
              className='overflow-x-auto scrollbar-none py-1.5 px-0.5 touch-pan-x overscroll-x-contain'
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'auto',
              }}
            >
              {/* 3 Groups Only When There Are Enough Products */}
              <div className='flex w-max'>
                {Array.from(
                  {
                    length: catalogProducts.length >= 5 ? 3 : 1,
                  },
                  (_, copy) => (
                    <div
                      key={`catalog-group-${copy}`}
                      data-catalog-group={copy}
                      aria-hidden={catalogProducts.length >= 5 && copy !== 1}
                      className='flex shrink-0 items-center gap-2 sm:gap-3 pr-2 sm:pr-3'
                    >
                      {catalogProducts.map((product) => {
                        const displayImage =
                          product.image || product.images?.[0];

                        const isWish = wishlist.includes(product.id);

                        const oldPrice =
                          product.originalPrice ||
                          product.oldPrice ||
                          product.compare_at_price;

                        const stockQty =
                          product.stock_quantity ?? product.stock ?? 10;

                        const ratingVal = product.rating || 5;

                        const productCategoryName =
                          product.categories?.name ||
                          categories.find(
                            (c) =>
                              c.id === product.category_id ||
                              c.name === product.category,
                          )?.name ||
                          product.category ||
                          'General';

                        return (
                          <Link
                            key={`${copy}-${product.id}`}
                            href={`/products/${product.id}`}
                            tabIndex={
                              catalogProducts.length >= 5 && copy !== 1
                                ? -1
                                : undefined
                            }
                            className='w-[210px] sm:w-[240px] shrink-0 bg-[#0e1626]/95 backdrop-blur-xl rounded-xl border border-slate-800 shadow-md overflow-hidden hover:border-slate-700 transition duration-300 group flex flex-col justify-between cursor-pointer'
                          >
                            <div>
                              {/* Image & Wishlist */}
                              <div className='w-full h-36 sm:h-44 bg-slate-900 relative overflow-hidden border-b border-slate-800'>
                                {displayImage ? (
                                  <img
                                    src={displayImage}
                                    alt={product.name}
                                    className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
                                  />
                                ) : (
                                  <div className='flex items-center justify-center h-full text-slate-600 text-[10px]'>
                                    No Image
                                  </div>
                                )}

                                <button
                                  type='button'
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleWishlist(product);
                                  }}
                                  className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md border transition z-20 ${
                                    isWish
                                      ? 'bg-rose-950/80 text-rose-500 border-rose-500/40'
                                      : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                                  }`}
                                >
                                  <Heart
                                    size={12}
                                    className={isWish ? 'fill-rose-500' : ''}
                                  />
                                </button>
                              </div>

                              {/* Product Info */}
                              <div className='p-2 sm:p-2.5 space-y-1.5'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-[8px] font-bold text-blue-400 uppercase tracking-wider block bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20 truncate max-w-[110px]'>
                                    {productCategoryName}
                                  </span>

                                  <span
                                    className={`px-1 py-0.5 rounded font-bold text-[8px] border ${
                                      stockQty > 0
                                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                        : 'bg-red-950/60 text-red-300 border-red-500/30'
                                    }`}
                                  >
                                    {stockQty > 0
                                      ? `${stockQty} in stock`
                                      : 'Out of Stock'}
                                  </span>
                                </div>

                                <h3 className='font-bold text-slate-100 line-clamp-1 text-[11px] sm:text-xs group-hover:text-blue-400 transition'>
                                  {product.name}
                                </h3>

                                <p className='text-[9px] text-slate-400 line-clamp-1 leading-relaxed'>
                                  {product.description ||
                                    'Explore our high-quality product collection.'}
                                </p>

                                {/* Rating */}
                                <div className='flex items-center justify-between text-[10px] text-amber-400 pt-0.5'>
                                  <div className='flex items-center'>
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={`text-[9px] ${
                                          i < ratingVal
                                            ? 'text-amber-400'
                                            : 'text-slate-700'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}

                                    <span className='text-[8px] text-slate-400 font-medium ml-1'>
                                      ({ratingVal}.0)
                                    </span>
                                  </div>
                                </div>

                                {/* Prices */}
                                <div className='flex items-center justify-between pt-1.5 border-t border-slate-800/80'>
                                  <div className='flex items-baseline gap-1'>
                                    <span className='font-black text-xs sm:text-sm text-white tracking-tight'>
                                      {product.price}{' '}
                                      <span className='text-[8px] text-slate-400 font-semibold'>
                                        EGP
                                      </span>
                                    </span>

                                    {oldPrice && oldPrice > product.price && (
                                      <span className='text-[9px] text-slate-400/80 line-through font-light'>
                                        {oldPrice}{' '}
                                        <span className='text-[7px]'>EGP</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className='flex items-center gap-1'>
                                    <div
                                      className='scale-65 origin-center inline-block'
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ShareButton
                                        productId={product.id}
                                        productName={product.name}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Add to Cart */}
                            <div
                              className='p-2 sm:p-2.5 pt-0'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type='button'
                                onClick={(e) => addToCart(e, product)}
                                className='w-full py-1.5 sm:py-2 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer'
                              >
                                <ShoppingCart size={12} />
                                Add to Cart
                              </button>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}
      {/* ====================================== */}

      {/* 6. Professional Footer */}
      <footer className='bg-[#0a0f1d] border-t border-blue-500/20 pt-16 pb-12 mt-20 relative z-10 overflow-hidden'>
        {/* خلفية جمالية خفيفة تدي إضاءة مكس أحمر وأزرق في الـ Footer */}
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none'></div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-start relative z-10'>
          {/* العمود الأول: معلومات المتجر والشعار */}
          <div className='space-y-4'>
            <Link
              href='/'
              className='text-base font-black flex items-center gap-3 text-white group cursor-pointer'
            >
              {/* كونتينر الصورة بحجم أكبر وبوردر مكس بين الأحمر والأزرق */}
              <div className='w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-xl shadow-red-600/30 overflow-hidden flex items-center justify-center shrink-0'>
                <div className='w-full h-full bg-[#0e1626] rounded-[14px] overflow-hidden relative'>
                  <img
                    src='/we3.jpg'
                    alt='Abdo'
                    className='w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500'
                  />
                </div>
              </div>

              {/* اسم المتجر بتدرج مكس أحمر وأزرق واضح من البداية مع أنيميشن نبض */}
              <span className='text-lg sm:text-xl font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
                Abdo Store
              </span>
            </Link>

            <p className='text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm'>
              Your premier destination for high quality tech accessories,
              gadgets, and cyber equipment with fast cash on delivery service.
            </p>
          </div>

          {/* العمود الثاني: مميزات المتجر (بدون لينكات وبحجم صغير وجميل مع أنيميشن خفيف) */}
          <div>
            <h4 className='text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent'>
              <span className='w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-red-500 animate-pulse'></span>
              Store Highlights
            </h4>

            <ul className='space-y-2.5 text-xs sm:text-sm font-medium text-slate-300'>
              <li className='flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/15 via-purple-600/10 to-red-600/15 border border-blue-500/30 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base animate-pulse'>💎</span>
                <span className='bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent font-bold'>
                  Best Quality & Lowest Price
                </span>
              </li>

              <li className='flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600/15 via-purple-600/10 to-blue-600/15 border border-red-500/30 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base '>🚀</span>
                <span className='bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent font-bold'>
                  Fast & Affordable Delivery
                </span>
              </li>

              <li className='flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/15 via-purple-600/10 to-red-600/15 border border-blue-500/30 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base animate-pulse'>🎁</span>
                <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold'>
                  Weekly Special Discounts
                </span>
              </li>

              <li className='flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/15 via-blue-600/10 to-red-600/15 border border-purple-500/30 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base'>🛡️</span>
                <span className='bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent font-bold'>
                  Secure & Safe Shopping
                </span>
              </li>
            </ul>
          </div>

          {/* العمود الثالث: التواصل والدعم الفني عبر الواتساب */}
          <div>
            <h4 className='text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent'>
              <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span>
              Customer Support
            </h4>

            <p className='text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed'>
              Have any questions or need custom assistance? Reach out to us
              directly on WhatsApp anytime.
            </p>

            {/* زر واتساب تفاعلي وأيقونة مميزة */}
            <a
              href='https://wa.me/201016605189'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600/25 to-teal-600/25 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg shadow-emerald-950/40 group transform hover:scale-105'
            >
              <div className='w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform duration-300'>
                {/* WhatsApp SVG Icon */}
                <svg className='w-4 h-4 fill-current' viewBox='0 0 24 24'>
                  <path d='M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z' />
                </svg>
              </div>
              <span className='tracking-wide'>+20 101 660 5189</span>
            </a>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}

        {/* سطر حقوق الملكية وزر العودة للأعلى (Scroll to Top) */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-400 relative z-10'>
          <p>© 2026 Abdo Store. All rights reserved.</p>

          <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-0'>
            <span className='hover:text-white transition cursor-pointer'>
              Privacy Policy
            </span>
            <span className='hover:text-white transition cursor-pointer'>
              Terms of Service
            </span>

            {/* زر صعود للأعلى متحرك وشيك */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className='group flex items-center gap-2.5 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-red-600/30 hover:from-blue-600/40 hover:to-red-600/40 text-slate-100 px-4 py-2.5 rounded-2xl border border-blue-500/50 hover:border-red-500/60 shadow-lg shadow-blue-950/40 transition-all duration-300 cursor-pointer ml-2'
            >
              <span className='text-xs sm:text-sm font-bold tracking-wide bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent'>
                Back to top
              </span>
              {/* السهم الملون والمتحرك */}
              <span className='text-red-400 font-extrabold text-base transform transition-transform duration-300 group-hover:-translate-y-1 animate-bounce'>
                ↑
              </span>
            </button>
          </div>
        </div>
      </footer>
      {/* ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ */}

      {/* ------------------------------------------------------------------ */}
      {/* AUTH MODAL (تسجيل الدخول / إنشاء حساب) */}
      {/* ------------------------------------------------------------------ */}
      {isAuthModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 font-sans'>
          <div
            className='absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity'
            onClick={() => setIsAuthModalOpen(false)}
          />
          <div className='relative w-full max-w-md bg-[#0e1626]/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 z-10 animate-in fade-in zoom-in duration-300'>
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className='absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/80 border border-slate-800 transition'
            >
              <X size={18} />
            </button>

            {/* Header Info */}
            <div className='text-center space-y-2'>
              <div className='w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30'>
                <User className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-xl font-black text-white tracking-tight'>
                Welcome to Online Store
              </h3>
              <p className='text-xs text-slate-400 max-w-xs mx-auto leading-relaxed'>
                Sign in is optional! Logging in unlocks cloud sync for your cart
                & wishlist across all devices.
              </p>
            </div>

            {/* Google Login Option */}
            <button
              type='button'
              onClick={async () => {
                await supabase.auth.signInWithOAuth({ provider: 'google' });
              }}
              className='w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-2xl border border-slate-700 flex items-center justify-center gap-3 transition shadow-lg cursor-pointer hover:border-slate-600'
            >
              <svg className='w-4 h-4' viewBox='0 0 24 24'>
                <path
                  fill='#4285F4'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='#34A853'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='#FBBC05'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
                />
                <path
                  fill='#EA4335'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className='flex items-center gap-3 my-2'>
              <div className='h-[1px] bg-slate-800 flex-1' />
              <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>
                or email
              </span>
              <div className='h-[1px] bg-slate-800 flex-1' />
            </div>

            {/* Manual Login Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const email = target.email.value;
                const password = target.password.value;
                const { error } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                if (error) {
                  setToastMessage(`Auth Error: ${error.message}`);
                } else {
                  setIsAuthModalOpen(false);
                  checkUser();
                  setToastMessage('Successfully logged in!');
                }
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className='space-y-3'
            >
              <input
                name='email'
                type='email'
                required
                placeholder='Enter your email address'
                className='w-full px-4 py-3 bg-[#07090e] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
              />
              <input
                name='password'
                type='password'
                required
                placeholder='Enter your password'
                className='w-full px-4 py-3 bg-[#07090e] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
              />
              <button
                type='submit'
                className='w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/50 transition cursor-pointer'
              >
                Sign In / Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* WISHLIST DRAWER / MODAL (عرض منتجات المفضلة) */}
      {/* ------------------------------------------------------------------ */}
      {isWishlistModalOpen && (
        <div className='fixed inset-0 z-50 overflow-hidden font-sans'>
          <div
            className='absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity'
            onClick={() => setIsWishlistModalOpen(false)}
          />
          <div className='absolute inset-y-0 right-0 max-w-full flex pl-10'>
            <div className='w-screen max-w-md bg-[#0e1626] border-l border-slate-800 shadow-2xl flex flex-col'>
              <div className='flex items-center justify-between p-5 border-b border-slate-800'>
                <h2 className='text-base font-black text-white flex items-center gap-2.5'>
                  <Heart size={20} className='text-rose-500 fill-rose-500' />
                  <span>Saved Wishlist ({wishlist.length})</span>
                </h2>
                <button
                  onClick={() => setIsWishlistModalOpen(false)}
                  className='p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition'
                >
                  <X size={18} />
                </button>
              </div>

              <div className='flex-1 overflow-y-auto p-5 space-y-4'>
                {wishlist.length === 0 ? (
                  <div className='text-center py-24 text-slate-500 space-y-3'>
                    <Heart size={48} className='mx-auto text-slate-700' />
                    <p className='text-xs font-bold'>
                      Your wishlist is empty right now.
                    </p>
                  </div>
                ) : (
                  products
                    .filter((p) => wishlist.includes(p.id))
                    .map((item) => {
                      const itemImg =
                        item.image ||
                        item.images?.[0] ||
                        'https://via.placeholder.com/80';
                      return (
                        <div
                          key={`wish-item-${item.id}`}
                          className='flex items-center gap-4 bg-[#141d2f]/70 p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition'
                        >
                          <img
                            src={itemImg}
                            alt={item.name}
                            className='w-16 h-16 object-cover rounded-xl border border-slate-700 bg-slate-900'
                          />
                          <div className='flex-1 min-w-0'>
                            <Link
                              href={`/products/${item.id}`}
                              onClick={() => setIsWishlistModalOpen(false)}
                              className='font-bold text-xs text-slate-100 truncate block hover:text-blue-400 transition'
                            >
                              {item.name}
                            </Link>
                            <div className='text-xs font-black text-blue-400 mt-1'>
                              {item.price} EGP
                            </div>
                          </div>

                          <div className='flex items-center gap-1.5'>
                            <button
                              onClick={(e) => addToCart(e, item)}
                              className='p-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-500/30 transition'
                              title='Add to Cart'
                            >
                              <ShoppingCart size={15} />
                            </button>
                            <button
                              onClick={() => toggleWishlist(item)}
                              className='p-2.5 bg-red-950/40 text-red-400 hover:bg-red-900/40 rounded-xl border border-red-500/30 transition'
                              title='Remove from Wishlist'
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
