'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Check,
  X,
  Heart,
  Loader2,
  ChevronRight,
  Package,
  Star,
  ChevronLeft,
  Pause,
  Play,
  ZoomIn,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import CustomerReviews from '@/components/CustomerReviews';
import dynamic from 'next/dynamic';

interface ToastState {
  id: number;
  message: string;
  type: 'cart' | 'wishlist' | 'quantity' | 'info';
}
// ===================================
// ===================================
// ===================================
// ===================================
// ===================================
// ===================================
function LazyMount({
  children,
  rootMargin = '180px 0px',
  className = '',
}: {
  children: React.ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount) return;

    const node = mountRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      const timer = window.setTimeout(() => {
        setShouldMount(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldMount]);

  return (
    <div ref={mountRef} className={className}>
      {shouldMount ? children : null}
    </div>
  );
}
// ===================================
// ===================================
// ===================================
// ===================================
// ===================================
// ===================================

const ShareButton = dynamic(() => import('@/components/ShareButton'), {
  ssr: false,
  loading: () => null,
});
// ===================================
// ===================================
// ===================================
// ===================================
// ===================================
// ===================================
// ===================================
export default function ProductClient({ slug }: { slug: string }) {
  const productIdentifier = slug;


  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState('EGP');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [detailWishlist, setDetailWishlist] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  // حالة الاسلايدر والـ Pagination
  const [relatedPage, setRelatedPage] = useState(1);
  const [isRelatedAutoPlay, setIsRelatedAutoPlay] = useState(true);
  const [isRelatedPausedByUser, setIsRelatedPausedByUser] = useState(false);
  const relatedTrackRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const RELATED_PER_PAGE = 5;
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  useEffect(() => {
    if (product?.slug) {
      localStorage.setItem('lastProductUrl', `/products/${product.slug}`);
    }
  }, [product?.slug]);
  // ==========================
  // ==========================
  useEffect(() => {
    if (!isWishlistModalOpen || detailWishlist.length === 0) return;

    const missingIds = detailWishlist
      .map((item: any) =>
        typeof item === 'object' && item !== null ? item.id : item,
      )
      .filter(Boolean);

    if (missingIds.length === 0) return;

    let active = true;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select(
          'id, slug, name, description, price, compare_at_price, old_price, image, images',
        )
        .in('id', missingIds);

      if (!active || !Array.isArray(data) || data.length === 0) return;

      const byId = new Map(data.map((p: any) => [String(p.id), p]));

      setDetailWishlist((prev) => {
        const cleanPrev = sanitizeWishlist(prev);
        let changed = false;
        const enriched = cleanPrev.map((item: any) => {
          const isObj = typeof item === 'object' && item !== null;
          const idKey = String(isObj ? (item.id ?? '') : item);
          const dbItem = byId.get(idKey);
          if (!dbItem) return item;

          const nextObj = {
            ...(isObj ? item : { id: item }),
            slug: (isObj && item.slug) || dbItem.slug,
            name: (isObj && item.name) || dbItem.name,
            description:
              (isObj && item.description) || dbItem.description || '',
            price:
              isObj && item.price !== undefined ? item.price : dbItem.price,
            compare_at_price:
              (isObj && item.compare_at_price) ??
              dbItem.compare_at_price ??
              dbItem.old_price ??
              null,
            old_price:
              (isObj && item.old_price) ??
              dbItem.old_price ??
              dbItem.compare_at_price ??
              null,
            image:
              (isObj && item.image) || dbItem.image || dbItem.images?.[0] || '',
            images:
              (isObj && Array.isArray(item.images) && item.images.length > 0
                ? item.images
                : dbItem.images) || [],
          };

          if (JSON.stringify(nextObj) !== JSON.stringify(item)) {
            changed = true;
          }
          return nextObj;
        });

        if (changed) {
          syncWishlistStorage(enriched);
          return enriched;
        }
        return prev;
      });
    })();

    return () => {
      active = false;
    };
  }, [isWishlistModalOpen]);
  // ==========================
  // ==========================
  // ==========================
  // ===============
  // ===========
  const handleRemoveWishlistItem = (targetItem: any, idx: number) => {
    const isObj = typeof targetItem === 'object' && targetItem !== null;
    const targetKey = String(
      isObj ? (targetItem.id ?? targetItem.slug ?? idx) : targetItem,
    );

    setDetailWishlist((prev) => {
      const cleanPrev = sanitizeWishlist(prev);
      const next = cleanPrev.filter((item: any, itemIdx: number) => {
        const itemIsObj = typeof item === 'object' && item !== null;
        const itemKey = String(
          itemIsObj ? (item.id ?? item.slug ?? itemIdx) : item,
        );
        return itemKey !== targetKey;
      });
      syncWishlistStorage(next);
      return next;
    });

    const itemName = isObj
      ? (targetItem.name ?? `Product #${targetKey}`)
      : `Product #${targetKey}`;
    showToast(`Removed "${itemName}" from Wishlist`, 'wishlist');
  };

  const handleAddWishlistItemToCart = (wishItem: any, idx: number) => {
    const isObj = typeof wishItem === 'object' && wishItem !== null;
    const wId = isObj ? (wishItem.id ?? wishItem.slug ?? idx) : wishItem;
    const wSlug = isObj ? (wishItem.slug ?? wishItem.id) : wishItem;
    const wName = isObj
      ? (wishItem.name ?? `Product #${wId}`)
      : `Product #${wId}`;
    const wPrice = Number(isObj ? (wishItem.price ?? 0) : 0);
    const wImg = isObj
      ? (wishItem.image ?? wishItem.images?.[0] ?? '/placeholder.png')
      : '/placeholder.png';

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(
      (c: any) =>
        String(c?.id) === String(wId) ||
        (wSlug && String(c?.slug) === String(wSlug)),
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity =
        (Number(cart[existingIndex].quantity) || 0) + 1;
      if (wSlug && !cart[existingIndex].slug) {
        cart[existingIndex].slug = wSlug;
      }
    } else {
      cart.push({
        id: wId,
        slug: wSlug,
        name: wName,
        price: wPrice,
        image: wImg,
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`Added "${wName}" to Cart 🛒`, 'cart');
  };
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  const manualAnimFrameRef = useRef<number | null>(null);
  const manualTargetRef = useRef<number | null>(null);
  // ==========================
  // ==========================
  // ==========================
  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'info') => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      const id = Date.now();
      setToast({ id, message, type });
      toastTimerRef.current = window.setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 2400);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (product) {
      setSelectedImage(
        product.image ||
          product.images?.[0] ||
          'https://via.placeholder.com/400',
      );
      setQuantity(1);
      setRelatedPage(1);
    }
  }, [product]);

  // تنظيف أي عناصر فاسدة أو قديمة من قائمة المفضلة
  const sanitizeWishlist = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    return list.filter(
      (item) =>
        item !== null &&
        item !== undefined &&
        (typeof item === 'string' ||
          item.id !== undefined ||
          item.slug !== undefined),
    );
  };

  const targetProductId = String(product?.id ?? product?.slug ?? '');

  useEffect(() => {
    const syncWishlistFromStorage = () => {
      try {
        const raw =
          localStorage.getItem('wishlist') ||
          localStorage.getItem('abdo_store_wishlist_v1') ||
          '[]';
        const parsed = JSON.parse(raw);
        setDetailWishlist(sanitizeWishlist(parsed));
      } catch {
        setDetailWishlist([]);
      }
    };

    syncWishlistFromStorage();
    window.addEventListener('storage', syncWishlistFromStorage);
    window.addEventListener('wishlistUpdated', syncWishlistFromStorage);
    return () => {
      window.removeEventListener('storage', syncWishlistFromStorage);
      window.removeEventListener('wishlistUpdated', syncWishlistFromStorage);
    };
  }, []);

  const clearStaleWishlist = () => {
    try {
      localStorage.removeItem('wishlist');
      localStorage.removeItem('abdo_store_wishlist_v1');
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error('Failed to clear wishlist storage:', err);
    }
    setDetailWishlist([]);
    showToast('Wishlist cleared', 'wishlist');
  };

  const isWishlisted = Boolean(
    targetProductId &&
    detailWishlist.some((item: any) => {
      const itemId = String(
        typeof item === 'string' ? item : (item?.id ?? item?.slug ?? ''),
      );
      return itemId === targetProductId;
    }),
  );

  const isDetailLiked = isWishlisted;

  const syncWishlistStorage = (nextList: any[]) => {
    try {
      const serialized = JSON.stringify(nextList);
      localStorage.setItem('wishlist', serialized);
      localStorage.setItem('abdo_store_wishlist_v1', serialized);
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error('Error saving wishlist:', err);
    }
  };

  const getCategoryLabel = (item: any) => {
    if (!item) return 'Special ❤️';

    if (typeof item.category === 'string' && item.category.trim()) {
      return item.category.trim();
    }
    if (typeof item.category === 'object' && item.category?.name) {
      return String(item.category.name).trim();
    }

    if (typeof item.category_name === 'string' && item.category_name.trim()) {
      return item.category_name.trim();
    }
    if (typeof item.categoryName === 'string' && item.categoryName.trim()) {
      return item.categoryName.trim();
    }

    if (typeof item.categories === 'string' && item.categories.trim()) {
      return item.categories.trim();
    }
    if (item.categories?.name) {
      return String(item.categories.name).trim();
    }

    const targetCatId =
      item.category_id ?? item.categories?.id ?? item.category;
    if (targetCatId && Array.isArray(categories)) {
      const matchedCat = categories.find(
        (c: any) => String(c?.id) === String(targetCatId),
      );
      if (matchedCat?.name) {
        return String(matchedCat.name).trim();
      }
    }

    return 'Special ❤️';
  };

  const toggleWishlist = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!product || !targetProductId) return;

    setDetailWishlist((prev) => {
      const cleanPrev = sanitizeWishlist(prev);
      const exists = cleanPrev.some((item: any) => {
        const itemId = String(
          typeof item === 'string' ? item : (item?.id ?? item?.slug ?? ''),
        );
        return itemId === targetProductId;
      });

      const next = exists
        ? cleanPrev.filter((item: any) => {
            const itemId = String(
              typeof item === 'string' ? item : (item?.id ?? item?.slug ?? ''),
            );
            return itemId !== targetProductId;
          })
        : [
            ...cleanPrev,
            {
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              images: Array.isArray(product.images)
                ? product.images
                : product.image
                  ? [product.image]
                  : [],
              image:
                product.image ||
                (Array.isArray(product.images) ? product.images[0] : ''),
            },
          ];

      syncWishlistStorage(next);
      showToast(
        exists
          ? `Removed "${product.name}" from Wishlist`
          : `Added "${product.name}" to Wishlist ❤️`,
        'wishlist',
      );
      return next;
    });
  };

  useEffect(() => {
    if (productIdentifier) {
      fetchProductData(productIdentifier);
      fetchStoreSettings();
      updateCartCount();
    }
  }, [productIdentifier]);

  const updateCartCount = () => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(existingCart)) {
        setCartCount(0);
        return;
      }
      const totalItems = existingCart.reduce(
        (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
        0,
      );
      setCartCount(totalItems);
    } catch {
      setCartCount(0);
    }
  };

  const fetchStoreSettings = async () => {
    const [{ data: settingsData }, { data: categoriesData }] =
      await Promise.all([
        supabase
          .from('settings')
          .select('store_currency')
          .limit(1)
          .maybeSingle(),
        supabase.from('categories').select('*'),
      ]);

    if (settingsData?.store_currency) {
      setCurrency(settingsData.store_currency);
    }

    if (Array.isArray(categoriesData)) {
      setCategories(categoriesData);
    }
  };

  const fetchProductData = async (identifier: string) => {
    setLoading(true);

    const cleanSlug = decodeURIComponent(identifier).trim();

    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (error) {
      console.error('Supabase Error:', error.message);
    }

    if (!productData) {
      setLoading(false);
      return notFound();
    }

    setProduct(productData);

    if (productData.category_id || productData.category) {
      const catField = productData.category_id ? 'category_id' : 'category';
      const catValue = productData.category_id || productData.category;

      const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .eq(catField, catValue)
        .neq('id', productData.id)
        .limit(15);

      if (relatedData) {
        setRelatedProducts(relatedData);
      }
    }

    fetchReviews(productData.id);
    setLoading(false);
  };

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

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => {
      const next = Math.max(1, prev - 1);
      showToast(
        next === prev
          ? 'Minimum quantity is 1 item'
          : `Quantity updated to ${next}`,
        'quantity',
      );
      return next;
    });
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => {
      const next = prev + 1;
      showToast(`Quantity updated to ${next}`, 'quantity');
      return next;
    });
  };

const addToCart = () => {
  if (!product) return;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const existingIndex = cart.findIndex((item: any) => item.id === product.id);
  const productImage =
    product.image || product.images?.[0] || product.image_url || '';

  const fullProductData = {
    ...product, // يمرر كل خصائص المنتج كاملة (description, oldPrice, details, slug, etc.)
    id: product.id,
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice || product.original_price || null,
    image: productImage,
    description:
      product.description || product.details || product.short_description || '',
  };

  if (existingIndex > -1) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      ...fullProductData, // يحدّث البيانات لو المنتج متخزن قبل كده من غير تفاصيل
      quantity: (Number(cart[existingIndex].quantity) || 0) + quantity,
    };
  } else {
    cart.push({
      ...fullProductData,
      quantity,
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  setAdded(true);
  showToast(`Added ${quantity} × "${product.name}" to Cart 🛒`, 'cart');
  setTimeout(() => setAdded(false), 2000);
};

  // حسابات الـ Pagination للاسلايدر (حد أقصى 5 كروت في الصفحة) + لف ما لا نهاية عند وجود 3 منتجات أو أكثر
  const canLoopRelated = relatedProducts.length >= 4;

  const totalPages = Math.max(
    1,
    Math.ceil(relatedProducts.length / RELATED_PER_PAGE),
  );
  const safePage = Math.min(Math.max(1, relatedPage), totalPages);
  const startIndex = (safePage - 1) * RELATED_PER_PAGE;
  const baseRelatedItems = relatedProducts.slice(
    startIndex,
    startIndex + RELATED_PER_PAGE,
  );
  const visibleRelated = canLoopRelated
    ? [...baseRelatedItems, ...baseRelatedItems]
    : baseRelatedItems;

  const goToRelatedPage = useCallback(
    (pageNum: number) => {
      const clamped = Math.min(Math.max(1, pageNum), totalPages);
      manualTargetRef.current = null;
      setRelatedPage(clamped);
      if (relatedTrackRef.current) {
        relatedTrackRef.current.scrollTo({
          left: 0,
          behavior: 'smooth',
        });
      }
    },
    [totalPages],
  );

  const stepRelatedSlider = useCallback(
    (dir: 'prev' | 'next') => {
      const el = relatedTrackRef.current;
      if (!el) return;

      const stepAmount = 210;

      if (manualAnimFrameRef.current) {
        window.cancelAnimationFrame(manualAnimFrameRef.current);
        manualAnimFrameRef.current = null;
      }

      if (!canLoopRelated) {
        const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
        const targetLeft =
          dir === 'next'
            ? Math.min(maxScrollLeft, el.scrollLeft + stepAmount)
            : Math.max(0, el.scrollLeft - stepAmount);

        el.scrollTo({
          left: targetLeft,
          behavior: 'smooth',
        });
        return;
      }

      const halfWidth = el.scrollWidth / 2;
      if (halfWidth <= 2) return;

      const currentStart =
        manualTargetRef.current !== null
          ? manualTargetRef.current
          : el.scrollLeft;
      const desiredTarget =
        dir === 'next' ? currentStart + stepAmount : currentStart - stepAmount;
      manualTargetRef.current = desiredTarget;

      let prevTime = performance.now();
      const easeSpeed = 420;

      const animateStep = (now: number) => {
        const currentEl = relatedTrackRef.current;
        if (!currentEl || manualTargetRef.current === null) {
          manualAnimFrameRef.current = null;
          return;
        }

        const dt = Math.min((now - prevTime) / 1000, 0.05);
        prevTime = now;

        const diff = manualTargetRef.current - currentEl.scrollLeft;
        if (Math.abs(diff) < 0.6) {
          let finalLeft = manualTargetRef.current;
          if (finalLeft >= halfWidth) finalLeft %= halfWidth;
          if (finalLeft < 0)
            finalLeft = ((finalLeft % halfWidth) + halfWidth) % halfWidth;
          currentEl.scrollLeft = finalLeft;
          manualTargetRef.current = null;
          manualAnimFrameRef.current = null;
          return;
        }

        const moveBy =
          Math.sign(diff) *
          Math.min(
            Math.abs(diff),
            Math.max(
              95 * dt,
              Math.abs(diff) * Math.min(1, 7.5 * dt) || easeSpeed * dt,
            ),
          );

        let nextLeft = currentEl.scrollLeft + moveBy;
        if (nextLeft >= halfWidth) {
          nextLeft %= halfWidth;
          manualTargetRef.current -= halfWidth;
        } else if (nextLeft < 0) {
          nextLeft = ((nextLeft % halfWidth) + halfWidth) % halfWidth;
          manualTargetRef.current += halfWidth;
        }

        currentEl.scrollLeft = nextLeft;
        manualAnimFrameRef.current = window.requestAnimationFrame(animateStep);
      };

      manualAnimFrameRef.current = window.requestAnimationFrame(animateStep);
    },
    [canLoopRelated],
  );

  // حركة تلقائية ناعمة وهادئة ومستمرة لف لا نهائي (فقط عند وجود 3 منتجات أو أكثر)
  useEffect(() => {
    if (!canLoopRelated || !isRelatedAutoPlay || isRelatedPausedByUser) {
      return;
    }

    let frameId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const pixelsPerSecond = 25; // سرعة هادية ومريحة للعين

    const animate = (now: number) => {
      const deltaSec = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const el = relatedTrackRef.current;
      if (el && manualTargetRef.current === null) {
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 2) {
          accumulator += pixelsPerSecond * deltaSec;
          const stepPx = Math.floor(accumulator);

          if (stepPx >= 1) {
            accumulator -= stepPx;
            const nextScrollLeft = el.scrollLeft + stepPx;
            el.scrollLeft =
              nextScrollLeft >= halfWidth
                ? nextScrollLeft - halfWidth
                : nextScrollLeft;
          }
        }
      }

      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (manualAnimFrameRef.current) {
        window.cancelAnimationFrame(manualAnimFrameRef.current);
        manualAnimFrameRef.current = null;
      }
    };
  }, [canLoopRelated, isRelatedAutoPlay, isRelatedPausedByUser, safePage]);

  const toggleRelatedPlayPause = () => {
    if (!canLoopRelated) return;
    if (isRelatedPausedByUser || !isRelatedAutoPlay) {
      setIsRelatedPausedByUser(false);
      setIsRelatedAutoPlay(true);
    } else {
      setIsRelatedPausedByUser(true);
      setIsRelatedAutoPlay(false);
    }
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
    selectedImage ||
    product.image ||
    product.images?.[0] ||
    'https://via.placeholder.com/400';

  const originalPrice = Number(
    product.compare_at_price ?? product.old_price ?? 0,
  );
  const currentPrice = Number(product.price ?? 0);
  const hasMainDiscount =
    Number(product.discount) > 0 ||
    (originalPrice > currentPrice && currentPrice > 0);
  const mainDiscountPercent =
    Number(product.discount) > 0
      ? Math.round(Number(product.discount))
      : hasMainDiscount
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-20 font-sans relative selection:bg-red-500 selection:text-white'>
      {/* Background Glow Orbs */}
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* مودال تكبير الصورة (Zoom Modal) — زر الخروج واضح تحت النافبار */}
      {/* {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className='fixed inset-0 bg-black/92 backdrop-blur-md z-[60] flex flex-col pt-24 pb-6 px-4 sm:px-6'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='w-full max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3 mb-3 shrink-0 z-30'
          >
            <span className='text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-800 truncate max-w-[60%] sm:max-w-[70%]'>
              {product.name}
            </span>

            <button
              type='button'
              onClick={() => setIsZoomOpen(false)}
              className='inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/50 border border-rose-400/30 transition cursor-pointer shrink-0 active:scale-95'
              aria-label='Close zoom view'
            >
              <X size={16} />
              <span>Exit Zoom</span>
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className='relative flex-1 w-full max-w-5xl mx-auto flex items-center justify-center rounded-2xl overflow-hidden bg-[#0b111e]/90 border border-slate-800/90 p-3 sm:p-6'
          >
            <Image
              src={mainImage}
              alt={product.name || 'Product Image'}
              width={600}
              height={600}
              className='max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl select-none transition-transform duration-300'
            />
          </div>
        </div>
      )} */}

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
            {/* =================== */}
            {/* =================== */}
            {/* =================== */}

            <button
              type='button'
              onClick={() => setIsWishlistModalOpen(true)}
              title='Wishlist'
              aria-label='Open Wishlist'
              className='relative inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-b from-slate-800/75 to-[#090f19]/90 hover:from-slate-800 hover:to-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 tabular-nums transition cursor-pointer shadow-sm active:scale-95'
            >
              <Heart className='w-3.5 h-3.5 sm:w-[17px] sm:h-[17px] text-rose-500 fill-rose-500 transition-transform duration-200 hover:scale-110' />
              {detailWishlist.length > 0 && (
                <span className='absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-rose-600 text-white text-[7px] sm:text-[8px] font-black min-w-[12px] h-[12px] sm:min-w-[14px] sm:h-[14px] px-0.5 rounded-full flex items-center justify-center shadow-sm ring-1 sm:ring-2 ring-[#07090e] leading-none'>
                  {detailWishlist.length}
                </span>
              )}
            </button>

            {/* =================== */}
            {/* =================== */}
            {/* =================== */}
            {/* =================== */}

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
        <div className='bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-center'>
          {/* العمود الأول: صورة المنتج + المفضلة + مصغرات الصور */}
          <div className='space-y-2.5'>
            <div className='relative aspect-square max-h-[360px] w-full mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-[#141d2f]/60 group flex items-center justify-center'>
              {mainImage ? (
                <button
                  type='button'
                  onClick={() => setIsZoomOpen(true)}
                  aria-label='Zoom product image'
                  className='relative w-full h-full flex items-center justify-center cursor-zoom-in focus:outline-none'
                >
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

                  <Image
                    key={mainImage}
                    src={mainImage}
                    width={600}
                    height={600}
                    alt={product.name || 'Product Image'}
                    className='relative z-10 w-full h-full object-contain p-0 group-hover:scale-105 transition-all duration-500 drop-shadow-2xl animate-in fade-in zoom-in-95'
                  />

                  <div className='absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none z-20' />

                  {/* <span className='absolute bottom-2.5 right-2.5 z-30 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/75 text-slate-200 border border-slate-700/70 text-[10px] font-bold backdrop-blur-sm opacity-85 group-hover:opacity-100 transition'>
                    <ZoomIn size={12} className='text-cyan-300' />
                    <span>Zoom</span>
                  </span> */}
                </button>
              ) : (
                <div className='flex items-center justify-center h-full text-slate-600 text-xs font-medium'>
                  No Image Available
                </div>
              )}

              {hasMainDiscount && mainDiscountPercent > 0 && (
                <span className='absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-rose-600/90 text-white shadow-md backdrop-blur-sm pointer-events-none z-30'>
                  -{mainDiscountPercent}%
                </span>
              )}

              {/* زر المفضلة داخل صورة تفاصيل المنتج */}
              <button
                type='button'
                onClick={toggleWishlist}
                className={`absolute top-2.5 right-2.5 p-2.5 rounded-xl backdrop-blur-md transition-all duration-200 shadow-md cursor-pointer border z-30 active:scale-90 ${
                  isWishlisted
                    ? 'bg-rose-950/85 text-rose-500 border-rose-500/40 scale-105'
                    : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title={
                  isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'
                }
              >
                <Heart
                  size={16}
                  className={
                    isWishlisted ? 'fill-rose-500 transition-transform' : ''
                  }
                />
              </button>
            </div>

            {/* الصور المصغرة لتبديل الصورة الكبيرة بأنيميشن */}
            {Array.isArray(product?.images) && product.images.length > 1 && (
              <div className='flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto px-1 pt-2 pb-2 mt-3'>
                {product.images
                  .filter(
                    (img): img is string =>
                      typeof img === 'string' && img.trim().length > 0,
                  )
                  .map((imgUrl, idx) => {
                    const isSelected = mainImage === imgUrl;
                    return (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type='button'
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#141d2f] transition-all duration-300 shrink-0 cursor-pointer active:scale-90 ${
                          isSelected
                            ? 'border-2 border-blue-500 ring-2 ring-blue-500/30 -translate-y-1 opacity-100 shadow-lg shadow-blue-950/40 scale-105'
                            : 'border border-slate-800/90 opacity-65 hover:opacity-100 hover:border-slate-600 hover:-translate-y-0.5'
                        }`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${product?.name || 'Product'} ${idx + 1}`}
                          width={128}
                          height={128}
                          className='w-full h-full object-cover'
                        />
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* العمود الثاني: بيانات الكارد + السعر والمشاركة + الإضافة للسلة */}
          <div className='space-y-3.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-[11px] font-bold px-3 py-1 bg-slate-800/90 text-slate-300 rounded-full border border-slate-700'>
                {getCategoryLabel(product)}
              </span>

              {typeof product.rating === 'number' && product.rating > 0 && (
                <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/30'>
                  <Star size={12} className='fill-amber-400 text-amber-400' />
                  {Number(product.rating).toFixed(1)}
                </span>
              )}

              {!product.hide_stock_on_front &&
                (() => {
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

            <h1 className='text-lg sm:text-2xl font-black text-white tracking-tight leading-snug'>
              {product.name}
            </h1>

            {/* السعر + زر المشاركة في نفس السطر بشكل متجاوب */}
            <div className='flex items-center justify-between gap-3 pt-0.5'>
              <div className='flex flex-wrap items-baseline gap-2.5 min-w-0'>
                <span className='text-xl sm:text-2xl font-black text-cyan-300'>
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

              <div className='shrink-0 scale-90 sm:scale-100 origin-right [&>button]:!w-auto'>
                <LazyMount
                  rootMargin='180px 0px'
                  className='min-h-8 min-w-12 inline-flex items-center justify-center'
                >
                  <ShareButton
                    productSlug={product.slug}
                    productName={product.name}
                    productPrice={product.price}
                    compareAtPrice={product.compare_at_price}
                  />
                </LazyMount>
              </div>
            </div>

            <p className='text-xs text-slate-400 leading-relaxed font-medium'>
              {product.description ||
                'High quality product designed specifically to meet your needs efficiently.'}
            </p>

            <div className='border-t border-b border-slate-800/90 py-3 space-y-2 text-xs text-slate-300 font-medium'>
              <div className='flex items-center gap-2.5'>
                <Truck size={15} className='text-blue-400 shrink-0' />
                <span>توصيل سريع لباب بيتك في كل المحافظات</span>
              </div>
              <div className='flex items-center gap-2.5'>
                <ShieldCheck size={15} className='text-emerald-400 shrink-0' />
                <span>اعلي كواليتي وافضل سعر بفضل الله</span>
              </div>
            </div>

            {/* صف التحكم: الكمية + زر الإضافة للسلة */}
            <div className='flex items-center gap-2.5 pt-0.5'>
              <div className='flex items-center bg-[#141d2f] border border-slate-700/80 rounded-xl overflow-hidden shrink-0'>
                <button
                  type='button'
                  onClick={handleDecreaseQuantity}
                  className='px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-90 transition cursor-pointer'
                >
                  -
                </button>
                <span
                  key={quantity}
                  className='px-3.5 text-xs font-black text-white animate-in zoom-in-95 duration-150'
                >
                  {quantity}
                </span>
                <button
                  type='button'
                  onClick={handleIncreaseQuantity}
                  className='px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-90 transition cursor-pointer'
                >
                  +
                </button>
              </div>

              <button
                type='button'
                onClick={addToCart}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 ${
                  added
                    ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-red-950/40'
                }`}
              >
                {added ? (
                  <>
                    <Check size={16} />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}

        {/* المنتجات المشابهة — اسلايدر + Pagination كل 5 منتجات + رقم المنتج */}
        {relatedProducts.length > 0 && (
          <section className='space-y-3'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-2.5'>
              {/* العنوان + البادجات */}
              <div className='flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0'>
                <h2 className='text-xs sm:text-sm font-extrabold text-white shrink-0'>
                  Related Products
                </h2>
                <span className='text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 tabular-nums'>
                  Total: {relatedProducts.length}
                </span>
                <span className='text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tabular-nums'>
                  In Slider: {baseRelatedItems.length}
                </span>
                {totalPages > 1 && (
                  <span className='text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 tabular-nums'>
                    Page {safePage}/{totalPages}
                  </span>
                )}
              </div>

              {/* الـ Pagination + أزرار التحكم (كلهم فوق الاسلايدر) */}
              <div className='flex items-center justify-between sm:justify-end gap-2 flex-wrap'>
                {totalPages > 1 && (
                  <div className='flex items-center gap-1.5'>
                    <button
                      type='button'
                      onClick={() => goToRelatedPage(safePage - 1)}
                      disabled={safePage === 1}
                      className='h-7 px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-[10.5px] font-bold bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-400/50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer active:scale-95'
                    >
                      Prev
                    </button>

                    <div className='flex items-center gap-1 px-1.5 py-0.5 rounded-xl bg-[#0b111e]/90 border border-slate-800/90'>
                      {Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;
                        const isActive = pageNumber === safePage;
                        return (
                          <button
                            key={pageNumber}
                            type='button'
                            onClick={() => goToRelatedPage(pageNumber)}
                            className={`min-w-[22px] sm:min-w-[24px] h-6 px-1.5 sm:px-2 rounded-lg text-[10px] sm:text-[10.5px] font-extrabold transition-all duration-200 cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-rose-600 via-fuchsia-600 to-cyan-500 text-white shadow-md shadow-cyan-950/50 scale-105'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type='button'
                      onClick={() => goToRelatedPage(safePage + 1)}
                      disabled={safePage === totalPages}
                      className='h-7 px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-[10.5px] font-bold bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-400/50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer active:scale-95'
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* أزرار الإيقاف/الاستئناف + تحريك الاسلايدر */}
                <div className='flex items-center gap-1.5 shrink-0'>
                  <button
                    type='button'
                    onClick={toggleRelatedPlayPause}
                    aria-label={
                      isRelatedAutoPlay && !isRelatedPausedByUser
                        ? 'Pause slider auto movement'
                        : 'Resume slider auto movement'
                    }
                    title={
                      isRelatedAutoPlay && !isRelatedPausedByUser
                        ? 'Pause'
                        : 'Play'
                    }
                    className={`h-7 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                      isRelatedAutoPlay && !isRelatedPausedByUser
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/35 text-emerald-300'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-300'
                    }`}
                  >
                    {isRelatedAutoPlay && !isRelatedPausedByUser ? (
                      <>
                        <Pause size={12} />
                        <span className='hidden sm:inline'>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} />
                        <span className='hidden sm:inline'>Play</span>
                      </>
                    )}
                  </button>

                  <button
                    type='button'
                    onClick={() => stepRelatedSlider('prev')}
                    aria-label='Scroll slider left'
                    className='w-7 h-7 rounded-lg bg-[#0e1626] hover:bg-[#162238] border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95'
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={() => stepRelatedSlider('next')}
                    aria-label='Scroll slider right'
                    className='w-7 h-7 rounded-lg bg-[#0e1626] hover:bg-[#162238] border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95'
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* مسار الاسلايدر مع إيقاف عند الهوفر أو التاتش واستئناف عند الخروج */}
            <div
              ref={relatedTrackRef}
              onMouseEnter={() => {
                setIsRelatedPausedByUser(true);
                setIsRelatedAutoPlay(false);
              }}
              onMouseLeave={() => {
                // يظل متوقفاً حتى الضغط على زر الاستئناف
              }}
              onTouchStart={() => {
                setIsRelatedPausedByUser(true);
                setIsRelatedAutoPlay(false);
              }}
              onTouchEnd={() => {
                // يظل متوقفاً حتى الضغط على زر الاستئناف
              }}
              className='flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            >
              {visibleRelated.map((item, idx) => {
                const itemImg =
                  item.image ||
                  item.images?.[0] ||
                  'https://via.placeholder.com/300';

                const relOriginal = Number(
                  item.compare_at_price ?? item.old_price ?? 0,
                );
                const relCurrent = Number(item.price ?? 0);
                const hasDiscount =
                  Number(item.discount) > 0 ||
                  (relOriginal > relCurrent && relCurrent > 0);
                const discountPercent =
                  Number(item.discount) > 0
                    ? Math.round(Number(item.discount))
                    : hasDiscount
                      ? Math.round(
                          ((relOriginal - relCurrent) / relOriginal) * 100,
                        )
                      : 0;

                const stockCount =
                  typeof item.stock === 'number'
                    ? item.stock
                    : typeof item.stock_quantity === 'number'
                      ? item.stock_quantity
                      : null;

                const ratingValue = Number(item.rating ?? 0);
                const productDesc =
                  item.description?.trim() ||
                  'Great quality match for your current selection.';

                const sliderNumber =
                  startIndex +
                  (canLoopRelated ? idx % baseRelatedItems.length : idx) +
                  1;
                return (
                  <Link
                    key={`${item.id}-${idx}`}
                    href={`/products/${item.slug || item.id}`}
                    className='group snap-start shrink-0 w-[165px] sm:w-[195px] md:w-[210px] flex flex-col justify-between rounded-xl bg-[#0e1626]/90 border border-slate-800/80 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-950/20 p-2 transition-all duration-300'
                  >
                    <div>
                      {/* حاوية الصورة + البادجات + رقم المنتج */}
                      <div className='relative aspect-square rounded-lg overflow-hidden bg-[#141d2f] mb-2 border border-slate-800/70'>
                        <Image
                          src={itemImg}
                          alt={item.name || 'Related Product'}
                          width={300}
                          height={300}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                        />

                        {/* بادج منتج مشابه أعلى اليمين */}
                        <span className='absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white border border-blue-400/30 shadow backdrop-blur-md'>
                          Similar ⚡
                        </span>

                        {/* بادج الخصم أعلى اليسار إن وُجد */}
                        {hasDiscount && discountPercent > 0 && (
                          <span className='absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-600/90 text-white shadow backdrop-blur-sm'>
                            -{discountPercent}%
                          </span>
                        )}

                        {/* شارة التقييم بالنجوم أسفل اليسار */}
                        {ratingValue > 0 && (
                          <div className='absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-amber-500/30 backdrop-blur-md text-[9.5px] font-bold text-amber-300'>
                            <Star
                              size={9}
                              className='fill-amber-400 text-amber-400'
                            />
                            <span>{ratingValue.toFixed(1)}</span>
                          </div>
                        )}

                        {/* استيكر بادج صغير برقم المنتج في الاسلايدر أسفل اليمين */}
                        <span
                          title={`Item #${sliderNumber} in slider`}
                          className='absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9.5px] font-black bg-cyan-950/85 text-white border border-cyan-300/50 backdrop-blur-md shadow-md'
                        >
                          #{sliderNumber}
                        </span>
                      </div>

                      {/* اسم المنتج + الاستوك في نفس السطر */}
                      <div className='flex items-center justify-between gap-1.5'>
                        <p className='text-[11.5px] font-extrabold text-slate-100 truncate group-hover:text-blue-300 transition-colors'>
                          {item.name}
                        </p>

                        {!product.hide_stock_on_front &&
                          stockCount !== null &&
                          (stockCount > 0 ? (
                            <span className='shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'>
                              In Stock ({stockCount})
                            </span>
                          ) : (
                            <span className='shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/25'>
                              Out
                            </span>
                          ))}
                      </div>

                      {/* وصف المنتج أو الجملة الافتراضية بدون قص */}
                      <p className='mt-1 text-[10px] leading-snug text-slate-400 whitespace-normal break-words'>
                        {productDesc}
                      </p>
                    </div>

                    {/* السعر قبل وبعد الخصم */}
                    <div className='mt-2 pt-1.5 border-t border-slate-800/70 flex flex-wrap items-baseline gap-1.5'>
                      <span className='text-[11.5px] font-black text-cyan-300'>
                        {relCurrent} {currency}
                      </span>

                      {relOriginal > relCurrent && (
                        <span className='text-[9.5px] text-slate-500 line-through'>
                          {relOriginal} {currency}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* شريط Pagination ملون وجذاب يظهر فقط عندما يزيد العدد عن 5 */}
            {/* {totalPages > 1 && (
              <div className='flex items-center justify-center gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => goToRelatedPage(safePage - 1)}
                  disabled={safePage === 1}
                  className='px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-400/50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer'
                >
                  Prev
                </button>

                <div className='flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#0b111e]/90 border border-slate-800/90'>
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    const isActive = pageNumber === safePage;
                    return (
                      <button
                        key={pageNumber}
                        type='button'
                        onClick={() => goToRelatedPage(pageNumber)}
                        className={`min-w-[24px] h-6 px-2 rounded-lg text-[10.5px] font-extrabold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-600 via-fuchsia-600 to-cyan-500 text-white shadow-md shadow-cyan-950/50 scale-105'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  type='button'
                  onClick={() => goToRelatedPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className='px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-400/50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer'
                >
                  Next
                </button>
              </div>
            )} */}
          </section>
        )}
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
        {/* قسم المراجعات */}
        <CustomerReviews
          productId={product.id}
          reviews={reviews}
          onReviewAdded={() => fetchReviews(product.id)}
        />
      </main>

      {/* Wishlist Modal */}
      {isWishlistModalOpen && (
        <div
          onClick={() => setIsWishlistModalOpen(false)}
          className='fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='w-full max-w-md max-h-[85vh] rounded-2xl bg-[#0e1626] border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative'
          >
            {/* Header */}
            <div className='flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800/80 bg-[#0e1626]/95 shrink-0'>
              <div className='flex items-center gap-2 min-w-0'>
                <Heart className='w-4 h-4 text-rose-500 fill-rose-500 shrink-0' />
                <h3 className='text-xs sm:text-sm font-extrabold text-white truncate'>
                  Wishlist ({detailWishlist.length})
                </h3>
              </div>

              <div className='flex items-center gap-2 shrink-0'>
                {detailWishlist.length > 0 && (
                  <button
                    type='button'
                    onClick={clearStaleWishlist}
                    className='text-[10.5px] sm:text-[11px] font-bold text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/20 transition cursor-pointer'
                  >
                    Clear All
                  </button>
                )}
                <button
                  type='button'
                  onClick={() => setIsWishlistModalOpen(false)}
                  aria-label='Close wishlist modal'
                  className='p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white transition cursor-pointer'
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Wishlist Items List with Scroll */}
            <div className='flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 custom-scrollbar'>
              {detailWishlist.length === 0 ? (
                <div className='text-center py-16 sm:py-20 text-slate-500 space-y-3'>
                  <Heart
                    size={42}
                    className='mx-auto text-slate-700 animate-pulse'
                  />
                  <p className='text-xs font-bold text-slate-400'>
                    Your wishlist is empty right now.
                  </p>
                </div>
              ) : (
                detailWishlist.map((wishItem: any, idx: number) => {
                  const isObj =
                    typeof wishItem === 'object' && wishItem !== null;
                  const wId = isObj
                    ? (wishItem.id ?? wishItem.slug ?? idx)
                    : wishItem;
                  const wSlug = isObj
                    ? (wishItem.slug ?? wishItem.id)
                    : wishItem;
                  const wName = isObj
                    ? (wishItem.name ?? `Product #${wId}`)
                    : `Product #${wId}`;
                  const wImg = isObj
                    ? (wishItem.image ??
                      wishItem.images?.[0] ??
                      '/placeholder.png')
                    : '/placeholder.png';

                  const currentPrice = isObj
                    ? Number(wishItem.price ?? 0)
                    : null;
                  const oldPrice = isObj
                    ? Number(
                        wishItem.compare_at_price ??
                          wishItem.old_price ??
                          wishItem.original_price ??
                          wishItem.oldPrice ??
                          0,
                      )
                    : 0;
                  const hasDiscount =
                    currentPrice !== null &&
                    oldPrice > currentPrice &&
                    currentPrice > 0;

                  const itemDesc = isObj
                    ? String(
                        wishItem.description ??
                          wishItem.details ??
                          wishItem.short_description ??
                          '',
                      ).trim()
                    : '';

                  return (
                    <div
                      key={`${wId}-${idx}`}
                      className='group relative bg-gradient-to-r from-[#141d2f]/90 via-[#0e1626] to-[#141d2f]/90 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border border-slate-800/95 hover:border-slate-700/80 transition-all duration-300 shadow-md flex items-center gap-3 sm:gap-3.5'
                    >
                      {/* Product Image + Hot Deal Sticker */}
                      <div className='relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 shrink-0 shadow-sm'>
                        <Image
                          src={wImg || '/placeholder.png'}
                          alt={wName || 'Store Item'}
                          width={128}
                          height={128}
                          sizes='64px'
                          loading='lazy'
                          unoptimized={
                            typeof wImg === 'string' &&
                            (wImg.startsWith('blob:') ||
                              wImg.startsWith('data:'))
                          }
                          className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
                        />
                        <span className='absolute top-1 left-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md'>
                          Hot Deal
                        </span>
                      </div>

                      {/* Info & Prices */}
                      <div className='flex-1 min-w-0'>
                        <Link
                          href={`/products/${wSlug}`}
                          prefetch={false}
                          onClick={() => setIsWishlistModalOpen(false)}
                          className='font-black text-xs text-slate-100 truncate block hover:text-blue-400 transition tracking-tight'
                        >
                          {wName}
                        </Link>

                        {itemDesc && (
                          <p className='text-[10px] text-slate-400 line-clamp-1 mt-0.5'>
                            {itemDesc}
                          </p>
                        )}

                        {currentPrice !== null && (
                          <div className='flex items-center gap-2 mt-1.5 flex-wrap'>
                            <span className='text-xs font-black text-emerald-400 tabular-nums'>
                              {currentPrice} {currency}
                            </span>
                            {hasDiscount && (
                              <span className='text-[9.5px] text-slate-500 line-through font-semibold tabular-nums'>
                                {oldPrice} {currency}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions: Remove & Add to Cart */}
                      <div className='flex flex-col items-end justify-between gap-2 shrink-0'>
                        <button
                          type='button'
                          onClick={() =>
                            handleRemoveWishlistItem(wishItem, idx)
                          }
                          className='p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition cursor-pointer shadow-sm active:scale-95'
                          title='Remove from Wishlist'
                          aria-label='Remove from Wishlist'
                        >
                          <Trash2 size={13} />
                        </button>

                        <button
                          type='button'
                          onClick={() =>
                            handleAddWishlistItemToCart(wishItem, idx)
                          }
                          className='p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition cursor-pointer flex items-center justify-center active:scale-95'
                          title='Add to Cart'
                          aria-label='Add to Cart'
                        >
                          <ShoppingCart size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: Quick Link to Cart Page */}
            {detailWishlist.length > 0 && (
              <div className='p-3.5 sm:p-5 border-t border-slate-800/80 bg-[#07090e]/95 backdrop-blur-xl shrink-0'>
                <Link
                  href='/cart'
                  onClick={() => setIsWishlistModalOpen(false)}
                  className='w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-center rounded-xl font-bold block shadow-xl shadow-blue-950/50 transition text-xs cursor-pointer active:scale-[0.99]'
                >
                  View Shopping Cart & Checkout 🛍️
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* توست الإشعارات أسفل الشاشة (المفضلة / السلة / الكمية) */}
      {toast && (
        <div
          key={toast.id}
          role='status'
          aria-live='polite'
          className='fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] max-w-[92vw] w-fit px-4 py-2.5 rounded-2xl bg-[#0e1626]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/60 flex items-center gap-2.5 text-xs font-extrabold text-white animate-in fade-in slide-in-from-bottom-4 duration-200'
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === 'cart'
                ? 'bg-emerald-400'
                : toast.type === 'wishlist'
                  ? 'bg-rose-500'
                  : 'bg-cyan-400'
            }`}
          />
          <Zap size={14} className='text-cyan-300 shrink-0' />
          <span className='truncate'>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
