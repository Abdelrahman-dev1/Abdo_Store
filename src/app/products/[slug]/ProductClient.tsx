'use client';
import { notFound } from 'next/navigation'; // 1. تأكد من استيرادها فوق في الملف
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Check,
  X,
  Heart,
  Loader2,
  Package,
  ChevronLeft,
  Star,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import CustomerReviews from '@/components/CustomerReviews';
import ShareButton from '@/components/ShareButton';

export default function ProductClient({ slug }: { slug: string }) {
  const productIdentifier = slug;

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState('EGP');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // 1. الـ State الجديد بالاسم النظيف
  const [selectedImage, setSelectedImage] = useState('');

  // 2. الـ useEffect الآمن (بيشتغل مرة واحدة لما الproduct يحصله تحميل)
  useEffect(() => {
    if (product) {
      setSelectedImage(
        product.image ||
          product.images?.[0] ||
          'https://via.placeholder.com/400',
      );
    }
  }, [product]); // 👈 الـ [product] دي هي حزام الأمان اللي بيمنع أي لفة لا نهائية
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================

  // ==========================================
  // Control slider for Related Products
  // ==========================================

  const setRelatedSliderPauseState = (
    node: HTMLDivElement | null,
    paused: boolean,
    isManualToggle = false,
  ) => {
    if (!node) return;

    if (node.dataset.resumeTimer) {
      clearTimeout(Number(node.dataset.resumeTimer));
      node.dataset.resumeTimer = '';
    }

    if (isManualToggle) {
      node.dataset.manualPaused = paused ? 'true' : 'false';
    }

    node.dataset.isPaused = paused ? 'true' : 'false';
  };

  const handleRelatedTempPause = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const node = e.currentTarget;
    if (node.dataset.resumeTimer) {
      clearTimeout(Number(node.dataset.resumeTimer));
      node.dataset.resumeTimer = '';
    }
    node.dataset.isPaused = 'true';
  };

  const handleRelatedTempResume = (
    e: React.SyntheticEvent<HTMLDivElement>,
    delay = 0,
  ) => {
    const node = e.currentTarget;

    if (node.dataset.resumeTimer) {
      clearTimeout(Number(node.dataset.resumeTimer));
      node.dataset.resumeTimer = '';
    }

    if (node.dataset.manualPaused === 'true') {
      node.dataset.isPaused = 'true';
      return;
    }

    node.dataset.resumeTimer = String(
      window.setTimeout(() => {
        if (!node.isConnected) return;
        if (node.dataset.manualPaused === 'true') {
          node.dataset.isPaused = 'true';
          return;
        }
        node.dataset.isPaused = 'false';
      }, delay),
    );
  };
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================
  // ==============================

  useEffect(() => {
    if (productIdentifier) {
      fetchProductData(productIdentifier);
      fetchStoreSettings();
      updateCartCount();
    }
  }, [productIdentifier]);

  const updateCartCount = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = existingCart.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );
    setCartCount(totalItems);
  };

  const checkWishlistStatus = (productId: string) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const exists = wishlist.some((item: any) => item.id === productId);
    setIsWishlisted(exists);
  };

  const toggleWishlist = () => {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isWishlisted) {
      wishlist = wishlist.filter((item: any) => item.id !== product.id);
      setIsWishlisted(false);
    } else {
      wishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || product.images?.[0] || '',
      });
      setIsWishlisted(true);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  };

  const fetchStoreSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('store_currency')
      .limit(1)
      .maybeSingle();

    if (data?.store_currency) {
      setCurrency(data.store_currency);
    }
  };

  // ==============
  // ==============
  // ==============
  // ==============

  // ==============
  const fetchProductData = async (identifier: string) => {
    setLoading(true);

    // 2. فك تشفير الـ Slug للتعامل السليم مع الحروف العربية والمسافات في الرابط
    const cleanSlug = decodeURIComponent(identifier).trim();

    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle(); // استخدام آمن وناعم لا يسبب إيرورات مزعجة في الكونسول

    // لو حصل خطأ حقيقي في الاتصال بقاعدة البيانات
    if (error) {
      console.error('Supabase Error:', error.message);
    }

    // 3. لو المنتج غير موجود في الداتا بيز، يتم تحويله لصفحة 404 المخصصة فوراً
    if (!productData) {
      setLoading(false);
      return notFound();
    }

    setProduct(productData);
    checkWishlistStatus(productData.id);

    if (productData.category_id || productData.category) {
      const catField = productData.category_id ? 'category_id' : 'category';
      const catValue = productData.category_id || productData.category;

      const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .eq(catField, catValue)
        .neq('id', productData.id)
        .limit(4);

      if (relatedData) {
        setRelatedProducts(relatedData);
      }
    }

    fetchReviews(productData.id);
    setLoading(false);
  };
  // ==============
  // ==============
  // ==============
  // ==============
  // ==============
  // ==============
  // ==============
  // ==============

  const fetchReviews = async (productId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data);
    }
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex((item: any) => item.id === product.id);
    const productImage = product.image || product.images?.[0] || '';

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImage,
        quantity: quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <p className='text-xs font-medium'>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-4 text-slate-300 space-y-4 font-sans'>
        <Package size={48} className='text-slate-600' />
        <h1 className='text-xl font-bold text-white'>Product Not Found</h1>
        <Link
          href='/'
          className='px-6 py-3 bg-gradient-to-r from-red-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg'
        >
          Return to Store
        </Link>
      </div>
    );
  }

  const mainImage =
    product.image || product.images?.[0] || 'https://via.placeholder.com/400';

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
      {/* Background Glow Orbs */}
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* Image Zoom Modal */}
      {/* Image Zoom Modal */}
      {/* Image Zoom Modal */}
      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div className='fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4'>
          {/* زر الإغلاق */}
          <button
            type='button'
            onClick={() => setIsZoomOpen(false)}
            className='absolute top-5 left-5 text-white bg-slate-800/80 hover:bg-slate-700 p-3 rounded-2xl transition cursor-pointer border border-slate-700 z-20'
          >
            <X size={20} />
          </button>

          {/* حاوية الصورة المكبرة */}
          <div className='relative w-full h-full flex items-center justify-center p-2 sm:p-6'>
            <Image
              src={mainImage}
              alt={product.name || 'Product Image'}
              width={1200}
              height={1200}
              className='max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800'
              priority
            />
          </div>
        </div>
      )}
      {/* ======================================= */}
      {/* ======================================= */}
      {/* ======================================= */}
      {/* ======================================= */}
      {/* Navbar */}
      <nav className='fixed top-0 left-0 right-0 w-full z-50 bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between'>
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
            <div className='w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-xl shadow-red-600/30 overflow-hidden flex items-center justify-center'>
              <Image
                src='/fav-me-3.webp'
                alt='Abdo'
                width={400}
                height={400}
                className='w-full h-full object-cover object-[50%_5%] rounded-[10px] sm:rounded-[14px] transform group-hover:scale-110 transition-transform duration-500'
              />
            </div>

            <span className='text-sm sm:text-xl font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
              Abdo Store
            </span>
          </Link>

          <div className='flex items-center gap-3'>
            <Link
              href='/cart'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm relative'
            >
              <div className='relative flex items-center gap-2 group cursor-pointer'>
                <ShoppingCart
                  size={18}
                  className='text-red-500 group-hover:text-purple-400 transition-colors'
                />

                <span className='hidden sm:inline text-sm font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
                  Cart
                </span>

                {cartCount > 0 && (
                  <span className='absolute -top-3 -right-3 bg-gradient-to-r from-red-600 to-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md'>
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>

            <Link
              href='/'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <ArrowLeft size={16} />
              <span className='hidden sm:inline text-[10px] font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
                Storefront
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main className='max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 space-y-10 pt-28'>
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}

        <div className='bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-center'>
          {/* العمود الأول: صورة المنتج + المفضلة + مصغرات الصور */}
          {/* العمود الأول: صورة المنتج + المفضلة + مصغرات الصور */}
          <div className='space-y-2.5'>
            {/* Image_details  */}
            {/* Image_details  */}
            {/* Image_details  */}
            {/* Image_details  */}
            {/* Image_details  */}
            {/* Image_details  */}
            {/* Image_details  */}
            {/* Image_details  */}
            {/* Image_details */}
            <div className='relative aspect-square max-h-[360px] w-full mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-[#141d2f]/60 group flex items-center justify-center'>
              {mainImage ? (
                <div className='relative w-full h-full flex items-center justify-center'>
                  {/* 1. خلفية مموهة ناعمة لملء الفراغات الجانبية بدون تشويش */}
                  <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                    <Image
                      src={mainImage}
                      alt=''
                      fill
                      sizes='(max-width: 768px) 100vw, 360px'
                      className='w-full h-full object-cover filter blur-2xl opacity-40 scale-125'
                    />
                    <div className='absolute inset-0 bg-slate-950/40' />
                  </div>

                  {/* 2. الصورة الرئيسية: أصبحت ضخمة وبأقصى مساحة ممكنة بدون أي هوامش أو مساحات فارغة */}
                  <Image
                    // src={mainImage}
                    src={selectedImage} // 👈 دي لازم تكون selectedImage عشان تتغير لما تدوس تحت
                    alt={product.name || 'Product Image'}
                    width={900}
                    height={900}
                    className='relative z-10 w-full h-full object-contain p-0 group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl'
                  />

                  {/* طبقة تدرج خفيفة من الأسفل للجمال */}
                  <div className='absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none z-20' />
                </div>
              ) : (
                <div className='flex items-center justify-center h-full text-slate-600 text-xs font-medium'>
                  No Image Available
                </div>
              )}

              {/* شارة الخصم إن وُجدت */}
              {(Number(product.discount) > 0 ||
                (Number(product.compare_at_price ?? product.old_price) >
                  Number(product.price) &&
                  Number(product.price) > 0)) && (
                <span className='absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-rose-600/90 text-white shadow-md backdrop-blur-sm pointer-events-none z-30'>
                  {Number(product.discount) > 0
                    ? `-${Math.round(Number(product.discount))}%`
                    : `-${Math.round(
                        ((Number(
                          product.compare_at_price ?? product.old_price,
                        ) -
                          Number(product.price)) /
                          Number(
                            product.compare_at_price ?? product.old_price,
                          )) *
                          100,
                      )}%`}
                </span>
              )}

              {/* زر المفضلة */}
              <button
                type='button'
                onClick={toggleWishlist}
                className={`absolute top-2.5 right-2.5 p-2.5 rounded-xl backdrop-blur-md transition shadow-md cursor-pointer border z-30 ${
                  isWishlisted
                    ? 'bg-rose-950/80 text-rose-500 border-rose-500/40'
                    : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title='Add to Wishlist'
              >
                <Heart
                  size={16}
                  className={isWishlisted ? 'fill-rose-500' : ''}
                />
              </button>
            </div>
            {/* شريط مصغرات الصور الإضافية */}
            {/* شريط مصغرات الصور الإضافية */}
            {/* شريط مصغرات الصور الإضافية */}
            {/* شريط مصغرات الصور الإضافية */}
            {Array.isArray(product?.images) && product.images.length > 1 && (
              <div className='flex items-center justify-center gap-3 overflow-x-auto pb-2 mt-4'>
                {product.images
                  .filter(
                    (img): img is string =>
                      typeof img === 'string' && img.trim().length > 0,
                  )
                  .slice(0, 5)
                  .map((imgUrl, idx) => {
                    const isSelected = selectedImage === imgUrl;
                    return (
                      <div
                        key={`${imgUrl}-${idx}`}
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`w-16 h-16 rounded-2xl overflow-hidden transition-all duration-300 shrink-0 cursor-pointer shadow-md ${
                          isSelected
                            ? 'border-2 border-blue-500 ring-4 ring-blue-500/20 scale-105 opacity-100'
                            : 'border border-slate-700/80 opacity-70 hover:opacity-100 hover:border-slate-500 hover:scale-105'
                        }`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${product?.name || 'Product'} ${idx + 1}`}
                          width={128}
                          height={128}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    );
                  })}
              </div>
            )}
            {/* ============== */}
            {/* ============== */}
            {/* ============== */}
            {/* ============== */}
          </div>

          {/* العمود الثاني: بيانات الكارد + السعر + المشاركة + الإضافة للسلة */}
          <div className='space-y-3.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-[11px] font-bold px-3 py-1 bg-slate-800/90 text-slate-300 rounded-full border border-slate-700'>
                {(() => {
                  const matchedFromList =
                    typeof categories !== 'undefined' &&
                    Array.isArray(categories)
                      ? categories.find(
                          (c: { id?: string | number; name?: string }) =>
                            product.category_id &&
                            c?.id === product.category_id,
                        )?.name
                      : undefined;

                  return (
                    product.category ||
                    product.categories?.name ||
                    // product.categories?.id ||
                    matchedFromList ||
                    'Special ❤️'
                  );
                })()}
              </span>

              {typeof product.rating === 'number' && product.rating > 0 && (
                <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/30'>
                  <Star size={12} className='fill-amber-400 text-amber-400' />
                  {Number(product.rating).toFixed(1)}
                </span>
              )}

              {(() => {
                const stockCount =
                  typeof product.stock === 'number'
                    ? product.stock
                    : typeof product.stock_quantity === 'number'
                      ? product.stock_quantity
                      : null;

                if (stockCount === null) return null;

                return stockCount > 0 ? (
                  <span className='text-[11px] font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/30'>
                    In Stock ({stockCount})
                  </span>
                ) : (
                  <span className='text-[11px] font-semibold px-2.5 py-1 bg-rose-500/10 text-rose-300 rounded-full border border-rose-500/30'>
                    Out of Stock
                  </span>
                );
              })()}
            </div>

            <h1 className='text-xl sm:text-2xl font-black text-white tracking-tight leading-snug'>
              {product.name}
            </h1>

            <div className='flex flex-wrap items-baseline gap-2.5'>
              <span className='text-xl font-black text-white'>
                {product.price}{' '}
                <span className='text-xs text-slate-400 font-normal'>
                  {currency}
                </span>
              </span>

              {(product.compare_at_price || product.old_price) &&
                Number(product.compare_at_price ?? product.old_price) >
                  Number(product.price) && (
                  <span className='text-xs text-slate-500 line-through'>
                    {product.compare_at_price ?? product.old_price} {currency}
                  </span>
                )}
            </div>

            <p className='text-xs text-slate-400 leading-relaxed font-medium'>
              {product.description ||
                'High quality product designed specifically to meet your needs efficiently.'}
            </p>

            <div className='border-t border-b border-slate-800/90 py-3 space-y-2 text-xs text-slate-300 font-medium'>
              <div className='flex items-center gap-2.5'>
                <Truck size={15} className='text-blue-400 shrink-0' />
                <span>Fast delivery to all regions & cities</span>
              </div>
              <div className='flex items-center gap-2.5'>
                <ShieldCheck size={15} className='text-emerald-400 shrink-0' />
                <span>Quality guarantee & easy return policy</span>
              </div>
            </div>

            {/* صف التحكم: الكمية + زر الإضافة للسلة + زر المشاركة */}
            <div className='flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-0.5'>
              <div className='flex items-center bg-[#141d2f] border border-slate-700/80 rounded-xl overflow-hidden shrink-0'>
                <button
                  type='button'
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className='px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer'
                >
                  -
                </button>
                <span className='px-3.5 text-xs font-bold text-white'>
                  {quantity}
                </span>
                <button
                  type='button'
                  onClick={() => setQuantity(quantity + 1)}
                  className='px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer'
                >
                  +
                </button>
              </div>

              <button
                type='button'
                onClick={addToCart}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  added
                    ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-red-950/40'
                }`}
              >
                {added ? (
                  <>
                    <Check size={15} /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} /> Add to Cart
                  </>
                )}
              </button>

              <ShareButton
                productSlug={product.slug || product.id || ''}
                productName={product.name || ''}
                productPrice={product.price}
                compareAtPrice={product.compare_at_price ?? product.old_price}
                className='w-full sm:w-auto justify-center py-2.5 px-3 text-[11px] sm:text-xs shrink-0'
              />
            </div>
          </div>
        </div>
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}

        {relatedProducts.length > 0 && (
          <div className='space-y-3 pt-4 sm:pt-5 border-t border-slate-800/80'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xs sm:text-base font-black text-white tracking-tight'>
                Related Products You May Like 🛍️ ({relatedProducts.length})
              </h2>

              {/* أزرار التحكم في الشريط (السابق، التالي، إيقاف/تشغيل التلقائي) */}
              <div className='flex items-center gap-1.5'>
                {/* زر Pause/Play التلقائي */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById(
                      'related-slider-ref',
                    ) as HTMLDivElement | null;
                    if (!slider) return;
                    const currentlyPaused =
                      slider.dataset.manualPaused === 'true' ||
                      slider.dataset.isPaused === 'true';
                    setRelatedSliderPauseState(slider, !currentlyPaused, true);
                  }}
                  className='p-1.5 rounded-lg bg-[#0e1626]/90 border border-slate-700 text-slate-200 hover:text-white transition active:scale-95 cursor-pointer flex items-center justify-center'
                  title='Toggle Auto Scroll'
                >
                  {/* يمكنك وضع أيكونة Play أو Pause حسب الحالة، أو استخدام رمز تعبيري/أيكوناتك */}
                  <span className='text-[10px] font-bold text-blue-400'>
                    ⏸/▶
                  </span>
                </button>

                {/* زر السابق */}
                <button
                  type='button'
                  onClick={() => {
                    const slider =
                      document.getElementById('related-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    slider.scrollBy({ left: -220, behavior: 'smooth' });

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                        }
                      }, 1500),
                    );
                  }}
                  className='p-1.5 rounded-lg bg-[#0e1626]/90 border border-slate-700 text-slate-200 hover:text-white transition active:scale-95 cursor-pointer flex items-center justify-center'
                >
                  <ChevronLeft size={16} className='text-blue-400' />
                </button>

                {/* زر التالي */}
                <button
                  type='button'
                  onClick={() => {
                    const slider =
                      document.getElementById('related-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    slider.scrollBy({ left: 220, behavior: 'smooth' });

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                        }
                      }, 1500),
                    );
                  }}
                  className='p-1.5 rounded-lg bg-[#0e1626]/90 border border-slate-700 text-slate-200 hover:text-white transition active:scale-95 cursor-pointer flex items-center justify-center'
                >
                  <ChevronRight size={16} className='text-red-400' />
                </button>
              </div>
            </div>

            <div className='relative'>
              <div
                id='related-slider-ref'
                dir='ltr'
                onTouchStart={handleRelatedTempPause}
                onTouchEnd={(e) => handleRelatedTempResume(e, 0)}
                onTouchCancel={(e) => handleRelatedTempResume(e, 0)}
                onMouseEnter={handleRelatedTempPause}
                onMouseLeave={(e) => handleRelatedTempResume(e, 0)}
                ref={(node) => {
                  if (!node || node.dataset.initAuto === 'true') return;

                  node.dataset.initAuto = 'true';
                  node.dataset.isPaused = 'false';

                  let lastTime = 0;

                  const animate = (time: number) => {
                    if (!node.isConnected) return;

                    const delta = lastTime ? Math.min(time - lastTime, 40) : 0;

                    // التحرك التلقائي بسلاسة
                    if (node.dataset.isPaused !== 'true') {
                      node.scrollLeft += (30 * delta) / 1000; // سرعة هادئة ومناسبة للمنتجات المشابهة

                      // إرجاع الشريط للبداية بشكل لولبي ناعم لو وصل للنهاية
                      if (
                        node.scrollLeft >=
                        node.scrollWidth - node.clientWidth - 5
                      ) {
                        node.scrollLeft = 0;
                      }
                    }

                    lastTime = time;
                    requestAnimationFrame(animate);
                  };

                  requestAnimationFrame(animate);
                }}
                className='overflow-x-auto scrollbar-none py-2 px-0.5 touch-pan-x touch-pan-y overscroll-x-contain flex gap-3 select-none'
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {relatedProducts.map((item) => {
                  const itemImg =
                    item.image ||
                    item.images?.[0] ||
                    'https://via.placeholder.com/300';
                  return (
                    <Link
                      key={item.id}
                      href={`/products/${item.slug || item.id}`}
                      className='w-[140px] sm:w-[190px] shrink-0 bg-[#0e1626]/90 backdrop-blur-xl rounded-xl border border-slate-800 shadow-sm overflow-hidden hover:border-slate-700 transition duration-300 group flex flex-col justify-between cursor-pointer'
                    >
                      <div>
                        <div className='w-full h-28 sm:h-38 bg-slate-900 overflow-hidden relative border-b border-slate-800 group'>
                          <Image
                            src={itemImg}
                            alt={item.name || 'Store Item'}
                            width={600}
                            height={600}
                            className='w-full h-full object-contain object-center group-hover:scale-105 transition duration-500'
                          />
                        </div>
                        <div className='p-2.5 space-y-1'>
                          <h3 className='font-bold text-[11px] sm:text-xs text-slate-100 line-clamp-1 group-hover:text-blue-400 transition'>
                            {item.name}
                          </h3>
                          <span className='text-[11px] sm:text-sm font-black text-blue-400'>
                            {item.price} {currency || 'EGP'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}
        {/* ============================================== */}

        <CustomerReviews productId={product.id} />
      </main>
    </div>
  );
}
