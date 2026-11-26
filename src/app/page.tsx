'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from './../lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  Search,
  X,
  Trash2,
  Plus,
  Minus,
  Compass,
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
  Star,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import BenefitsBar from '@/components/Benefits/BenefitsBar';
import CustomerReviewsSection from '@/components/ReviewsSite/CustomerReviewsSection';
import TechShowcaseBanner from '@/components/Showcase/TechShowcaseBanner';

const ShareButton = dynamic(() => import('@/components/ShareButton'), {
  ssr: false,
  loading: () => null,
});

const SiteShareButton = dynamic(() => import('@/components/SiteShareButton'), {
  ssr: false,
  loading: () => null,
});

const StorePromoBanner = dynamic(
  () => import('@/components/StorePromoBanner'),
  {
    ssr: false,
    loading: () => null,
  },
);
const readStorageArray = (key: string): any[] => {
  if (typeof window === 'undefined') return [];

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    // Invalid or blocked localStorage must never break the storefront.
    return [];
  }
};

const writeStorageArray = (key: string, value: any[]) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // The UI still works for the current session if storage is unavailable.
    console.warn(`Could not persist ${key}:`, error);
  }
};


// ==================
// ==================
// ==================
// ==================
// ==================
// ==================
// ==================
// ==================
// ==================
// ==================
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
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================

// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
const getDiscountInfo = (entry: any) => {
  const originalPrice = Number(
    entry?.compare_at_price ?? entry?.old_price ?? 0,
  );
  const currentPrice = Number(entry?.price ?? 0);
  const hasDiscount =
    Number(entry?.discount) > 0 ||
    (originalPrice > currentPrice && currentPrice > 0);
  const discountPercent =
    Number(entry?.discount) > 0
      ? Math.round(Number(entry.discount))
      : hasDiscount
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

  return { hasDiscount, discountPercent };
};
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
export default function HomePage() {
  const router = useRouter(); // <--- هذا هو السطر الذي يمنع الخطأ
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Hero Pagination States
  const [heroPage, setHeroPage] = useState(1);
  const [heroPageAnimKey, setHeroPageAnimKey] = useState(0);

  // Flash Deals Pagination States
  const [flashPage, setFlashPage] = useState(1);
  const [flashPageAnimKey, setFlashPageAnimKey] = useState(0);

  // Catalog Pagination, Search Filter & Categories Modal States
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageAnimKey, setCatalogPageAnimKey] = useState(0);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [minPriceFilter, setMinPriceFilter] = useState<string>('');
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>('');
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);
  const [visibleCatLimit, setVisibleCatLimit] = useState<number>(5);

  // Cart Drawer & Toast State
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Visibility States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  // References for Sliders Auto-scroll control
  const catalogScrollRef = useRef<HTMLDivElement | null>(null);
  const catalogSectionRef = useRef<HTMLMainElement | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogLoadFailed, setCatalogLoadFailed] = useState(false);
  const [catalogRetryKey, setCatalogRetryKey] = useState(0);

  // States for pause/play on each slider
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [isFlashPaused, setIsFlashPaused] = useState(false);
  const [isCatalogPaused, setIsCatalogPaused] = useState(false);

  const [announcementBar, setAnnouncementBar] = useState<{
    enabled: boolean;
    text: string;
    startEmoji: string;
    endEmoji: string;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, duration = 2500) => {
    setToastMessage(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, duration);
  };

  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  const [isNavSectionsOpen, setIsNavSectionsOpen] = useState(false);

  const sectionItems = [
    {
      id: 'top-picks-section',
      label: 'Top Picks',
      icon: '⭐',
      iconAnim: 'group-hover:rotate-12 group-hover:scale-110',
      badgeClass: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    },
    {
      id: 'deals-section',
      label: 'Deals & Offers',
      icon: '⚡',
      iconAnim: 'group-hover:-translate-y-0.5 group-hover:scale-110',
      badgeClass: 'text-rose-300 bg-rose-500/10 border-rose-500/25',
    },
    {
      // id: 'catalog-section',
      id: 'products-grid',
      label: 'Product Catalog',
      icon: '🏷️',
      iconAnim: 'group-hover:rotate-[-12deg] group-hover:scale-110',
      badgeClass: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
    },
    {
      id: 'store-footer',
      label: 'Footer',
      icon: '📍',
      iconAnim: 'group-hover:translate-y-0.5',
      badgeClass: 'text-blue-300 bg-blue-500/10 border-blue-500/25',
    },
  ];

  const handleScrollToSection = (id: string) => {
    setIsNavSectionsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  // ====================
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
// ====================
// ====================
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
const [sortHighlight, setSortHighlight] = useState<'none' | 'green' | 'red'>(
  'none',
);
// ====================
// ====================
// ====================
const filteredProducts = useMemo(() => {
  const selectedCategoryObject = categories.find(
    (category) =>
      category.name === selectedCategory || category.id === selectedCategory,
  );

  const rawQuery = searchQuery.trim();
  const isExactPrice = rawQuery !== '' && /^\d+(\.\d+)?$/.test(rawQuery);
  const exactPriceNum = isExactPrice ? Number(rawQuery) : null;

  const matched = products.filter((product) => {
    if (normalizedSearchQuery) {
      const productName = String(product.name ?? '').toLowerCase();
      const rawPriceStr = String(product.price ?? '')
        .replace(/,/g, '')
        .trim();
      const productPriceNum = Number(rawPriceStr);

      const matchesName = productName.includes(normalizedSearchQuery);
      const matchesExactPrice =
        isExactPrice &&
        exactPriceNum !== null &&
        Number.isFinite(productPriceNum) &&
        Math.abs(productPriceNum - exactPriceNum) < 0.0001;

      if (!matchesName && !matchesExactPrice) {
        return false;
      }
    }

    if (
      !selectedCategory ||
      selectedCategory === 'All' ||
      selectedCategory === 'الكل'
    ) {
      return true;
    }

    return (
      product.category_id === selectedCategoryObject?.id ||
      product.category === selectedCategory ||
      product.categories?.name === selectedCategory ||
      product.categories?.id === selectedCategoryObject?.id
    );
  });

  return [...matched].sort((a, b) => {
    const priceA = Number(String(a.price ?? '').replace(/,/g, '')) || 0;
    const priceB = Number(String(b.price ?? '').replace(/,/g, '')) || 0;
    return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
  });
}, [
  products,
  categories,
  selectedCategory,
  searchQuery,
  normalizedSearchQuery,
  sortOrder,
]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      if (product.show_in_catalog !== true) continue;

      const categoryId = product.category_id ?? product.categories?.id;
      const categoryName = product.categories?.name ?? product.category;

      if (categoryId != null) {
        const idKey = String(categoryId);
        counts.set(idKey, (counts.get(idKey) ?? 0) + 1);
      }

      if (categoryName) {
        const nameKey = String(categoryName);
        counts.set(nameKey, (counts.get(nameKey) ?? 0) + 1);
      }
    }

    return counts;
  }, [products]);

  // ==========================================
  // Control slider with Hero
  // ==========================================
  const setSliderPauseState = (
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

    if (typeof setIsHeroPaused === 'function') {
      setIsHeroPaused(paused);
    }
  };

  const handleSliderTempPause = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const node = e.currentTarget;
    if (node.dataset.resumeTimer) {
      clearTimeout(Number(node.dataset.resumeTimer));
      node.dataset.resumeTimer = '';
    }
    node.dataset.isPaused = 'true';
  };

  const handleSliderTempResume = (
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
      if (typeof setIsHeroPaused === 'function') {
        setIsHeroPaused(true);
      }
      return;
    }

    node.dataset.resumeTimer = String(
      window.setTimeout(() => {
        if (!node.isConnected) return;
        if (node.dataset.manualPaused === 'true') {
          node.dataset.isPaused = 'true';
          if (typeof setIsHeroPaused === 'function') {
            setIsHeroPaused(true);
          }
          return;
        }
        node.dataset.isPaused = 'false';
        if (typeof setIsHeroPaused === 'function') {
          setIsHeroPaused(false);
        }
      }, delay),
    );
  };

  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
            const MAX_ATTEMPTS = 5;
            const LOCK_DURATION_MS = 30_000; // 30 seconds cooldown

            const [failedAttempts, setFailedAttempts] = useState(0);
            const [lockUntil, setLockUntil] = useState<number | null>(
              null,
            );
            const [remainingSeconds, setRemainingSeconds] = useState(0);
            const [isSubmitting, setIsSubmitting] = useState(false);

            useEffect(() => {
              if (!lockUntil) return;

              const updateTimer = () => {
                const diff = Math.ceil((lockUntil - Date.now()) / 1000);
                if (diff <= 0) {
                  setLockUntil(null);
                  setRemainingSeconds(0);
                  setFailedAttempts(0);
                } else {
                  setRemainingSeconds(diff);
                }
              };

              updateTimer();
              const interval = setInterval(updateTimer, 1000);
              return () => clearInterval(interval);
            }, [lockUntil]);

            const isLocked = Boolean(lockUntil && remainingSeconds > 0);
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // Control Slider with Flash
  // ==========================================
  const setFlashSliderPauseState = (
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

    const shouldPause =
      paused ||
      node.dataset.manualPaused === 'true' ||
      node.dataset.mouseHovered === 'true' ||
      node.dataset.touchActive === 'true';

    node.dataset.isPaused = shouldPause ? 'true' : 'false';

    if (typeof setIsFlashPaused === 'function') {
      setIsFlashPaused(shouldPause);
    }
  };

  const handleFlashTempPause = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const node = e.currentTarget;

    if (node.dataset.resumeTimer) {
      clearTimeout(Number(node.dataset.resumeTimer));
      node.dataset.resumeTimer = '';
    }

    node.dataset.isPaused = 'true';

    if (typeof setIsFlashPaused === 'function') {
      setIsFlashPaused(true);
    }
  };

  const handleFlashTempResume = (
    e: React.SyntheticEvent<HTMLDivElement>,
    delay = 0,
  ) => {
    const node = e.currentTarget;

    if (node.dataset.resumeTimer) {
      clearTimeout(Number(node.dataset.resumeTimer));
      node.dataset.resumeTimer = '';
    }

    const shouldStayPaused = () =>
      node.dataset.manualPaused === 'true' ||
      node.dataset.mouseHovered === 'true' ||
      node.dataset.touchActive === 'true';

    if (shouldStayPaused()) {
      node.dataset.isPaused = 'true';

      if (typeof setIsFlashPaused === 'function') {
        setIsFlashPaused(true);
      }

      return;
    }

    node.dataset.resumeTimer = String(
      window.setTimeout(() => {
        if (!node.isConnected) return;

        if (shouldStayPaused()) {
          node.dataset.isPaused = 'true';

          if (typeof setIsFlashPaused === 'function') {
            setIsFlashPaused(true);
          }

          return;
        }

        node.dataset.isPaused = 'false';

        if (typeof setIsFlashPaused === 'function') {
          setIsFlashPaused(false);
        }

        node.dataset.resumeTimer = '';
      }, delay),
    );
  };

  const handleFlashMouseEnter = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const node = e.currentTarget;
    node.dataset.mouseHovered = 'true';
    handleFlashTempPause(e);
  };

  const handleFlashMouseLeave = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const node = e.currentTarget;
    node.dataset.mouseHovered = 'false';
    handleFlashTempResume(e, 0);
  };

  const handleFlashTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const node = e.currentTarget;
    node.dataset.touchActive = 'true';
    handleFlashTempPause(e);
  };

  const handleFlashTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const node = e.currentTarget;
    node.dataset.touchActive = 'false';
    handleFlashTempResume(e, 1600);
  };

  // ==========================================
  // Catalog Slider Pause Control
  // ==========================================
  const isCatalogPausedRef = useRef(false);
  const catalogResumeTimerRef = useRef<number | null>(null);
  const isCatalogHoveredRef = useRef(false);

  const clearCatalogResumeTimer = () => {
    if (catalogResumeTimerRef.current !== null) {
      window.clearTimeout(catalogResumeTimerRef.current);
      catalogResumeTimerRef.current = null;
    }
  };

  const syncCatalogPauseState = (paused: boolean) => {
    const slider = document.getElementById(
      'catalog-slider-ref',
    ) as HTMLDivElement | null;

    isCatalogPausedRef.current = paused;

    if (slider) {
      slider.dataset.isPaused = paused ? 'true' : 'false';
    }

    if (typeof setIsCatalogPaused === 'function') {
      setIsCatalogPaused(paused);
    }
  };

  const setCatalogSliderPauseState = (
    paused: boolean,
    isManualToggle = false,
  ) => {
    clearCatalogResumeTimer();

    const slider = document.getElementById('catalog-slider-ref');

    if (isManualToggle && slider) {
      slider.dataset.manualPaused = paused ? 'true' : 'false';
    }

    const shouldPause =
      paused ||
      slider?.dataset.manualPaused === 'true' ||
      isCatalogHoveredRef.current;

    syncCatalogPauseState(shouldPause);
  };

  const handleCatalogPause = () => {
    clearCatalogResumeTimer();
    syncCatalogPauseState(true);
  };

  const handleCatalogResume = (delay = 0) => {
    clearCatalogResumeTimer();

    const slider = document.getElementById('catalog-slider-ref');

    if (
      slider?.dataset.manualPaused === 'true' ||
      isCatalogHoveredRef.current
    ) {
      syncCatalogPauseState(true);
      return;
    }

    catalogResumeTimerRef.current = window.setTimeout(() => {
      catalogResumeTimerRef.current = null;

      const currentSlider = document.getElementById('catalog-slider-ref');

      if (
        currentSlider?.dataset.manualPaused === 'true' ||
        isCatalogHoveredRef.current
      ) {
        syncCatalogPauseState(true);
        return;
      }

      syncCatalogPauseState(false);
    }, delay);
  };

  const handleCatalogMouseEnter = () => {
    isCatalogHoveredRef.current = true;
    handleCatalogPause();
  };

  const handleCatalogMouseLeave = () => {
    isCatalogHoveredRef.current = false;
    handleCatalogResume(0);
  };

  const handleCatalogTempPause = handleCatalogPause;
  const handleCatalogTempResume = handleCatalogResume;

  // ==========================================
  // Effects & Data Fetching
  // ==========================================
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      clearCatalogResumeTimer();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let requestInProgress = false;
    let lastSuccessfulLoad = 0;

    const loadAnnouncementBar = async () => {
      if (requestInProgress || Date.now() - lastSuccessfulLoad < 60_000) return;

      requestInProgress = true;

      try {
        const { data, error } = await supabase
          .from('settings')
          .select(
            'announcement_enabled, announcement_text, announcement_emoji_start, announcement_emoji_end',
          )
          .eq('id', 1)
          .maybeSingle();

        if (!active) return;

        if (error) {
          console.error('Announcement loading error:', error);
          return;
        }

        lastSuccessfulLoad = Date.now();

        if (!data) {
          setAnnouncementBar(null);
          return;
        }

        setAnnouncementBar({
          enabled: data.announcement_enabled ?? true,
          text:
            data.announcement_text ??
            'FLASH SALE: Enjoy Up To 40% OFF On Selected Cyber Tech Items! Limited Time Only.',
          startEmoji: data.announcement_emoji_start || '💸',
          endEmoji: data.announcement_emoji_end || '🔥',
        });
      } catch (error) {
        console.error('Announcement error:', error);
      } finally {
        requestInProgress = false;
      }
    };

    void loadAnnouncementBar();

    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadAnnouncementBar();
      }
    }, 300000);

    const handleFocus = () => {
      void loadAnnouncementBar();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    let active = true;

    void fetchProducts(() => active);
    loadCartFromStorage();
    loadWishlistFromStorage();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async (isActive: () => boolean = () => true) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('is_active', true)
        .or(
          'and(show_in_hero.eq.true,is_hidden.is.null),and(show_in_hero.eq.true,is_hidden.eq.false),and(show_in_flash.eq.true,is_hidden.is.null),and(show_in_flash.eq.true,is_hidden.eq.false)',
        )
        .order('created_at', { ascending: false });

      if (!isActive()) return;
      if (error) throw error;

      setProducts((previous) => {
        const merged = new Map(
          previous.map((product) => [product.id, product]),
        );
        for (const product of data ?? []) merged.set(product.id, product);
        return [...merged.values()];
      });
    } catch (error) {
      console.error('Store data loading error:', error);
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useEffect(() => {
    const target = catalogSectionRef.current;
    if (!target) return;

    let active = true;
    let requestStarted = false;

    const loadCatalog = async () => {
      if (requestStarted || catalogLoaded) return;
      requestStarted = true;
      setCatalogLoading(true);
      setCatalogLoadFailed(false);

      try {
        const [productsResult, categoriesResult] = await Promise.all([
          supabase
            .from('products')
            .select('*, categories(id, name)')
            .eq('is_active', true)
            .eq('show_in_catalog', true)
            .or('is_hidden.is.null,is_hidden.eq.false')
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('id, name')
            .order('name', { ascending: true }),
        ]);

        if (!active) return;
        if (productsResult.error) throw productsResult.error;

        if (categoriesResult.error) {
          console.error('Categories loading error:', categoriesResult.error);
        }

        setProducts((previous) => {
          const merged = new Map(
            previous.map((product) => [product.id, product]),
          );
          for (const product of productsResult.data ?? []) {
            merged.set(product.id, product);
          }
          return [...merged.values()];
        });
        setCategories(categoriesResult.data ?? []);
        setCatalogLoaded(true);
      } catch (error) {
        console.error('Catalog loading error:', error);
        if (active) setCatalogLoadFailed(true);
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      void loadCatalog();
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadCatalog();
          observer.disconnect();
        }
      },
      { rootMargin: '450px 0px' },
    );

    observer.observe(target);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [catalogRetryKey]);

  const loadCartFromStorage = () => {
    const savedCart = readStorageArray('cart')
      .filter((item) => item && typeof item.id === 'string')
      .map((item) => ({
        id: item.id,
        name: String(item.name ?? ''),
        price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
        image: typeof item.image === 'string' ? item.image : '',
        quantity: Number.isFinite(Number(item.quantity))
          ? Math.max(1, Math.floor(Number(item.quantity) || 1))
          : 1,
      }));

    setCart(savedCart);
  };

  const loadWishlistFromStorage = () => {
    const savedWishlist = readStorageArray('wishlist');
    const savedIds = savedWishlist
      .map((item) =>
        typeof item === 'string'
          ? item
          : typeof item?.id === 'string'
            ? item.id
            : null,
      )
      .filter((id): id is string => Boolean(id));

    setWishlist([...new Set(savedIds)]);
  };

  const saveCartToStorage = (updatedCart: any[]) => {
    setCart(updatedCart);
    writeStorageArray('cart', updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    writeStorageArray('cart', []);
  };

  const toggleWishlist = (product: any) => {
    const savedWishlist = readStorageArray('wishlist');
    const exists = wishlist.includes(product.id);

    const updatedWishlist = exists
      ? savedWishlist.filter((item) => {
          const itemId = typeof item === 'string' ? item : item?.id;
          return itemId !== product.id;
        })
      : [
          ...savedWishlist,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.images?.[0] || '',
          },
        ];

    setWishlist((previous) =>
      exists
        ? previous.filter((id) => id !== product.id)
        : previous.includes(product.id)
          ? previous
          : [...previous, product.id],
    );

    writeStorageArray('wishlist', updatedWishlist);
    showToast(
      exists
        ? `Removed "${product.name}" from wishlist`
        : `Added "${product.name}" to wishlist`,
      2000,
    );
  };

const addToCart = (e: React.MouseEvent, product: any) => {
  e.preventDefault();
  e.stopPropagation();

  if (!product?.id) return;

  const productImage = product.image || product.images?.[0] || '';
  const productDesc =
    product.description || product.details || product.short_description || '';
  const numericPrice = Number(product.price);
  const safePrice =
    Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : 0;
  const exists = cart.some((item) => item.id === product.id);

  const updatedCart = exists
    ? cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: Math.max(1, Number(item.quantity) || 1) + 1,
              description: item.description || productDesc,
            }
          : item,
      )
    : [
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: safePrice,
          image: productImage,
          description: productDesc,
          quantity: 1,
        },
      ];

  saveCartToStorage(updatedCart);
  showToast(`Added "${product.name}" to your cart!`);
};

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart.flatMap((item) => {
      if (item.id !== id) return [item];

      const newQty = (Number(item.quantity) || 1) + delta;
      return newQty > 0 ? [{ ...item, quantity: newQty }] : [];
    });

    saveCartToStorage(updated);
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    saveCartToStorage(updated);
  };

  const totalItemsCount = cart.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
    0,
  );
  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.price) || 0) *
        Math.max(0, Number(item.quantity) || 0),
    0,
  );

  // ==========================================
  // Section Collections
  // ==========================================
  const heroProducts = useMemo(
    () => products.filter((product) => product.show_in_hero),
    [products],
  );
  const flashDeals = useMemo(
    () => products.filter((product) => product.show_in_flash),
    [products],
  );
  const catalogProducts = useMemo(
    () =>
      filteredProducts.filter((product) => product.show_in_catalog === true),
    [filteredProducts],
  );

  const handleScrollManual = (ref: any, direction: string, amount = 380) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  // ==========================================
  // Hero Pagination Calculations
  // ==========================================
  const HERO_ITEMS_PER_PAGE = 6;
  const totalHeroPages = Math.max(
    1,
    Math.ceil(heroProducts.length / HERO_ITEMS_PER_PAGE),
  );
  const safeHeroPage = Math.min(heroPage, totalHeroPages);
  const heroStartIndex = (safeHeroPage - 1) * HERO_ITEMS_PER_PAGE;
  const heroEndIndex = Math.min(
    heroStartIndex + HERO_ITEMS_PER_PAGE,
    heroProducts.length,
  );
  const paginatedHeroProducts = heroProducts.slice(
    heroStartIndex,
    heroEndIndex,
  );

  const handleHeroPageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalHeroPages));
    if (clamped === safeHeroPage) return;

    setHeroPage(clamped);
    setHeroPageAnimKey((k) => k + 1);

    const slider = document.getElementById(
      'hero-slider-ref',
    ) as HTMLDivElement | null;
    if (slider) {
      slider.scrollLeft = 0;
    }
  };

  // ==========================================
  // Flash Deals Pagination Calculations
  // ==========================================
  const FLASH_ITEMS_PER_PAGE = 6;
  const totalFlashPages = Math.max(
    1,
    Math.ceil(flashDeals.length / FLASH_ITEMS_PER_PAGE),
  );
  const safeFlashPage = Math.min(flashPage, totalFlashPages);
  const flashStartIndex = (safeFlashPage - 1) * FLASH_ITEMS_PER_PAGE;
  const flashEndIndex = Math.min(
    flashStartIndex + FLASH_ITEMS_PER_PAGE,
    flashDeals.length,
  );
  const paginatedFlashDeals = flashDeals.slice(flashStartIndex, flashEndIndex);

  const handleFlashPageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalFlashPages));
    if (clamped === safeFlashPage) return;

    setFlashPage(clamped);
    setFlashPageAnimKey((k) => k + 1);

    const slider = document.getElementById(
      'flash-slider-ref',
    ) as HTMLDivElement | null;
    if (slider) {
      slider.scrollLeft = 0;
    }
  };

  // ==========================================
  // Catalog Filters, Categories Grid & Pagination
  // ==========================================
  useEffect(() => {
    const updateCatLimitByViewport = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 1024) {
        // 8 أعمدة × 3 صفوف = 24
        setVisibleCatLimit(24);
      } else if (window.innerWidth >= 640) {
        // 5 أعمدة × 3 صفوف = 15
        setVisibleCatLimit(15);
      } else {
        // 3 أعمدة × 3 صفوف = 9
        setVisibleCatLimit(5);
      }
    };

    updateCatLimitByViewport();
    window.addEventListener('resize', updateCatLimitByViewport);
    return () => window.removeEventListener('resize', updateCatLimitByViewport);
  }, []);

  useEffect(() => {
    if (!isMoreCategoriesOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreCategoriesOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMoreCategoriesOpen]);

const filteredCatalogProducts = useMemo(() => {
  const rawQuery = (searchQuery || '').trim();
  const q = rawQuery.toLowerCase();
  const isExactPriceQuery = rawQuery !== '' && /^\d+(\.\d+)?$/.test(rawQuery);
  const exactPriceValue = isExactPriceQuery ? Number(rawQuery) : null;

  const minPrice = minPriceFilter.trim() !== '' ? Number(minPriceFilter) : null;
  const maxPrice = maxPriceFilter.trim() !== '' ? Number(maxPriceFilter) : null;

  return catalogProducts.filter((product) => {
    const productPrice = Number(
      String(product.price ?? '')
        .replace(/,/g, '')
        .trim(),
    );
    const safePrice = Number.isFinite(productPrice) ? productPrice : 0;

    const nameOrExactPriceMatch =
      !q ||
      (isExactPriceQuery &&
        exactPriceValue !== null &&
        !Number.isNaN(exactPriceValue) &&
        Math.abs(safePrice - exactPriceValue) < 0.0001) ||
      String(product.name || '')
        .toLowerCase()
        .includes(q);

    const rawRating = Number(product.rating ?? 5);
    const ratingValue = Number.isFinite(rawRating) ? rawRating : 5;
    const ratingMatch = minRatingFilter <= 0 || ratingValue >= minRatingFilter;

    const minPriceMatch =
      minPrice === null || Number.isNaN(minPrice) || safePrice >= minPrice;
    const maxPriceMatch =
      maxPrice === null || Number.isNaN(maxPrice) || safePrice <= maxPrice;

    return (
      nameOrExactPriceMatch && ratingMatch && minPriceMatch && maxPriceMatch
    );
  });
}, [
  catalogProducts,
  searchQuery,
  minRatingFilter,
  minPriceFilter,
  maxPriceFilter,
]);

  const CATALOG_ITEMS_PER_PAGE = 6;
  const totalCatalogPages = Math.max(
    1,
    Math.ceil(filteredCatalogProducts.length / CATALOG_ITEMS_PER_PAGE),
  );
  const safeCatalogPage = Math.min(catalogPage, totalCatalogPages);
  const catalogStartIndex = (safeCatalogPage - 1) * CATALOG_ITEMS_PER_PAGE;
  const catalogEndIndex = Math.min(
    catalogStartIndex + CATALOG_ITEMS_PER_PAGE,
    filteredCatalogProducts.length,
  );
  const paginatedCatalogProducts = filteredCatalogProducts.slice(
    catalogStartIndex,
    catalogEndIndex,
  );

  const handleCatalogPageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalCatalogPages));
    if (clamped === safeCatalogPage) return;

    setCatalogPage(clamped);
    setCatalogPageAnimKey((k) => k + 1);

    const slider = document.getElementById(
      'catalog-slider-ref',
    ) as HTMLDivElement | null;
    if (slider) {
      slider.scrollLeft = 0;
      delete slider.dataset.manualTarget;
    }
  };

  const activeExtraFiltersCount =
    (minRatingFilter > 0 ? 1 : 0) +
    (minPriceFilter.trim() !== '' ? 1 : 0) +
    (maxPriceFilter.trim() !== '' ? 1 : 0);

  const hasExtraCategories = categories.length > visibleCatLimit;
  const displayedGridCategories = hasExtraCategories
    ? categories.slice(0, Math.max(1, visibleCatLimit - 1))
    : categories;
  const overflowCategories = hasExtraCategories
    ? categories.slice(Math.max(1, visibleCatLimit - 1))
    : [];

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

      {/* ========================================== */}
      {/* ========================================== */}
      {/* ========================================== */}
      {/* ========================================== */}

      {/* Cart Drawer Overlay */}
      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div className='fixed top-16 sm:top-20 inset-x-0 bottom-0 z-40 overflow-hidden font-sans'>
          <div
            className='fixed top-16 sm:top-20 inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm transition-opacity'
            onClick={() => setIsCartOpen(false)}
          />
          <div className='fixed top-16 sm:top-20 bottom-0 right-0 max-w-full flex pl-10'>
            <div className='w-screen max-w-md sm:max-w-sm h-full bg-[#0e1626]/95 backdrop-blur-xl border-l border-slate-800/90 shadow-2xl flex flex-col relative overflow-hidden'>
              {/* Background Glow Orbs */}
              <div className='absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none'></div>
              <div className='absolute -bottom-20 -left-20 w-40 h-40 bg-rose-600/10 rounded-full blur-3xl pointer-events-none'></div>

              {/* Header */}
              <div className='flex items-center justify-between p-5 border-b border-slate-800/80 relative z-10 shrink-0'>
                <div className='flex items-center gap-2.5'>
                  <div className='p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400'>
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h2 className='text-sm sm:text-base font-black text-white tracking-tight'>
                      Shopping Cart
                    </h2>
                    <p className='text-[10px] text-slate-400 font-medium'>
                      {totalItemsCount}{' '}
                      {totalItemsCount === 1 ? 'item' : 'items'} in your cart
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  {cart.length > 0 && (
                    <button
                      type='button'
                      onClick={() => {
                        clearCart();
                      }}
                      className='text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer'
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className='p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/90 border border-slate-800 transition cursor-pointer'
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className='flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar relative z-10'>
                {cart.length === 0 ? (
                  <div className='text-center py-28 text-slate-500 space-y-3'>
                    <ShoppingBag
                      size={48}
                      className='mx-auto text-slate-700 animate-pulse'
                    />
                    <p className='text-xs font-bold text-slate-400'>
                      Your cart is currently empty.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const itemImg =
                      item.image ||
                      item.images?.[0] ||
                      'https://via.placeholder.com/80';
                    const currentPrice = item.price || 0;
                    const oldPrice =
                      item.oldPrice ||
                      item.original_price ||
                      currentPrice + 200;
                    const itemDesc =
                      item.description ||
                      item.details ||
                      item.short_description ||
                      'High quality premium product';
                    const qty = item.quantity || 1;

                    return (
                      <div
                        key={item.id}
                        className='group relative bg-gradient-to-r from-[#141d2f]/90 via-[#0e1626] to-[#141d2f]/90 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800/95 hover:border-slate-700/80 transition-all duration-300 shadow-md flex items-center gap-3.5'
                      >
                        {/* Product Image + Hot Deal Sticker */}
                        <div className='relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 shrink-0 shadow-sm'>
                          <Image
                            src={itemImg || '/placeholder.png'}
                            alt={item.name || 'Store Item'}
                            width={160}
                            height={160}
                            sizes='64px'
                            loading='lazy'
                            unoptimized={
                              typeof itemImg === 'string' &&
                              (itemImg.startsWith('blob:') ||
                                itemImg.startsWith('data:'))
                            }
                            className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
                          />
                          <span className='absolute top-1 left-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md'>
                            Hot Deal
                          </span>
                        </div>

                        {/* Info & Prices */}
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-black text-xs text-slate-100 truncate tracking-tight'>
                            {item.name}
                          </h4>
                          <p className='text-[10px] text-slate-400 line-clamp-1 mt-0.5'>
                            {itemDesc}
                          </p>

                          <div className='flex items-center gap-2 mt-1.5'>
                            <span className='text-xs font-black text-emerald-400'>
                              {currentPrice} EGP
                            </span>
                            {oldPrice > currentPrice && (
                              <span className='text-[9px] text-slate-500 line-through font-semibold'>
                                {oldPrice} EGP
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className='flex items-center gap-2 mt-2'>
                            <div className='flex items-center bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden p-0.5 shadow-inner'>
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className='w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs font-bold cursor-pointer'
                              >
                                <Minus size={11} />
                              </button>
                              <span className='w-6 text-center text-xs font-black text-white'>
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className='w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs font-bold cursor-pointer'
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Total & Remove */}
                        <div className='flex flex-col items-end justify-between h-full gap-4 shrink-0'>
                          <button
                            onClick={() => removeItem(item.id)}
                            className='p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition cursor-pointer shadow-sm'
                            title='Remove'
                          >
                            <Trash2 size={13} />
                          </button>
                          <span className='text-xs font-black text-white'>
                            {currentPrice * qty} EGP
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ================================= */}
              {/* ================================= */}
              {/* ================================= */}
              {/* ================================= */}
              {/* Footer Summary & Checkout */}

              {/* ================================= */}
              {/* ================================= */}
              {/* ================================= */}
              {/* Compact & Mobile-Optimized Cart Footer */}
              {cart.length > 0 && (
                <div className='p-4 sm:p-3 border-t border-slate-800/80 bg-[#0c1017] backdrop-blur-xl space-y-3 sm:space-y-2 relative z-10 shrink-0 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2'>
                  {/* Subtotal Row */}
                  <div className='flex justify-between items-center text-xs sm:text-[11px] text-slate-300'>
                    <span className='text-slate-400'>Subtotal:</span>
                    <span className='text-sm sm:text-xs font-bold text-white'>
                      {subtotal} EGP
                    </span>
                  </div>

                  {/* Shipping Fee Row */}
                  <div className='flex justify-between items-center text-xs sm:text-[11px] text-slate-300'>
                    <span className='text-slate-400'>Shipping Fee:</span>
                    <span className='text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-md text-[10px] sm:text-[9px] tracking-wide'>
                      يُحسب عند الاستلام
                    </span>
                  </div>

                  {/* Total Amount Row */}
                  <div className='border-t border-slate-800/80 pt-2.5 sm:pt-2 flex justify-between items-center font-black text-base sm:text-sm text-white'>
                    <span className='text-sm sm:text-xs font-bold'>
                      Total Amount:
                    </span>
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-blue-400 text-base sm:text-sm'>
                      {subtotal} EGP
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <Link
                    href='/checkout'
                    onClick={() => setIsCartOpen(false)}
                    className='w-full py-3 sm:py-2 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-center rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-red-950/30 transition-all duration-200 hover:scale-[1.01] active:scale-95 text-xs sm:text-[11px] cursor-pointer'
                  >
                    <span>Proceed to Checkout ({subtotal} EGP)</span>
                    <span className='text-xs font-light'>→</span>
                  </Link>
                </div>
              )}
              {/* ================================= */}
              {/* ================================= */}
              {/* ================================= */}
              {/* ================================= */}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ========================================== */}
      {/* ========================================== */}
      {/* ========================================== */}
      {/* ========================================== */}

      {/* 2. Main Navbar (Sticky and includes Wishlist Icon linked to logic) */}
      <nav className=' fixed top-0 left-0 right-0  w-full bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/85 z-50 '>
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
              <Image
                src='/fav-me-3.webp'
                alt='Abdo'
                width={400}
                height={400}
                priority
                sizes='(max-width: 640px) 36px, 48px'
                className='w-full h-full object-cover object-top rounded-[10px] sm:rounded-[14px] transform group-hover:scale-105 transition-transform duration-500'
              />
            </div>

            {/* تصغير حجم خط Abdo Store على الموبايل ليكون text-sm وفي الشاشات الأكبر sm:text-xl */}
            <span className='text-sm sm:text-xl font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
              Abdo Store
            </span>
          </Link>

          {/* ============================================== */}
          {/* ============================================== */}
          {/* Actions & Wishlist / Account / Cart */}
          {/* تقليل المسافات البينية بين الأزرار على الموبايل gap-1.5 لتوفير مساحة */}
          <div className='flex items-center gap-1.5 sm:gap-2.5 shrink-0'>
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}

            {/* <SiteShareButton /> */}

            {/* <div className='inline-flex items-center scale-70 sm:scale-90 origin-center [&_button]:p-1.5 [&_button]:sm:px-2.5 [&_button]:sm:py-2 [&_button]:rounded-lg [&_button]:text-[10px] [&_button]:sm:text-xs [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:sm:w-4 [&_svg]:sm:h-4'> */}
            {/* <SiteShareButton /> */}
            {/* </div> */}

            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            <div className='relative inline-flex'>
              <button
                type='button'
                onClick={() => setIsNavSectionsOpen((prev) => !prev)}
                title='Jump to section'
                aria-expanded={isNavSectionsOpen}
                className={`relative inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-b from-slate-800/75 to-[#090f19]/90 hover:from-slate-800 hover:to-[#0e1626] border transition cursor-pointer shadow-sm active:scale-95 ${
                  isNavSectionsOpen
                    ? 'border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <Compass
                  className={`w-3 h-3 sm:w-[17px] sm:h-[17px] text-cyan-400 transition-transform duration-300 ${
                    isNavSectionsOpen ? 'rotate-45 scale-105' : ''
                  }`}
                />
              </button>

              {isNavSectionsOpen && (
                <>
                  <div
                    className='fixed inset-0 z-30'
                    onClick={() => setIsNavSectionsOpen(false)}
                  />

                  <div
                    role='menu'
                    className='fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-full z-40 sm:mt-2 w-auto sm:w-52 rounded-xl border border-slate-700/80 bg-[#080e1a]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl'
                  >
                    <div className='px-2 py-1 text-[10px] font-bold tracking-wide text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between'>
                      <span>Sections</span>
                      <span className='text-[10px] text-cyan-400/90'>
                        انتقال سريع
                      </span>
                    </div>

                    <div className='space-y-0.5'>
                      {sectionItems.map((item) => (
                        <button
                          key={item.id}
                          type='button'
                          role='menuitem'
                          onClick={() => handleScrollToSection(item.id)}
                          className='group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[11px] sm:text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition cursor-pointer'
                        >
                          <span className='flex items-center gap-2 min-w-0'>
                            <span
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] transition-transform duration-200 ${item.badgeClass} ${item.iconAnim}`}
                            >
                              {item.icon}
                            </span>
                            <span className='truncate'>{item.label}</span>
                          </span>
                          <span className='text-[10px] text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all'>
                            ›
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}
            {/* =============================== */}

            {/* Wishlist Button in Navbar linked with Wishlist count logic */}

            <button
              onClick={() => setIsWishlistModalOpen(!isWishlistModalOpen)}
              title='Wishlist'
              className='relative inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-b from-slate-800/75 to-[#090f19]/90 hover:from-slate-800 hover:to-[#0e1626] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 tabular-nums transition cursor-pointer shadow-sm active:scale-95'
            >
              <Heart className='w-3 h-3 sm:w-[17px] sm:h-[17px] text-rose-500 fill-rose-500 transition-transform' />
              {wishlist.length > 0 && (
                <span className='absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-rose-600 text-white text-[7px] sm:text-[8px] font-black min-w-[12px] h-[12px] sm:min-w-[14px] sm:h-[14px] px-0.5 rounded-full flex items-center justify-center shadow-sm ring-1 sm:ring-2 ring-[#07090e] leading-none'>
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* =============================== */}
            {/* =============================== */}
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
                  router.push('/profile'); // التعديل
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className='flex items-center gap-1.5 bg-slate-800/85 hover:bg-slate-700/80 text-slate-300 p-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition border border-slate-700/60 cursor-pointer'
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
      <LazyMount rootMargin='100px 0px' className='w-full min-h-10'>
        <StorePromoBanner />
      </LazyMount>
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      <TechShowcaseBanner />
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* 3. SECTION 1: HERO BANNER SLIDER */}
      <section
        id='top-picks-section'
        className=' mb-2 sm:mt-6 mb-3 relative w-full py-2 sm:py-4 bg-gradient-to-b from-[#070b14] via-[#0b1324] to-[#070b14] overflow-hidden border-b border-slate-800/80 text-[11px] sm:text-sm'
      >
        {/* Background Ambient Glows */}
        <div className=' absolute top-1/4 left-1/4 w-32 sm:w-96 h-32 sm:h-96 bg-blue-600/10 rounded-full blur-2xl sm:blur-3xl pointer-events-none' />
        <div className=' absolute bottom-1/4 right-1/4 w-32 sm:w-96 h-32 sm:h-96 bg-red-600/10 rounded-full blur-2xl sm:blur-3xl pointer-events-none' />

        <div className='max-w-7xl mx-auto px-2 sm:px-6 space-y-2 sm:space-y-4 relative z-10 '>
          {/* Header & Controls */}
          <div className='flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800/80 pb-2.5 sm:pb-3.5 gap-2.5 sm:gap-4 mt-5'>
            <div className='flex items-start sm:items-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2 min-w-0'>
              <div className='p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-red-600 to-blue-600 text-white shadow-lg shrink-0 mt-0.5 sm:mt-0'>
                <Zap className='w-3.5 h-3.5 sm:w-5 sm:h-5 text-white' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug break-words'>
                  Top Picks & Favorites
                </h1>
                <p className='text-[10px] sm:text-xs text-slate-300/85 mt-0.5 leading-relaxed break-words'>
                  اختيارات العملاء الأكثر طلباً وتميزاً بجودة عالية وتجربة
                  مضمونة
                </p>
              </div>
            </div>

            {/* Slider Controls + Numbered Pagination (> 6 items) */}
            {heroProducts.length > 0 && !loading && (
              <div className='flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 self-end lg:self-auto shrink-0'>
                {heroProducts.length > HERO_ITEMS_PER_PAGE && (
                  <div
                    dir='ltr'
                    className='flex items-center gap-1 sm:gap-2 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#0b1324]/95 border border-cyan-500/30 shadow-lg shadow-blue-950/35 backdrop-blur-xl max-w-full'
                  >
                    {/* شارة توضح المعروض حالياً من الإجمالي */}
                    <div className='flex items-center gap-1 pr-1.5 sm:gap-1.5 sm:pr-2 border-r border-slate-800 shrink-0'>
                      <span className='w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping' />
                      <span className='text-[9px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap'>
                        Showing{' '}
                        <span className='font-black text-cyan-300'>
                          {heroStartIndex + 1}–{heroEndIndex}
                        </span>{' '}
                        of{' '}
                        <span className='font-black text-white'>
                          {heroProducts.length}
                        </span>
                      </span>
                    </div>

                    {/* أرقام الصفحات */}
                    <div className='flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-[115px] sm:max-w-none py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                      {Array.from({ length: totalHeroPages }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === safeHeroPage;

                        return (
                          <button
                            key={`hero-page-${pageNum}`}
                            type='button'
                            onClick={() => handleHeroPageChange(pageNum)}
                            aria-current={isActive ? 'page' : undefined}
                            title={`صفحة ${pageNum}`}
                            className={`min-w-[21px] h-[21px] sm:min-w-[28px] sm:h-[28px] px-1 sm:px-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white shadow-md shadow-rose-500/30 scale-105 border border-cyan-300/40'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/40 active:scale-95'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pause / Resume Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById(
                      'hero-slider-ref',
                    ) as HTMLDivElement | null;
                    if (!slider) return;

                    const currentlyPaused =
                      slider.dataset.manualPaused === 'true' ||
                      slider.dataset.isPaused === 'true';
                    const nextPaused = !currentlyPaused;

                    setSliderPauseState(slider, nextPaused, true);
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
                        if (
                          slider.isConnected &&
                          slider.dataset.manualPaused !== 'true'
                        ) {
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
                        if (
                          slider.isConnected &&
                          slider.dataset.manualPaused !== 'true'
                        ) {
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
          ) : paginatedHeroProducts.length === 0 ? null : (
            <div
              key={`hero-page-wrap-${safeHeroPage}-${heroPageAnimKey}`}
              className='relative animate-in fade-in slide-in-from-bottom-2 duration-300'
            >
              <div
                id='hero-slider-ref'
                dir='ltr'
                onTouchStart={handleSliderTempPause}
                onTouchEnd={(e) => handleSliderTempResume(e, 0)}
                onTouchCancel={(e) => handleSliderTempResume(e, 0)}
                onMouseEnter={handleSliderTempPause}
                onMouseLeave={(e) => handleSliderTempResume(e, 0)}
                ref={(node) => {
                  if (!node || node.dataset.initAuto === 'true') return;

                  node.dataset.initAuto = 'true';
                  node.dataset.isPaused = 'false';
                  node.dataset.manualPaused = 'false';

                  if (paginatedHeroProducts.length < 3) return;

                  let groupWidth = 0;
                  let lastTime = 0;

                  let frameId = 0;
                  let isVisible = false;
                  let animate = (_time: number) => {};
                  const observer =
                    typeof IntersectionObserver !== 'undefined'
                      ? new IntersectionObserver(
                          (entries) => {
                            isVisible = entries.some(
                              (entry) => entry.isIntersecting,
                            );
                            if (isVisible && frameId === 0) {
                              frameId = requestAnimationFrame(animate);
                            } else if (!isVisible && frameId !== 0) {
                              cancelAnimationFrame(frameId);
                              frameId = 0;
                            }
                          },
                          { rootMargin: '180px 0px' },
                        )
                      : null;

                  animate = (time: number) => {
                    frameId = 0;
                    if (!node.isConnected) {
                      observer?.disconnect();
                      return;
                    }
                    if (!isVisible && observer) return;
                    if (
                      window.matchMedia('(prefers-reduced-motion: reduce)')
                        .matches
                    )
                      return;

                    const centerGroup = node.querySelector<HTMLElement>(
                      '[data-hero-group="1"]',
                    );

                    if (centerGroup) {
                      const newWidth =
                        centerGroup.getBoundingClientRect().width;

                      if (newWidth > 0 && Math.abs(newWidth - groupWidth) > 1) {
                        groupWidth = newWidth;
                        node.scrollLeft = groupWidth;
                      }

                      if (groupWidth > 0) {
                        const delta = lastTime
                          ? Math.min(time - lastTime, 40)
                          : 0;

                        if (
                          node.dataset.isPaused !== 'true' &&
                          node.dataset.manualPaused !== 'true'
                        ) {
                          node.scrollLeft += (35 * delta) / 1000;
                        }

                        const maxScroll = Math.max(
                          0,
                          node.scrollWidth - node.clientWidth,
                        );
                        const rightBoundary = Math.min(
                          groupWidth * 2,
                          maxScroll,
                        );

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
                    }

                    lastTime = time;
                    frameId = requestAnimationFrame(animate);
                  };

                  if (observer) observer.observe(node);
                  else {
                    isVisible = true;
                    frameId = requestAnimationFrame(animate);
                  }
                }}
                className='flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-2 px-1 touch-pan-x touch-pan-y overscroll-x-none overscroll-y-auto select-none'
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'auto',
                }}
              >
                <div className='flex w-max'>
                  {Array.from(
                    { length: paginatedHeroProducts.length >= 3 ? 3 : 1 },
                    (_, copy) => (
                      <div
                        key={`hero-group-${copy}`}
                        data-hero-group={copy}
                        aria-hidden={
                          paginatedHeroProducts.length >= 3 && copy !== 1
                        }
                        className='flex shrink-0 items-center gap-3 sm:gap-5 pr-3 sm:pr-5'
                      >
                        {paginatedHeroProducts.map((product, productIndex) => {
                          const globalItemNumber =
                            heroStartIndex + productIndex + 1;
                          const isInitialHeroImage =
                            safeHeroPage === 1 &&
                            productIndex === 0 &&
                            copy ===
                              (paginatedHeroProducts.length >= 3 ? 1 : 0);
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
                              key={`hero-${safeHeroPage}-${copy}-${product.slug}`}
                              href={`/products/${product.slug}`}
                              prefetch={false}
                              tabIndex={
                                paginatedHeroProducts.length < 3 || copy === 1
                                  ? undefined
                                  : -1
                              }
                              className='w-[240px] sm:w-[320px] shrink-0 bg-[#0e172a]/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-800/90 shadow-xl overflow-hidden hover:border-blue-500/50 transition duration-300 group flex flex-col justify-between cursor-pointer'
                            >
                              <div>
                                <div className='w-full h-56 sm:h-68 bg-slate-950 relative overflow-hidden border-b border-slate-800/80 group'>
                                  {displayImage ? (
                                    <div className='relative w-full h-full flex items-center justify-center'>
                                      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                                        <Image
                                          src={displayImage}
                                          alt=''
                                          fill
                                          sizes='(max-width: 768px) 240px, 320px'
                                          loading={
                                            isInitialHeroImage
                                              ? 'eager'
                                              : 'lazy'
                                          }
                                          unoptimized={
                                            typeof displayImage === 'string' &&
                                            (displayImage.startsWith('blob:') ||
                                              displayImage.startsWith('data:'))
                                          }
                                          className='w-full h-full object-cover filter blur-2xl opacity-40 scale-125'
                                        />
                                        <div className='absolute inset-0 bg-slate-950/40' />
                                      </div>

                                      <Image
                                        src={displayImage}
                                        alt={product.name || 'Product Image'}
                                        width={900}
                                        height={900}
                                        sizes='(max-width: 640px) 260px, 320px'
                                        loading={
                                          isInitialHeroImage ? 'eager' : 'lazy'
                                        }
                                        fetchPriority={
                                          isInitialHeroImage ? 'high' : 'auto'
                                        }
                                        unoptimized={
                                          typeof displayImage === 'string' &&
                                          (displayImage.startsWith('blob:') ||
                                            displayImage.startsWith('data:'))
                                        }
                                        className='relative z-10 w-full h-full object-contain p-1.5 sm:p-2 group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl'
                                      />

                                      <div className='absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none z-20' />
                                    </div>
                                  ) : (
                                    <div className='flex items-center justify-center h-full text-slate-600 text-[11px] font-medium'>
                                      No Image Available
                                    </div>
                                  )}

                                  {/* شارة مميزة + استيكر رقم الكارد */}
                                  <div className='absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5'>
                                    <span
                                      // dir='rtl'
                                      className='flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black tracking-wide shadow-md'
                                    >
                                      <Flame
                                        size={10}
                                        className='fill-white shrink-0'
                                      />{' '}
                                      الأكثر طلباً
                                    </span>

                                    <span
                                      title={`المنتج رقم ${globalItemNumber} من ${heroProducts.length}`}
                                      className='px-2 py-0.5 rounded-full bg-[#090f1d]/90 backdrop-blur-md border border-cyan-400/45 text-cyan-200 text-[10px] font-black tracking-tight shadow-md'
                                    >
                                      #{globalItemNumber}
                                    </span>
                                  </div>

                                  {/* زر المفضلة (Wishlist) */}
                                  <button
                                    type='button'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleWishlist(product);
                                    }}
                                    className={`absolute top-2.5 right-2.5 z-30 p-2 rounded-xl backdrop-blur-md border transition ${
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

                                <div className='p-3 sm:p-4 space-y-2'>
                                  <div className='flex items-center justify-between'>
                                    <span className='text-[9px] font-bold text-blue-400 uppercase tracking-widest block'>
                                      {(typeof product?.category === 'string' &&
                                        product.category.trim()) ||
                                        product?.category?.name ||
                                        product?.category_name ||
                                        product?.categoryName ||
                                        (typeof product?.categories ===
                                          'string' &&
                                          product.categories.trim()) ||
                                        product?.categories?.name ||
                                        'Hero Series'}
                                    </span>
                                    {!product.hide_stock_on_front && (
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
                                    )}
                                  </div>

                                  <h3 className='font-extrabold text-white line-clamp-1 text-xs sm:text-sm group-hover:text-blue-400 transition'>
                                    {product.name}
                                  </h3>

                                  <p className='text-[10px] sm:text-[11px] text-slate-400 leading-relaxed break-words'>
                                    {product.description ||
                                      'No description available for this product.'}
                                  </p>
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {(() => {
                                    const { hasDiscount, discountPercent } =
                                      getDiscountInfo(product);

                                    return (
                                      <div className='flex items-center justify-between gap-2 text-[11px] w-full'>
                                        {/* النجوم والتقييم */}
                                        <div className='flex items-center gap-1 shrink-0'>
                                          <div
                                            className='flex items-center'
                                            dir='ltr'
                                          >
                                            {[...Array(5)].map((_, i) => {
                                              const isFull = ratingVal >= i + 1;
                                              const isHalf =
                                                !isFull && ratingVal >= i + 0.5;

                                              return (
                                                <span
                                                  key={i}
                                                  className='relative inline-block w-[11px] h-[11px]'
                                                >
                                                  <Star
                                                    size={11}
                                                    className='text-slate-700 fill-slate-700'
                                                  />

                                                  {isFull && (
                                                    <Star
                                                      size={11}
                                                      className='absolute inset-0 text-amber-400 fill-amber-400'
                                                    />
                                                  )}

                                                  {isHalf && (
                                                    <span className='absolute inset-y-0 left-0 w-1/2 overflow-hidden'>
                                                      <Star
                                                        size={11}
                                                        className='text-amber-400 fill-amber-400'
                                                      />
                                                    </span>
                                                  )}
                                                </span>
                                              );
                                            })}
                                          </div>

                                          <span className='text-[9px] text-slate-400 font-medium'>
                                            ({Number(ratingVal).toFixed(1)})
                                          </span>
                                        </div>

                                        {/* بادج الخصم في الجهة الموازية */}
                                        {hasDiscount && discountPercent > 0 && (
                                          <span className='px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-600/20 text-rose-400 border border-rose-500/30 leading-none shrink-0 animate-pulse'>
                                            -{discountPercent}%
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {/* ========================= */}

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
                                          <span className='text-[8px]'>
                                            EGP
                                          </span>
                                        </span>
                                      )}
                                    </div>

                                    <div
                                      className='scale-75 origin-center inline-block'
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <LazyMount
                                        rootMargin='180px 0px'
                                        className='min-h-8 min-w-12 inline-flex items-center justify-center'
                                      >
                                        <ShareButton
                                          productSlug={product.slug}
                                          productName={product.name}
                                          productPrice={product.price}
                                          compareAtPrice={
                                            product.compare_at_price
                                          }
                                        />
                                      </LazyMount>
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
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}

      {/* Feature Highlights Grid Info */}

      {/* <div className='max-w-7xl mx-auto px-4 sm:px-6 my-10'>
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
      </div> */}

      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      <BenefitsBar />

      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}
      {/* =============================== */}

      {/* 1. Top Announcement Bar (متحرك بـ Animation خفيف ونار من الناحيتين) */}

      {/* Top Announcement Bar - Dynamic from Supabase */}
      {announcementBar?.enabled && announcementBar.text.trim() && (
        <div className='w-full mt-3 py-3 px-4 bg-[#07090e] flex items-center justify-center border-b border-slate-800/60'>
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
        <section
          id='deals-section'
          className='max-w-7xl mx-auto px-2 sm:px-6 my-3 sm:my-6 py-3 sm:py-5 border-b border-slate-800/80 relative'
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: '1px 760px',
          }}
        >
          {/* Header & Controls */}
          <div className='flex flex-col lg:flex-row lg:items-center justify-between mb-3 sm:mb-5 gap-3'>
            <div className='flex items-center gap-2 sm:gap-3'>
              <div className='p-2 bg-red-950/60 border border-red-500/30 rounded-xl text-red-500 shrink-0'>
                <Flame size={16} className='sm:w-5 sm:h-5 animate-pulse' />
              </div>
              <div>
                <h2 className='text-sm sm:text-xl font-black text-white tracking-tight flex items-center gap-2'>
                  Exclusive Deals & Offers ⚡
                </h2>
                <p className='text-[10px] sm:text-xs text-slate-300 mt-0.5'>
                  خصومات وعروض يوميه _ الكميه محدوده جدا
                </p>
              </div>
            </div>

            {/* Slider Controls + Numbered Pagination (> 6 items) */}
            {flashDeals.length > 0 && !loading && (
              <div className='flex flex-wrap items-center justify-end gap-2 self-end lg:self-auto shrink-0'>
                {flashDeals.length > FLASH_ITEMS_PER_PAGE && (
                  <div
                    dir='ltr'
                    className='flex items-center gap-1 sm:gap-2 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#0b1324]/95 border border-rose-500/30 shadow-lg shadow-red-950/30 backdrop-blur-xl max-w-full'
                  >
                    {/* عداد المعروض حالياً من الإجمالي */}
                    <div className='flex items-center gap-1 pr-1.5 sm:gap-1.5 sm:pr-2 border-r border-slate-800 shrink-0'>
                      <span className='w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping' />
                      <span className='text-[9px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap'>
                        Showing{' '}
                        <span className='font-black text-rose-300'>
                          {flashStartIndex + 1}–{flashEndIndex}
                        </span>{' '}
                        of{' '}
                        <span className='font-black text-white'>
                          {flashDeals.length}
                        </span>
                      </span>
                    </div>

                    {/* أرقام الصفحات */}
                    <div className='flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-[115px] sm:max-w-none py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                      {Array.from({ length: totalFlashPages }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === safeFlashPage;

                        return (
                          <button
                            key={`flash-page-${pageNum}`}
                            type='button'
                            onClick={() => handleFlashPageChange(pageNum)}
                            aria-current={isActive ? 'page' : undefined}
                            title={`صفحة ${pageNum}`}
                            className={`min-w-[21px] h-[21px] sm:min-w-[28px] sm:h-[28px] px-1 sm:px-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white shadow-md shadow-rose-500/30 scale-105 border border-cyan-300/40'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/40 active:scale-95'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pause / Resume Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById(
                      'flash-slider-ref',
                    ) as HTMLDivElement | null;
                    if (!slider) return;

                    const currentlyPaused =
                      slider.dataset.manualPaused === 'true' ||
                      slider.dataset.isPaused === 'true';
                    const nextPaused = !currentlyPaused;

                    setFlashSliderPauseState(slider, nextPaused, true);
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
                        if (
                          slider.isConnected &&
                          slider.dataset.manualPaused !== 'true'
                        ) {
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
                        if (
                          slider.isConnected &&
                          slider.dataset.manualPaused !== 'true'
                        ) {
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

          {/* Slider Container with flash */}
          <div
            key={`flash-page-wrap-${safeFlashPage}-${flashPageAnimKey}`}
            className='relative animate-in fade-in slide-in-from-bottom-2 duration-300'
          >
            <div
              id='flash-slider-ref'
              dir='ltr'
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') {
                  handleFlashMouseEnter(e);
                }
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') {
                  handleFlashMouseLeave(e);
                }
              }}
              onTouchStart={handleFlashTouchStart}
              onTouchEnd={handleFlashTouchEnd}
              onWheel={(e) => {
                handleFlashTempPause(e);
                handleFlashTempResume(e, 1200);
              }}
              ref={(node) => {
                if (!node || node.dataset.initAuto === 'true') return;

                node.dataset.initAuto = 'true';
                node.dataset.isPaused = 'false';
                node.dataset.manualPaused = 'false';
                node.dataset.mouseHovered = 'false';
                node.dataset.touchActive = 'false';

                if (paginatedFlashDeals.length < 3) return;

                let groupWidth = 0;
                let lastTime = 0;

                let frameId = 0;
                let isVisible = false;
                let animate = (_time: number) => {};
                const observer =
                  typeof IntersectionObserver !== 'undefined'
                    ? new IntersectionObserver(
                        (entries) => {
                          isVisible = entries.some(
                            (entry) => entry.isIntersecting,
                          );
                          if (isVisible && frameId === 0) {
                            frameId = requestAnimationFrame(animate);
                          } else if (!isVisible && frameId !== 0) {
                            cancelAnimationFrame(frameId);
                            frameId = 0;
                          }
                        },
                        { rootMargin: '180px 0px' },
                      )
                    : null;

                animate = (time: number) => {
                  frameId = 0;
                  if (!node.isConnected) {
                    observer?.disconnect();
                    return;
                  }
                  if (!isVisible && observer) return;
                  if (
                    window.matchMedia('(prefers-reduced-motion: reduce)')
                      .matches
                  )
                    return;

                  const centerGroup = node.querySelector<HTMLElement>(
                    '[data-flash-group="1"]',
                  );

                  if (centerGroup) {
                    const newWidth = centerGroup.getBoundingClientRect().width;

                    if (newWidth > 0 && Math.abs(newWidth - groupWidth) > 1) {
                      groupWidth = newWidth;
                      node.scrollLeft = groupWidth;
                    }

                    if (groupWidth > 0) {
                      const delta = lastTime
                        ? Math.min(time - lastTime, 40)
                        : 0;

                      const isPaused =
                        node.dataset.isPaused === 'true' ||
                        node.dataset.manualPaused === 'true' ||
                        node.dataset.mouseHovered === 'true' ||
                        node.dataset.touchActive === 'true';

                      if (!isPaused) {
                        node.scrollLeft += (40 * delta) / 1000;
                      }

                      const maxScroll = Math.max(
                        0,
                        node.scrollWidth - node.clientWidth,
                      );
                      const rightBoundary = Math.min(groupWidth * 2, maxScroll);

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
                  }

                  lastTime = time;
                  frameId = requestAnimationFrame(animate);
                };

                if (observer) observer.observe(node);
                else {
                  isVisible = true;
                  frameId = requestAnimationFrame(animate);
                }
              }}
              className='flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-2 px-1 touch-pan-x touch-pan-y overscroll-x-none overscroll-y-auto select-none'
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'auto',
              }}
            >
              <div className='flex w-max'>
                {Array.from(
                  { length: paginatedFlashDeals.length >= 3 ? 3 : 1 },
                  (_, copy) => (
                    <div
                      key={`flash-group-${copy}`}
                      data-flash-group={copy}
                      aria-hidden={
                        paginatedFlashDeals.length >= 3 && copy !== 1
                      }
                      className='flex shrink-0 items-center gap-2.5 sm:gap-4 pr-2.5 sm:pr-4'
                    >
                      {paginatedFlashDeals.map((item, itemIndex) => {
                        const globalFlashNumber =
                          flashStartIndex + itemIndex + 1;
                        const displayImage = item.image || item.images?.[0];
                        const isWish = wishlist.includes(item.id);

                        const oldPrice =
                          item.originalPrice ||
                          item.oldPrice ||
                          item.compare_at_price;

                        const stockQty =
                          item.stock_quantity ?? item.stock ?? 10;
                        const ratingVal = item.rating || 5;

                        return (
                          <Link
                            key={`flash-${safeFlashPage}-${copy}-${item.slug}`}
                            href={`/products/${item.slug}`}
                            prefetch={false}
                            tabIndex={
                              paginatedFlashDeals.length < 3 || copy === 1
                                ? undefined
                                : -1
                            }
                            className='w-[220px] sm:w-[260px] shrink-0 bg-[#0e1626]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:border-red-500/50 transition duration-300 group flex flex-col justify-between cursor-pointer'
                          >
                            <div>
                              <div className='relative w-full h-38 sm:h-48 bg-slate-900 border-b border-slate-800 overflow-hidden group'>
                                <Image
                                  src={
                                    displayImage ||
                                    'https://via.placeholder.com/300'
                                  }
                                  alt={item.name || 'Store Item'}
                                  width={600}
                                  height={600}
                                  sizes='(max-width: 640px) 220px, 260px'
                                  loading='lazy'
                                  className='w-full h-full object-scale-down object-center group-hover:scale-110 transition duration-500'
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

                                <div className='absolute top-2.5 left-2.5 flex items-center gap-1.5'>
                                  <span
                                    dir='rtl'
                                    className='inline-flex items-center whitespace-nowrap bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md tracking-wide shadow-md'
                                  >
                                    لفترة محدودة جداً
                                  </span>
                                  <span
                                    title={`عرض رقم ${globalFlashNumber} من ${flashDeals.length}`}
                                    className='px-1.5 py-0.5 rounded-md bg-[#090f1d]/90 backdrop-blur-md border border-rose-400/40 text-rose-200 text-[10px] font-black tracking-tight shadow-md'
                                  >
                                    #{globalFlashNumber}
                                  </span>
                                </div>
                              </div>

                              <div className='p-3 sm:p-3.5 space-y-1.5'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-[9px] font-bold text-red-400 uppercase tracking-wider block'>
                                    {(typeof item?.category === 'string' &&
                                      item.category.trim()) ||
                                      item?.category?.name ||
                                      item?.category_name ||
                                      item?.categoryName ||
                                      (typeof item?.categories === 'string' &&
                                        item.categories.trim()) ||
                                      item?.categories?.name ||
                                      'Special Offer'}
                                  </span>

                                  {!item.hide_stock_on_front && (
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
                                  )}
                                </div>

                                <h3 className='font-bold text-xs sm:text-sm text-slate-100 line-clamp-1 group-hover:text-red-400 transition'>
                                  {item.name}
                                </h3>

                                <p className='text-[10px] text-slate-400 leading-relaxed break-words'>
                                  {item.description ||
                                    'Limited time flash deal offer available now.'}
                                </p>
                                {/* ============================= */}
                                {/* ============================= */}
                                {/* ============================= */}
                                {/* ============================= */}
                                {/* ============================= */}
                                {/* ============================= */}
                                {(() => {
                                  const { hasDiscount, discountPercent } =
                                    getDiscountInfo(item);

                                  return (
                                    <div className='flex items-center justify-between gap-2 text-amber-400 text-[11px] pt-0.5 w-full'>
                                      {/* النجوم والتقييم */}
                                      <div className='flex items-center gap-1 shrink-0'>
                                        <div
                                          className='flex items-center'
                                          dir='ltr'
                                        >
                                          {[...Array(5)].map((_, i) => {
                                            const isFull = ratingVal >= i + 1;
                                            const isHalf =
                                              !isFull && ratingVal >= i + 0.5;

                                            return (
                                              <span
                                                key={i}
                                                className='relative inline-block w-[11px] h-[11px]'
                                              >
                                                <Star
                                                  size={11}
                                                  className='text-slate-700 fill-slate-700'
                                                />

                                                {isFull && (
                                                  <Star
                                                    size={11}
                                                    className='absolute inset-0 text-amber-400 fill-amber-400'
                                                  />
                                                )}

                                                {isHalf && (
                                                  <span className='absolute inset-y-0 left-0 w-1/2 overflow-hidden'>
                                                    <Star
                                                      size={11}
                                                      className='text-amber-400 fill-amber-400'
                                                    />
                                                  </span>
                                                )}
                                              </span>
                                            );
                                          })}
                                        </div>

                                        <span className='text-[9px] text-slate-400 font-medium'>
                                          ({Number(ratingVal).toFixed(1)})
                                        </span>
                                      </div>

                                      {/* بادج الخصم في الجهة الموازية */}
                                      {hasDiscount && discountPercent > 0 && (
                                        <span className='px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-600/20 text-rose-400 border border-rose-500/30 leading-none shrink-0 animate-pulse'>
                                          -{discountPercent}%
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                                {/* ============================= */}
                                {/* ============================= */}
                                {/* ============================= */}
                                {/* ============================= */}
                                {/* ============================= */}

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
                                    <LazyMount
                                      rootMargin='180px 0px'
                                      className='min-h-8 min-w-12 inline-flex items-center justify-center'
                                    >
                                      <ShareButton
                                        productSlug={item.slug}
                                        productName={item.name}
                                        productPrice={item.price}
                                        compareAtPrice={item.compare_at_price}
                                      />
                                    </LazyMount>
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
                  ),
                )}
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

      {/* 5. SECTION 3: MAIN CATALOG & SLIDER SECTION (الكاتالوج الكامل مع تحكم كامل، فلتر التصنيفات، حركة بطيئة جداً، وأزرار تحكم) */}

      {/* 5. SECTION 3: MAIN CATALOG & SLIDER SECTION - Ultra Compact & Optimized */}

      {/* 5. SECTION 3: MAIN CATALOG & SLIDER SECTION - Final Smooth Infinite */}
      <main
        // id='catalog-section'
        id='products-grid'
        ref={catalogSectionRef}
        className='max-w-7xl mx-auto px-2 sm:px-4 my-2 sm:my-4 py-2 sm:py-4 space-y-3 sm:space-y-4'
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}
      >
        {/* Section Title & Slider Controls + Pagination (> 6 items) */}
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800 pb-2.5'>
          <div className='min-w-0 flex-1'>
            <h2 className='text-sm sm:text-lg font-black text-white tracking-tight'>
              {searchQuery
                ? `Search Results: "${searchQuery}"`
                : 'Our Complete Product Catalog 🏷️'}
            </h2>

            <p className='text-[9px] sm:text-[11px] text-slate-300'>
              تصفّح جميع المنتجات بسهولة تامة ومعاينة فورية للأسعار والتفاصيل
            </p>
          </div>

          <div className='flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 shrink-0 self-end lg:self-auto'>
            {catalogLoaded &&
              filteredCatalogProducts.length > CATALOG_ITEMS_PER_PAGE && (
                <div
                  dir='ltr'
                  className='flex items-center gap-1 sm:gap-2 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#0b1324]/95 border border-cyan-500/30 shadow-md backdrop-blur-xl max-w-full'
                >
                  <div className='flex items-center gap-1 pr-1.5 sm:pr-2 border-r border-slate-800 shrink-0'>
                    <span className='w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse' />
                    <span className='text-[9px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap'>
                      Showing{' '}
                      <span className='font-black text-cyan-300'>
                        {catalogStartIndex + 1}–{catalogEndIndex}
                      </span>{' '}
                      of{' '}
                      <span className='font-black text-white'>
                        {filteredCatalogProducts.length}
                      </span>
                    </span>
                  </div>

                  <div className='flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-[110px] sm:max-w-none py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                    {Array.from({ length: totalCatalogPages }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === safeCatalogPage;

                      return (
                        <button
                          key={`catalog-page-${pageNum}`}
                          type='button'
                          onClick={() => handleCatalogPageChange(pageNum)}
                          aria-current={isActive ? 'page' : undefined}
                          title={`صفحة ${pageNum}`}
                          className={`min-w-[21px] h-[21px] sm:min-w-[26px] sm:h-[26px] px-1 rounded-lg text-[10px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white shadow-sm shadow-rose-500/30 scale-105 border border-cyan-300/40'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/40 active:scale-95'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {catalogLoaded && catalogProducts.length > 0 && (
              <div className='flex items-center gap-1.5'>
                {/* Pause / Resume Button */}
                <button
                  type='button'
                  onClick={() => {
                    const slider = document.getElementById(
                      'catalog-slider-ref',
                    ) as HTMLDivElement | null;

                    const currentlyPaused =
                      slider?.dataset.manualPaused === 'true' ||
                      slider?.dataset.isPaused === 'true' ||
                      Boolean(isCatalogPaused);

                    const nextPaused = !currentlyPaused;

                    if (slider) {
                      slider.dataset.manualPaused = nextPaused
                        ? 'true'
                        : 'false';
                      slider.dataset.isPaused = nextPaused ? 'true' : 'false';
                    }

                    setCatalogSliderPauseState(nextPaused, true);
                  }}
                  className='p-1.5 sm:p-2 rounded-lg bg-gradient-to-tr from-red-600/90 to-blue-600/90 hover:from-red-500 hover:to-blue-500 border border-blue-500/30 text-white shadow transition-all transform active:scale-95 cursor-pointer flex items-center justify-center'
                  title={isCatalogPaused ? 'Resume Catalog' : 'Pause Catalog'}
                >
                  {isCatalogPaused ? (
                    <Play size={14} className='sm:w-4 sm:h-4' />
                  ) : (
                    <Pause size={14} className='sm:w-4 sm:h-4' />
                  )}
                </button>

                {/* Previous */}
                <button
                  type='button'
                  onClick={() => {
                    const slider =
                      document.getElementById('catalog-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    const maxScroll = Math.max(
                      0,
                      slider.scrollWidth - slider.clientWidth,
                    );
                    const target = Math.max(
                      0,
                      Math.min(maxScroll, slider.scrollLeft - 260),
                    );
                    if (
                      window.matchMedia('(prefers-reduced-motion: reduce)')
                        .matches
                    ) {
                      slider.scrollLeft = target;
                      return;
                    }
                    slider.dataset.manualTarget = String(target);

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                          delete slider.dataset.manualTarget;
                        }
                      }, 1500),
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
                    const slider =
                      document.getElementById('catalog-slider-ref');
                    if (!slider) return;

                    slider.dataset.isPaused = 'true';
                    if (slider.dataset.resumeTimer) {
                      clearTimeout(Number(slider.dataset.resumeTimer));
                    }

                    const maxScroll = Math.max(
                      0,
                      slider.scrollWidth - slider.clientWidth,
                    );
                    const target = Math.max(
                      0,
                      Math.min(maxScroll, slider.scrollLeft + 260),
                    );
                    if (
                      window.matchMedia('(prefers-reduced-motion: reduce)')
                        .matches
                    ) {
                      slider.scrollLeft = target;
                      return;
                    }
                    slider.dataset.manualTarget = String(target);

                    slider.dataset.resumeTimer = String(
                      window.setTimeout(() => {
                        if (slider.isConnected) {
                          slider.dataset.isPaused = 'false';
                          delete slider.dataset.manualTarget;
                        }
                      }, 1500),
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

        {/* Animated Search Bar + Attached Rating & Price Range Filter */}
        <div className='relative z-30 space-y-2'>
          <div className='relative group rounded-2xl p-[1px] bg-gradient-to-r from-red-500/40 via-blue-500/45 to-cyan-400/40 shadow-lg shadow-blue-950/30 transition-all duration-300 focus-within:from-red-500 focus-within:via-blue-500 focus-within:to-cyan-400'>
            <div className='flex items-stretch rounded-2xl bg-[#0a1120]/95 backdrop-blur-xl overflow-hidden'>
              {/* حقل البحث باسم المنتج */}
              <div className='relative flex-1 flex items-center min-w-0'>
                <span className='pl-3 pr-2 text-cyan-400/90 group-focus-within:scale-110 group-focus-within:text-cyan-300 transition-transform duration-300 select-none text-xs sm:text-sm'>
                  🔍
                </span>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCatalogPage(1);
                  }}
                  placeholder='ابحث باسم المنتج أو بسعر محدد (مثال: 500)...'
                  className='w-full bg-transparent py-2 sm:py-2.5 pr-2 text-[11px] sm:text-xs text-white placeholder:text-slate-400 focus:outline-none'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchQuery('');
                      setCatalogPage(1);
                    }}
                    className='px-2 text-[10px] text-slate-400 hover:text-rose-300 transition cursor-pointer'
                    title='مسح البحث'
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* زر Sort الصغير اللازق بجانب الفلتر */}
              <button
                type='button'
                onClick={() => {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  setCatalogPage(1);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setSortHighlight((prev) =>
                    prev === 'green' ? 'red' : 'green',
                  );
                }}
                title={
                  sortOrder === 'asc'
                    ? 'ترتيب تصاعدي (دبل كليك لتبديل اللون أخضر/أحمر)'
                    : 'ترتيب تنازلي (دبل كليك لتبديل اللون أخضر/أحمر)'
                }
                className={`px-2 sm:px-2.5 border-l border-slate-800/90 flex items-center gap-1 text-[10px] sm:text-xs font-extrabold transition-all duration-200 cursor-pointer shrink-0 select-none ${
                  sortHighlight === 'green'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : sortHighlight === 'red'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-[#0c1526] hover:bg-[#121f38] text-slate-200 hover:text-white'
                }`}
              >
                <span>Sort</span>
                <span
                  className={`text-[11px] font-black leading-none transition-transform duration-200 ${
                    sortHighlight === 'green'
                      ? 'text-emerald-400'
                      : sortHighlight === 'red'
                        ? 'text-rose-400'
                        : sortOrder === 'asc'
                          ? 'text-cyan-300'
                          : 'text-amber-300'
                  }`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              </button>

              {/* زر الفلتر اللازق مباشرة بالسيرش بار */}
              <button
                type='button'
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className={`px-2.5 sm:px-3.5 border-l border-slate-800/90 flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold transition-all duration-300 cursor-pointer shrink-0 ${
                  filterMenuOpen || activeExtraFiltersCount > 0
                    ? 'bg-gradient-to-r from-red-600/30 via-blue-600/30 to-cyan-500/25 text-cyan-200'
                    : 'bg-[#0e182c] hover:bg-[#13203a] text-slate-200 hover:text-white'
                }`}
              >
                <span className='text-amber-400 text-xs'>★</span>
                <span>فلتر السعر والتقييم</span>
                {activeExtraFiltersCount > 0 && (
                  <span className='px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-blue-600 text-white text-[9px] font-black leading-none'>
                    {activeExtraFiltersCount}
                  </span>
                )}
                <span
                  className={`text-[10px] transition-transform duration-300 ${
                    filterMenuOpen ? 'rotate-180 text-cyan-300' : ''
                  }`}
                >
                  ▾
                </span>
              </button>
            </div>
          </div>

          {/* لوحة الفلترة اللازقة: تقييم النجوم (بالأنصاص والكسور) + رينج السعر */}
          {filterMenuOpen && (
            <div className='rounded-2xl bg-[#0b1324]/98 border border-cyan-500/30 p-3 sm:p-4 shadow-2xl shadow-blue-950/50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-3'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {/* تقييم النجوم (يدعم 3.4 و 4 و 4.5 والأنصاص) */}
                <div className='space-y-1.5 rounded-xl bg-[#070d19]/90 border border-slate-800/90 p-2.5'>
                  <div className='flex items-center justify-between gap-2'>
                    <label className='text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-1'>
                      <span>⭐</span>
                      <span>اختر الحد الأدنى لتقييم المنتج</span>
                    </label>
                    <span className='text-[10px] font-black text-cyan-300'>
                      {minRatingFilter > 0
                        ? `${minRatingFilter.toFixed(1)}+`
                        : 'الكل'}
                    </span>
                  </div>

                  {/* اختيارات سريعة + حقل رقمي للكسور الدقيقة */}
                  <div className='flex flex-wrap items-center gap-1.5 pt-0.5'>
                    {[
                      { label: 'الكل', val: 0 },
                      { label: '3.0+', val: 3 },
                      { label: '3.5+', val: 3.4 },
                      { label: '4.0+', val: 4 },
                      { label: '4.5+', val: 4.5 },
                    ].map((opt) => {
                      const selected =
                        Math.abs(minRatingFilter - opt.val) < 0.001;
                      return (
                        <button
                          key={opt.label}
                          type='button'
                          onClick={() => {
                            setMinRatingFilter(opt.val);
                            setCatalogPage(1);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            selected
                              ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow'
                              : 'bg-slate-900 text-slate-300 hover:text-amber-300 border border-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}

                    <input
                      type='number'
                      step='0.5'
                      min='0'
                      max='5'
                      value={minRatingFilter || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setMinRatingFilter(
                          Number.isFinite(val)
                            ? Math.min(5, Math.max(0, val))
                            : 0,
                        );
                        setCatalogPage(1);
                      }}
                      placeholder='مثال 3.5'
                      className='w-20 rounded-lg bg-slate-900 border border-slate-700/90 px-2 py-1 text-[10px] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                </div>

                {/* السعر أو رينج السعر (من - إلى) */}
                <div className='space-y-1.5 rounded-xl bg-[#070d19]/90 border border-slate-800/90 p-2.5'>
                  <div className='flex items-center justify-between gap-2'>
                    <label className='text-[10px] sm:text-xs font-bold text-cyan-300 flex items-center gap-1'>
                      <span>💰</span>
                      <span>نطاق السعر (EGP)</span>
                    </label>
                    <span className='text-[10px] text-slate-400'>
                      {minPriceFilter || maxPriceFilter
                        ? `${minPriceFilter || '0'} — ${maxPriceFilter || '∞'}`
                        : 'أي سعر'}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-2 pt-0.5'>
                    <input
                      type='number'
                      min='0'
                      value={minPriceFilter}
                      onChange={(e) => {
                        setMinPriceFilter(e.target.value);
                        setCatalogPage(1);
                      }}
                      placeholder='من سعر (مثال 100)'
                      className='w-full rounded-lg bg-slate-900 border border-slate-700/90 px-2.5 py-1.5 text-[10px] sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400'
                    />
                    <input
                      type='number'
                      min='0'
                      value={maxPriceFilter}
                      onChange={(e) => {
                        setMaxPriceFilter(e.target.value);
                        setCatalogPage(1);
                      }}
                      placeholder='إلى سعر (مثال 1500)'
                      className='w-full rounded-lg bg-slate-900 border border-slate-700/90 px-2.5 py-1.5 text-[10px] sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between pt-1 border-t border-slate-800/80'>
                <span className='text-[10px] text-slate-400'>
                  النتائج المطابقة:{' '}
                  <strong className='text-cyan-300'>
                    {filteredCatalogProducts.length}
                  </strong>
                </span>
                <div className='flex items-center gap-2'>
                  {activeExtraFiltersCount > 0 && (
                    <button
                      type='button'
                      onClick={() => {
                        setMinRatingFilter(0);
                        setMinPriceFilter('');
                        setMaxPriceFilter('');
                        setCatalogPage(1);
                      }}
                      className='px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-[10px] font-bold text-rose-200 transition cursor-pointer'
                    >
                      إعادة ضبط الفلتر
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={() => setFilterMenuOpen(false)}
                    className='px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 transition cursor-pointer'
                  >
                    تم
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Filter Cards (3 Rows Max + Show More Compact Modal) */}
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-[9px] sm:text-[10px] font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1'>
              ⚡ Filter by Categories:
            </span>
            <span className='text-[9px] text-slate-400'>
              {categories.length} تصنيف
            </span>
          </div>

          <div className='grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1 sm:gap-1.5'>
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}

            {/* All Categories */}
            {(() => {
              const allCount = products.filter(
                (product) => product.show_in_catalog === true,
              ).length;

              const isAllSelected =
                selectedCategory === 'All' ||
                selectedCategory === 'الكل' ||
                !selectedCategory;

              const shuffleArray = <T,>(arr: T[]): T[] => {
                const copy = [...arr];
                for (let i = copy.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [copy[i], copy[j]] = [copy[j], copy[i]];
                }
                return copy;
              };

              const getBalancedCategoryMix = (list: any[]) => {
                const grouped = new Map<string, any[]>();

                shuffleArray(list).forEach((entry) => {
                  const catKey = String(
                    entry?.category_id ??
                      entry?.category?.id ??
                      entry?.category?.name ??
                      entry?.category ??
                      'uncategorized',
                  );
                  if (!grouped.has(catKey)) {
                    grouped.set(catKey, []);
                  }
                  grouped.get(catKey)!.push(entry);
                });

                const buckets = shuffleArray(Array.from(grouped.values()));
                const result: any[] = [];
                let hasMore = true;
                let index = 0;

                while (hasMore) {
                  hasMore = false;
                  for (const bucket of buckets) {
                    if (index < bucket.length) {
                      result.push(bucket[index]);
                      hasMore = true;
                    }
                  }
                  index++;
                }

                return result;
              };

              return (
                <button
                  type='button'
                  onClick={() => {
                    setSelectedCategory('All');
                    setCatalogPage(1);
                    if (typeof setProducts === 'function') {
                      setProducts((prev: any[]) =>
                        getBalancedCategoryMix(prev),
                      );
                    }
                  }}
                  className={`p-1 sm:p-1.5 rounded-lg border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-0.5 ${
                    isAllSelected
                      ? 'bg-gradient-to-br from-red-600 to-blue-600 border-transparent text-white shadow'
                      : 'bg-[#0e1626]/90 hover:bg-[#141d2f] border-slate-800 text-slate-300'
                  }`}
                >
                  <span className='text-[9px] sm:text-[10px] font-bold truncate w-full'>
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
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}
            {/* Displayed Categories Within 3 Rows */}
            {displayedGridCategories.map((cat) => {
              const catName = typeof cat === 'object' ? cat.name : cat;
              const catId = typeof cat === 'object' ? cat.id : cat;

              const count =
                categoryCounts.get(String(catId)) ??
                categoryCounts.get(String(catName)) ??
                0;

              const isSelected =
                selectedCategory === catName ||
                selectedCategory === catId ||
                selectedCategory === cat;

              return (
                <button
                  key={`cat-box-${catId || catName}`}
                  type='button'
                  onClick={() => {
                    setSelectedCategory(catName);
                    setCatalogPage(1);
                  }}
                  className={`p-1 sm:p-1.5 rounded-lg border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-0.5 ${
                    isSelected
                      ? 'bg-gradient-to-br from-red-600 to-blue-600 border-transparent text-white shadow'
                      : 'bg-[#0e1626]/90 hover:bg-[#141d2f] border-slate-800 text-slate-300'
                  }`}
                >
                  <span className='text-[9px] sm:text-[10px] font-bold truncate w-full'>
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

            {/* Show More Card (يظهر كالبوكس السادس على الموبايل بشكل مميز ومتحرك) */}
            {hasExtraCategories && (
              <button
                type='button'
                onClick={() => setIsMoreCategoriesOpen(true)}
                className='group relative p-1.5 sm:p-2 rounded-xl border border-rose-400/50 bg-gradient-to-br from-rose-600/35 via-[#0e1626] to-blue-600/35 hover:from-rose-500/50 hover:to-blue-500/50 hover:border-cyan-300/80 text-white transition-all duration-300 active:scale-95 cursor-pointer flex flex-col justify-between gap-1 shadow-lg shadow-rose-950/30 overflow-hidden'
                title='عرض باقي التصنيفات'
              >
                {/* وميض ضوئي يمر على الكارت */}
                <span className='pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent' />

                <span className='relative z-10 text-[10px] sm:text-xs font-extrabold truncate w-full flex items-center justify-between gap-1'>
                  <span className='bg-gradient-to-r from-rose-300 via-white to-cyan-300 bg-clip-text text-transparent'>
                    Show More
                  </span>
                  <span className='text-[9px] px-1.5 py-0.5 rounded-md bg-rose-500/25 border border-rose-400/35 text-rose-200 font-black animate-pulse'>
                    +{overflowCategories.length}
                  </span>
                </span>

                <div className='relative z-10 flex items-center justify-between text-[9px] text-slate-200'>
                  <span className='font-semibold text-cyan-200'>المزيد</span>
                  <span className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-400/15 text-cyan-300 group-hover:translate-x-0.5 transition-transform animate-bounce'>
                    ⚡
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* موديل صغير جداً لباقي التصنيفات مع سكرول وعددهم فوق */}
        {isMoreCategoriesOpen && (
          <div
            onClick={() => setIsMoreCategoriesOpen(false)}
            className='fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150'
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className='w-full max-w-[330px] rounded-2xl bg-[#0c1426] border border-cyan-500/35 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150'
            >
              {/* رأس الموديل: عدد التصنيفات الإضافية + خروج سريع */}
              <div className='flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-[#080e1b]'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-black text-white'>
                    باقي التصنيفات
                  </span>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-400/30'>
                    {overflowCategories.length}
                  </span>
                </div>
                <button
                  type='button'
                  onClick={() => setIsMoreCategoriesOpen(false)}
                  aria-label='إغلاق'
                  className='w-6 h-6 rounded-lg bg-slate-800/90 hover:bg-rose-600/80 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center transition cursor-pointer'
                >
                  ✕
                </button>
              </div>

              {/* قائمة التصنيفات القابلة للسكرول */}
              <div className='max-h-56 overflow-y-auto p-2.5 space-y-1.5'>
                {overflowCategories.map((cat) => {
                  const catName = typeof cat === 'object' ? cat.name : cat;
                  const catId = typeof cat === 'object' ? cat.id : cat;
                  const count =
                    categoryCounts.get(String(catId)) ??
                    categoryCounts.get(String(catName)) ??
                    0;
                  const isSelected =
                    selectedCategory === catName ||
                    selectedCategory === catId ||
                    selectedCategory === cat;

                  return (
                    <button
                      key={`modal-cat-${catId || catName}`}
                      type='button'
                      onClick={() => {
                        setSelectedCategory(catName);
                        setCatalogPage(1);
                        setIsMoreCategoriesOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-600 to-blue-600 border-transparent text-white font-bold'
                          : 'bg-[#0e182c] hover:bg-[#15223d] border-slate-800 text-slate-200'
                      }`}
                    >
                      <span className='text-xs font-bold truncate'>
                        {catName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-900 text-cyan-300'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Products Slider */}
        {catalogLoading ? (
          <div className='py-12 flex flex-col items-center justify-center text-slate-400 space-y-1.5'>
            <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
            <p className='text-[10px] font-medium'>Loading catalog...</p>
          </div>
        ) : catalogLoadFailed ? (
          <div className='text-center py-8 bg-[#0e1626]/90 rounded-xl border border-slate-800 shadow max-w-xs mx-auto space-y-2'>
            <p className='text-xs font-bold text-white'>
              Could not load the catalog
            </p>
            <button
              type='button'
              onClick={() => setCatalogRetryKey((key) => key + 1)}
              className='px-3 py-1.5 bg-gradient-to-r from-red-600 to-blue-600 text-white text-[10px] font-bold rounded-lg cursor-pointer'
            >
              Try Again
            </button>
          </div>
        ) : !catalogLoaded ? (
          <div className='py-12 flex flex-col items-center justify-center text-slate-500 space-y-1.5'>
            <ShoppingBag className='w-6 h-6 text-slate-700' />
            <p className='text-[10px] font-medium'>
              The catalog loads as you reach this section.
            </p>
          </div>
        ) : filteredCatalogProducts.length === 0 ? (
          <div className='text-center py-8 bg-[#0e1626]/90 rounded-xl border border-slate-800 shadow max-w-xs mx-auto space-y-2'>
            <ShoppingBag size={28} className='mx-auto text-slate-600' />
            <p className='text-xs font-bold text-white'>No products found</p>
            <button
              type='button'
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setMinRatingFilter(0);
                setMinPriceFilter('');
                setMaxPriceFilter('');
                setCatalogPage(1);
              }}
              className='px-3 py-1.5 bg-gradient-to-r from-red-600 to-blue-600 text-white text-[10px] font-bold rounded-lg cursor-pointer'
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            key={`catalog-page-wrap-${safeCatalogPage}-${catalogPageAnimKey}`}
            className='relative animate-in fade-in slide-in-from-bottom-2 duration-300'
          >
            <div
              id='catalog-slider-ref'
              dir='ltr'
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') {
                  const el = e.currentTarget;
                  el.dataset.isPaused = 'true';
                  handleCatalogMouseEnter();
                }
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') {
                  const el = e.currentTarget;
                  if (el.dataset.manualPaused !== 'true') {
                    el.dataset.isPaused = 'false';
                  }
                  handleCatalogMouseLeave();
                }
              }}
              onTouchStart={(e) => {
                const el = e.currentTarget;
                el.dataset.isPaused = 'true';
                handleCatalogPause();
              }}
              onTouchEnd={(e) => {
                const el = e.currentTarget;
                if (el.dataset.manualPaused !== 'true') {
                  el.dataset.isPaused = 'false';
                }
              }}
              onTouchCancel={(e) => {
                const el = e.currentTarget;
                if (el.dataset.manualPaused !== 'true') {
                  el.dataset.isPaused = 'false';
                }
              }}
              onWheel={(e) => {
                const el = e.currentTarget;
                el.dataset.isPaused = 'true';
                handleCatalogTempPause();
              }}
              ref={(node) => {
                if (catalogScrollRef) {
                  catalogScrollRef.current = node;
                }

                if (!node || node.dataset.initAuto === 'true') return;

                node.dataset.initAuto = 'true';
                if (!node.dataset.isPaused) node.dataset.isPaused = 'false';
                if (!node.dataset.manualPaused) {
                  node.dataset.manualPaused = 'false';
                }

                let groupWidth = 0;
                let lastTime = 0;
                let lastLoopMode: boolean | null = null;
                let frameId = 0;
                let isVisible = true;
                let animate = (_time: number) => {};

                const startLoop = () => {
                  if (frameId === 0 && node.isConnected) {
                    lastTime = 0;
                    frameId = requestAnimationFrame(animate);
                  }
                };

                const observer =
                  typeof IntersectionObserver !== 'undefined'
                    ? new IntersectionObserver(
                        (entries) => {
                          isVisible = entries.some(
                            (entry) => entry.isIntersecting,
                          );
                          if (isVisible) {
                            startLoop();
                          } else if (frameId !== 0) {
                            cancelAnimationFrame(frameId);
                            frameId = 0;
                          }
                        },
                        { rootMargin: '220px 0px' },
                      )
                    : null;

                animate = (time: number) => {
                  frameId = 0;
                  if (!node.isConnected) {
                    observer?.disconnect();
                    return;
                  }
                  if (!isVisible && observer) return;
                  if (
                    window.matchMedia('(prefers-reduced-motion: reduce)')
                      .matches
                  ) {
                    frameId = requestAnimationFrame(animate);
                    return;
                  }

                  const groups = node.querySelectorAll<HTMLElement>(
                    '[data-catalog-group]',
                  );
                  const shouldLoop = groups.length === 3;
                  const centerGroup = groups[shouldLoop ? 1 : 0];

                  if (centerGroup) {
                    const newWidth = centerGroup.getBoundingClientRect().width;

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
                      const manualTarget = node.dataset.manualTarget;

                      if (manualTarget !== undefined) {
                        const target = Number(manualTarget);
                        const distance = target - node.scrollLeft;

                        if (Math.abs(distance) > 0.8) {
                          node.scrollLeft += distance * 0.2;
                        } else {
                          node.scrollLeft = target;
                          delete node.dataset.manualTarget;

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
                        }
                      } else if (shouldLoop) {
                        const delta = lastTime
                          ? Math.min(time - lastTime, 40)
                          : 0;

                        if (
                          node.dataset.isPaused !== 'true' &&
                          node.dataset.manualPaused !== 'true'
                        ) {
                          node.scrollLeft += (22 * delta) / 1000;
                        }

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
                    }
                  }

                  lastTime = time;
                  frameId = requestAnimationFrame(animate);
                };

                if (observer) {
                  observer.observe(node);
                }
                startLoop();
              }}
              className='flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-2 px-1 touch-pan-x touch-pan-y overscroll-x-none overscroll-y-auto select-none'
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'auto',
              }}
            >
              <div className='flex w-max'>
                {Array.from(
                  {
                    length: paginatedCatalogProducts.length >= 3 ? 3 : 1,
                  },
                  (_, copy) => (
                    <div
                      key={`catalog-group-${copy}`}
                      data-catalog-group={copy}
                      aria-hidden={
                        paginatedCatalogProducts.length >= 3 && copy !== 1
                      }
                      className='flex shrink-0 items-center gap-2 sm:gap-3 pr-2 sm:pr-3'
                    >
                      {paginatedCatalogProducts.map((product, productIndex) => {
                        const globalCatalogNumber =
                          catalogStartIndex + productIndex + 1;
                        const displayImage =
                          product.image || product.images?.[0];
                        const isWish = wishlist.includes(product.id);
                        const oldPrice =
                          product.originalPrice ||
                          product.oldPrice ||
                          product.compare_at_price;
                        const stockQty =
                          product.stock_quantity ?? product.stock ?? 10;
                        const ratingVal = product.rating ?? 5;
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
                            key={`catalog-${safeCatalogPage}-${copy}-${product.slug}`}
                            href={`/products/${product.slug}`}
                            prefetch={false}
                            tabIndex={
                              paginatedCatalogProducts.length >= 3 && copy !== 1
                                ? -1
                                : undefined
                            }
                            className='w-[210px] sm:w-[240px] shrink-0 bg-[#0e1626]/95 backdrop-blur-xl rounded-xl border border-slate-800 shadow-md overflow-hidden hover:border-slate-700 transition duration-300 group flex flex-col justify-between cursor-pointer'
                          >
                            <div>
                              <div className='w-full h-36 sm:h-44 bg-slate-900 relative overflow-hidden border-b border-slate-800 group'>
                                {displayImage ? (
                                  <Image
                                    src={displayImage}
                                    alt={product.name || 'Product Image'}
                                    width={800}
                                    height={800}
                                    sizes='(max-width: 640px) 210px, 240px'
                                    loading='lazy'
                                    unoptimized={
                                      typeof displayImage === 'string' &&
                                      (displayImage.startsWith('blob:') ||
                                        displayImage.startsWith('data:'))
                                    }
                                    className='w-full h-full object-scale-down group-hover:scale-105 transition duration-500'
                                  />
                                ) : (
                                  <div className='flex items-center justify-center h-full text-slate-600 text-[10px]'>
                                    No Image
                                  </div>
                                )}

                                {/* بادج رقم صغير جداً للكارد */}
                                <span
                                  title={`منتج رقم ${globalCatalogNumber}`}
                                  className='absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded-md bg-[#070d19]/90 border border-cyan-400/35 text-cyan-200 text-[9px] font-black tracking-tight shadow'
                                >
                                  #{globalCatalogNumber}
                                </span>

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

                              <div className='p-2 sm:p-2.5 space-y-1.5'>
                                <div className='flex items-center justify-between gap-1'>
                                  <span className='text-[8px] font-bold text-blue-400 uppercase tracking-wider block bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20 truncate max-w-[105px]'>
                                    {productCategoryName}
                                  </span>

                                  {!product.hide_stock_on_front && (
                                    <span
                                      className={`px-1 py-0.5 rounded font-bold text-[8px] border shrink-0 ${
                                        stockQty > 0
                                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                          : 'bg-red-950/60 text-red-300 border-red-500/30'
                                      }`}
                                    >
                                      {stockQty > 0
                                        ? `${stockQty} in stock`
                                        : 'Out of Stock'}
                                    </span>
                                  )}
                                </div>

                                <h3 className='font-bold text-slate-100 line-clamp-1 text-[11px] sm:text-xs group-hover:text-blue-400 transition'>
                                  {product.name}
                                </h3>

                                <p className='text-[9px] text-slate-400 leading-relaxed break-words'>
                                  {product.description ||
                                    'Explore our high-quality product collection.'}
                                </p>
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {(() => {
                                  const { hasDiscount, discountPercent } =
                                    getDiscountInfo(product);

                                  return (
                                    <div className='flex items-center justify-between gap-1.5 text-[10px] text-amber-400 pt-0.5 w-full'>
                                      <div className='flex items-center shrink-0'>
                                        <div
                                          className='flex items-center'
                                          dir='ltr'
                                        >
                                          {[...Array(5)].map((_, i) => {
                                            const isFull = ratingVal >= i + 1;
                                            const isHalf =
                                              !isFull && ratingVal >= i + 0.5;

                                            return (
                                              <span
                                                key={i}
                                                className='relative inline-block w-[9px] h-[9px]'
                                              >
                                                <Star
                                                  size={9}
                                                  className='text-slate-700 fill-slate-700'
                                                />

                                                {isFull && (
                                                  <Star
                                                    size={9}
                                                    className='absolute inset-0 text-amber-400 fill-amber-400'
                                                  />
                                                )}

                                                {isHalf && (
                                                  <span className='absolute inset-y-0 left-0 w-1/2 overflow-hidden'>
                                                    <Star
                                                      size={9}
                                                      className='text-amber-400 fill-amber-400'
                                                    />
                                                  </span>
                                                )}
                                              </span>
                                            );
                                          })}
                                        </div>

                                        <span className='text-[8px] text-slate-400 font-medium ml-1'>
                                          ({Number(ratingVal).toFixed(1)})
                                        </span>
                                      </div>

                                      {/* بادج الخصم في الجهة الموازية */}
                                      {hasDiscount && discountPercent > 0 && (
                                        <span className='px-1.5 py-[1px] rounded text-[8px] font-extrabold bg-rose-600/20 text-rose-400 border border-rose-500/30 leading-none shrink-0 animate-pulse'>
                                          -{discountPercent}%
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
                                {/* =============================== */}
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
                                      <LazyMount
                                        rootMargin='180px 0px'
                                        className='min-h-8 min-w-12 inline-flex items-center justify-center'
                                      >
                                        <ShareButton
                                          productSlug={product.slug}
                                          productName={product.name}
                                          productPrice={product.price}
                                          compareAtPrice={
                                            product.compare_at_price
                                          }
                                        />
                                      </LazyMount>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

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
      <CustomerReviewsSection />

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
      <footer
        id='store-footer'
        className='bg-[#07090e] border-t border-blue-500/20 pt-12 sm:pt-16 pb-10 sm:pb-12 mt-16 sm:mt-20 relative z-10 overflow-hidden'
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 520px' }}
      >
        {/* خلفية جمالية خفيفة تدي إضاءة مكس أحمر وأزرق في الـ Footer */}
        <div className='absolute top-0 left-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none'></div>
        <div className='absolute bottom-0 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none'></div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 items-start relative z-10'>
          {/* العمود الأول: معلومات المتجر والشعار */}
          <div className='space-y-3.5 sm:space-y-4 bg-[#0e1626]/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-slate-800/70 sm:border-0'>
            <Link
              href='/'
              className='text-base font-black flex items-center gap-3 text-white group cursor-pointer w-fit'
            >
              {/* كونتينر الصورة بحجم أكبر وبوردر مكس بين الأحمر والأزرق */}
              <div className='w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-xl shadow-red-600/30 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300'>
                <div className='w-full h-full bg-[#0e1626] rounded-[14px] overflow-hidden relative'>
                  <Image
                    src='/fav-me-3.webp'
                    alt='Abdo'
                    width={400}
                    height={400}
                    sizes='48px'
                    loading='lazy'
                    className='w-full h-full object-cover object-[50%_2%] transform group-hover:scale-110 transition-transform duration-500'
                  />
                </div>
              </div>

              {/* اسم المتجر بتدرج مكس أحمر وأزرق واضح من البداية مع أنيميشن نبض */}
              <span className='text-lg sm:text-xl font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
                Abdo Store
              </span>
            </Link>

            <p
              dir='rtl'
              className='text-xs sm:text-sm font-medium leading-relaxed max-w-sm bg-gradient-to-l from-blue-300 via-slate-100 to-rose-300 bg-clip-text text-transparent'
            >
              براند يجمع بين التنوع، القيمة الحقيقية، وسهولة الوصول لكل ما
              تحتاجه في مكان واحد، مع عروض مميزة وتجربة شراء واضحة وسريعة من أول
              نقرة لحد استلام طلبك.
            </p>
          </div>

          {/* العمود الثاني: مميزات المتجر مع أنيميشن متنوع لكل أيقونة */}
          <div>
            <h4 className='text-xs sm:text-sm font-bold uppercase tracking-wider mb-3.5 sm:mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent'>
              <span className='w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-red-500 animate-ping'></span>
              Store Highlights
            </h4>

            <ul className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2.5 text-xs sm:text-sm font-medium text-slate-300'>
              <li className='group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/15 via-purple-600/10 to-red-600/15 border border-blue-500/30 hover:border-blue-400/60 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base inline-block animate-pulse group-hover:rotate-12 transition-transform duration-300'>
                  💎
                </span>
                <span className='bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent font-bold'>
                  أعلى جودة بأفضل سعر
                </span>
              </li>

              <li className='group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600/15 via-purple-600/10 to-blue-600/15 border border-red-500/30 hover:border-red-400/60 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base inline-block group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300'>
                  🚀
                </span>
                <span className='bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent font-bold'>
                  توصيل سريع وبسعر مناسب جدا
                </span>
              </li>

              <li className='group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/15 via-purple-600/10 to-red-600/15 border border-blue-500/30 hover:border-purple-400/60 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base inline-block animate-bounce [animation-duration:2.5s] group-hover:scale-110 transition-transform duration-300'>
                  🎁
                </span>
                <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold'>
                  خصومات أسبوعية مميزة
                </span>
              </li>

              <li className='group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/15 via-blue-600/10 to-red-600/15 border border-purple-500/30 hover:border-red-400/60 shadow-sm transition-all duration-300 transform hover:scale-[1.02] cursor-default'>
                <span className='text-base inline-block group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300'>
                  🛡️
                </span>
                <span className='bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent font-bold'>
                  تسوق آمن ومضمون
                </span>
              </li>
            </ul>
          </div>

          {/* العمود الثالث: التواصل والدعم الفني عبر الواتساب */}
          <div className='bg-[#0e1626]/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-slate-800/70 sm:border-0'>
            <h4 className='text-xs sm:text-sm font-bold uppercase tracking-wider mb-3.5 sm:mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent'>
              <span className='w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-blue-500 animate-pulse'></span>
              Customer Support
            </h4>

            <p
              dir='rtl'
              className='text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed'
            >
              عندك استفسار أو محتاج{' '}
              <span className='font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                مساعدة في اختيار طلبك
              </span>
              ؟ تواصل معنا مباشرة على{' '}
              <span className='font-bold bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent'>
                واتساب في أي وقت
              </span>{' '}
              وهنرد عليك فوراً.
            </p>

            {/* زر واتساب تفاعلي وأيقونة مميزة */}
            <a
              href={`https://wa.me/201016605189?text=${encodeURIComponent(
                'السلام عليكم، أتواصل معكم من المتجر بخصوص طلب أو استفسار أو مساعدة.',
              )}`}
              target='_blank'
              rel='noopener noreferrer'
              className='w-full sm:w-auto inline-flex items-center justify-center sm:justify-start gap-3 bg-gradient-to-r from-red-600/20 via-[#0e1626] to-blue-600/20 hover:from-red-600/30 hover:to-blue-600/30 border border-blue-500/40 hover:border-red-400/60 text-slate-100 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg shadow-blue-950/40 group transform hover:scale-[1.03]'
            >
              <div className='w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center text-white shadow-md animate-pulse group-hover:rotate-12 transition-transform duration-300'>
                {/* WhatsApp SVG Icon */}
                <svg className='w-4 h-4 fill-current' viewBox='0 0 24 24'>
                  <path d='M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z' />
                </svg>
              </div>
              <span
                dir='ltr'
                className='tracking-wide bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent font-extrabold'
              >
                +20 101 660 5189
              </span>
            </a>

            {/* مكون المشاركة مع جملة معبرة وسهم متحرك يشاور عليه */}
            <div className='mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3.5 w-full min-w-0'>
              {/* الجزء الخاص بالتكست والسهم */}
              <div className='flex items-center justify-center sm:justify-start gap-2.5 w-full sm:w-auto'>
                <span className='text-xs sm:text-sm font-bold leading-snug bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent text-center sm:text-start'>
                  Share it with friends ❤️⚡
                </span>

                <svg
                  className='w-6 h-5 sm:w-7 sm:h-5 text-blue-400 shrink-0 animate-bounce [animation-duration:2.2s]'
                  viewBox='0 0 36 20'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'
                >
                  <path d='M2 10h31' />
                  <path d='m27 4 6 6-6 6' />
                </svg>
              </div>

              {/* زرار الشير */}
              <div className='inline-flex items-center justify-center shrink-0 w-full sm:w-auto [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:w-full sm:[&_button]:w-12 [&_button]:h-11 sm:[&_button]:h-12 [&_button]:rounded-2xl [&_button]:text-sm [&_button]:sm:text-base [&_button]:font-bold [&_button]:shadow-xl [&_button]:transition-all [&_button]:duration-500 [&_button]:hover:scale-105 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:sm:w-6 [&_svg]:sm:h-6 [&_svg]:shrink-0 [&_svg]:rotate-180'>
                <LazyMount
                  rootMargin='240px'
                  className='min-h-11 sm:min-h-12 min-w-[3rem] w-full sm:w-12 flex items-center justify-center'
                >
                  <SiteShareButton />
                </LazyMount>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}

        {/* سطر حقوق الملكية وزر العودة للأعلى (Scroll to Top) */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-800/80 mt-10 sm:mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400 relative z-10'>
          <p className='text-center sm:text-start'>
            © 2026 Abdo Store. All rights reserved.
          </p>

          <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6'>
            <span className='hover:text-white transition cursor-pointer'>
              Privacy Policy
            </span>
            <span className='hover:text-white transition cursor-pointer'>
              Terms of Service
            </span>

            {/* زر صعود للأعلى متحرك وشيك */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className='group flex items-center gap-2.5 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-red-600/30 hover:from-blue-600/40 hover:to-red-600/40 text-slate-100 px-4 py-2 sm:py-2.5 rounded-2xl border border-blue-500/50 hover:border-red-500/60 shadow-lg shadow-blue-950/40 transition-all duration-300 cursor-pointer'
            >
              <span className='text-xs sm:text-sm font-bold tracking-wide bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent'>
                Back to top
              </span>
              {/* السهم الملون والمتحرك */}
              <span className='text-red-400 font-extrabold text-base inline-block transform transition-transform duration-300 group-hover:-translate-y-1.5 animate-bounce [animation-duration:3s]'>
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
        <div className='fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 font-sans'>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300'
            onClick={() => !isSubmitting && setIsAuthModalOpen(false)}
          />

          {/* Compact & Calm Modal */}
          <div className='relative w-full max-w-[390px] max-h-[90dvh] overflow-y-auto bg-[#0b111e]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 z-10 transition-all duration-300'>
            {/* Close Button */}
            <button
              type='button'
              onClick={() => setIsAuthModalOpen(false)}
              aria-label='Close modal'
              className='absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer'
            >
              <X size={16} />
            </button>

            {/* Header Info */}
            <div className='text-center space-y-2.5 pt-0.5'>
              {/* Subtle Animated Icon */}
              <div className='relative w-12 h-12 mx-auto flex items-center justify-center group'>
                <div className='absolute inset-0 rounded-xl bg-gradient-to-tr from-red-600/35 to-blue-600/35 blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500 animate-pulse' />
                <div className='relative w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center shadow-lg border border-white/15 transition-transform duration-300 group-hover:scale-105'>
                  <User className='w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110' />
                </div>
                <span className='absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping opacity-75' />
                <span className='relative -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-[#0b111e] -ml-2.5' />
              </div>

              {/* Title */}
              <div className='space-y-0.5'>
                <h3 className='text-lg sm:text-xl font-black tracking-tight text-white'>
                  Welcome to Abdo Store
                </h3>
                <p className='text-[11px] font-medium text-slate-400'>
                  Made for you — Shop smart
                </p>
              </div>

              {/* Clear, Balanced Arabic Copy */}
              <p
                className='text-xs text-slate-300/95 max-w-[320px] mx-auto leading-relaxed'
                dir='rtl'
              >
                <span className='font-bold text-white'>
                  تسجيل الدخول اختياري!
                </span>{' '}
                أنشئ حسابك واحصل على بروفايلك الشخصي لمتابعة شحناتك، حفظ سلتك
                ومفضلتك على كل الأجهزة، والاحتفاظ بسجل طلباتك ومكافآتك في مكان
                واحد.
              </p>
            </div>

            {/* Google Login Option */}
            <button
              type='button'
              disabled={isSubmitting || isLocked}
              onClick={async () => {
                if (isLocked) {
                  showToast('تم إيقاف المحاولات مؤقتاً، حاول بعد قليل.', 3500);
                  return;
                }
                setIsSubmitting(true);
                try {
                  await supabase.auth.signInWithOAuth({ provider: 'google' });
                } catch {
                  showToast('تعذر تسجيل الدخول، حاول مرة أخرى.', 3500);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className='w-full py-2.5 sm:py-3 px-4 bg-slate-900/90 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl border border-slate-700/80 flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-[0.99]'
            >
              <svg className='w-4 h-4 shrink-0' viewBox='0 0 24 24'>
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

            {/* Divider */}
            <div className='flex items-center gap-2.5'>
              <div className='h-[1px] bg-slate-800/90 flex-1' />
              <span className='text-[10px] font-semibold text-slate-500 uppercase tracking-widest'>
                or email
              </span>
              <div className='h-[1px] bg-slate-800/90 flex-1' />
            </div>

            {/* Manual Login Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                if (isLocked) {
                  showToast(
                    `محاولات كثيرة خاطئة. انتظر ${remainingSeconds} ثانية.`,
                    3500,
                  );
                  return;
                }

                const formData = new FormData(e.currentTarget);
                const email = String(formData.get('email') ?? '').trim();
                const password = String(formData.get('password') ?? '');

                if (!email || !password) {
                  showToast(
                    'من فضلك أدخل البريد الإلكتروني وكلمة المرور.',
                    3500,
                  );
                  return;
                }

                setIsSubmitting(true);
                try {
                  const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                  });

                  if (error) {
                    const nextAttempts = failedAttempts + 1;
                    setFailedAttempts(nextAttempts);

                    if (nextAttempts >= MAX_ATTEMPTS) {
                      setLockUntil(Date.now() + LOCK_DURATION_MS);
                      showToast(
                        'تم إدخال بيانات خاطئة عدة مرات، تم إيقاف المحاولات لمدة 30 ثانية.',
                        4000,
                      );
                    } else {
                      showToast(
                        'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
                        3500,
                      );
                    }
                    return;
                  }

                  setFailedAttempts(0);
                  setLockUntil(null);
                  setIsAuthModalOpen(false);
                  showToast('تم تسجيل الدخول بنجاح!', 3000);
                } catch {
                  showToast('حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.', 3500);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className='space-y-2.5'
            >
              <input
                name='email'
                type='email'
                required
                disabled={isSubmitting || isLocked}
                autoComplete='email'
                placeholder='Enter your email address'
                className='w-full px-3.5 py-2.5 bg-[#070b14] disabled:opacity-60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/80 transition-colors'
              />
              <input
                name='password'
                type='password'
                required
                disabled={isSubmitting || isLocked}
                autoComplete='current-password'
                maxLength={128}
                placeholder='Enter your password'
                className='w-full px-3.5 py-2.5 bg-[#070b14] disabled:opacity-60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/80 transition-colors'
              />

              {isLocked && (
                <p
                  className='text-[11px] text-center text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg py-1.5 px-2.5'
                  dir='rtl'
                >
                  تم إيقاف المحاولات مؤقتاً، حاول بعد{' '}
                  <span className='font-bold'>{remainingSeconds}</span> ثانية.
                </p>
              )}

              <button
                type='submit'
                disabled={isSubmitting || isLocked}
                className='w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/30 transition-all duration-200 cursor-pointer active:scale-[0.99]'
              >
                {isSubmitting
                  ? 'Signing in...'
                  : isLocked
                    ? `Wait ${remainingSeconds}s`
                    : 'Sign In / Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* WISHLIST DRAWER / MODAL (عرض منتجات المفضلة) */}

      {/* ------------------------------------------------------------------ */}

      {isWishlistModalOpen && (
        <div className='fixed top-16 sm:top-20 inset-x-0 bottom-0 z-40 overflow-hidden font-sans'>
          {/* Backdrop - يبدأ من تحت الناف بار */}
          <div
            className='fixed top-16 sm:top-20 inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm transition-opacity'
            onClick={() => setIsWishlistModalOpen(false)}
          />

          <div className='fixed top-16 sm:top-20 bottom-0 right-0 max-w-full flex pl-10'>
            <div className='w-screen max-w-md h-full bg-[#0e1626]/95 backdrop-blur-xl border-l border-slate-800/90 shadow-2xl flex flex-col relative overflow-hidden'>
              {/* Background Glow Orbs */}
              <div className='absolute -top-20 -right-20 w-40 h-40 bg-rose-600/10 rounded-full blur-3xl pointer-events-none'></div>
              <div className='absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none'></div>

              {/* Header */}
              <div className='flex items-center justify-between p-5 border-b border-slate-800/80 relative z-10 shrink-0'>
                <div className='flex items-center gap-2.5'>
                  <div className='p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500'>
                    <Heart size={18} className='fill-rose-500' />
                  </div>
                  <div>
                    <h2 className='text-sm sm:text-base font-black text-white tracking-tight'>
                      Saved Wishlist
                    </h2>
                    <p className='text-[10px] text-slate-400 font-medium'>
                      {wishlist.length}{' '}
                      {wishlist.length === 1 ? 'item' : 'items'} saved
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsWishlistModalOpen(false)}
                  className='p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/90 border border-slate-800 transition cursor-pointer'
                >
                  <X size={18} />
                </button>
              </div>

              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}

              {/* Wishlist Items List with Scroll */}
              <div className='flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar relative z-10'>
                {wishlist.length === 0 ? (
                  <div className='text-center py-28 text-slate-500 space-y-3'>
                    <Heart
                      size={48}
                      className='mx-auto text-slate-700 animate-pulse'
                    />
                    <p className='text-xs font-bold text-slate-400'>
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
                      const currentPrice = item.price || 0;
                      const oldPrice =
                        item.oldPrice ||
                        item.original_price ||
                        currentPrice + 200;
                      const itemDesc =
                        item.description ||
                        item.details ||
                        item.short_description ||
                        'High quality premium product';

                      return (
                        <div
                          key={`wish-item-${item.id}`}
                          className='group relative bg-gradient-to-r from-[#141d2f]/90 via-[#0e1626] to-[#141d2f]/90 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800/95 hover:border-slate-700/80 transition-all duration-300 shadow-md flex items-center gap-3.5'
                        >
                          {/* Product Image + Hot Deal Sticker */}
                          <div className='relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 shrink-0 shadow-sm'>
                            <Image
                              src={itemImg}
                              alt={item.name || 'Store Item'}
                              width={600}
                              height={600}
                              sizes='64px'
                              loading='lazy'
                              className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
                            />
                            <span className='absolute top-1 left-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md'>
                              Hot Deal
                            </span>
                          </div>

                          {/* Info & Prices */}
                          <div className='flex-1 min-w-0'>
                            <Link
                              href={`/products/${item.slug}`}
                              prefetch={false}
                              onClick={() => setIsWishlistModalOpen(false)}
                              className='font-black text-xs text-slate-100 truncate block hover:text-blue-400 transition tracking-tight'
                            >
                              {item.name}
                            </Link>
                            <p className='text-[10px] text-slate-400 line-clamp-1 mt-0.5'>
                              {itemDesc}
                            </p>

                            <div className='flex items-center gap-2 mt-1.5'>
                              <span className='text-xs font-black text-emerald-400'>
                                {currentPrice} EGP
                              </span>
                              {oldPrice > currentPrice && (
                                <span className='text-[9px] text-slate-500 line-through font-semibold'>
                                  {oldPrice} EGP
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions: Add to Cart & Remove */}
                          <div className='flex flex-col items-end justify-between h-full gap-3 shrink-0'>
                            <button
                              onClick={() => toggleWishlist(item)}
                              className='p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition cursor-pointer shadow-sm'
                              title='Remove from Wishlist'
                            >
                              <Trash2 size={13} />
                            </button>

                            <button
                              onClick={(e) => {
                                addToCart(e, item);
                              }}
                              className='p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition cursor-pointer flex items-center justify-center'
                              title='Add to Cart'
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
              {wishlist.length > 0 && (
                <div className='p-5 border-t border-slate-800/80 bg-[#07090e]/95 backdrop-blur-xl relative z-10 shrink-0'>
                  <Link
                    href='/cart'
                    onClick={() => setIsWishlistModalOpen(false)}
                    className='w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-center rounded-xl font-bold block shadow-xl shadow-blue-950/50 transition text-xs cursor-pointer'
                  >
                    View Shopping Cart & Checkout 🛍️
                  </Link>
                </div>
              )}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
              {/* ============ */}
            </div>
          </div>
        </div>
      )}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
      {/* ============================= */}
    </div>
  );
}
