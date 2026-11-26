'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image'
import {
  Search,
  ArrowUpDown,
  Layers,
  Tag,
  Package,
  TrendingUp,
  Percent,
  RotateCcw,
  ImageOff,
  ShoppingBag,
  FolderKanban,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BarChart2,
  X,
  ChevronLeft,
} from 'lucide-react';

interface ProductsAnalyticsTabProps {
  deliveries: any[];
  storeCurrency: string;
  supabase: any;
}

type TableLensTab =
  | 'all'
  | 'top_selling'
  | 'top_revenue'
  | 'low_demand'
  | 'discounted'
  | 'bought_together'
  | 'categories';

type SortField = 'sold' | 'revenue' | 'price' | 'discount';

interface CatalogCategory {
  id: string;
  name: string;
  slug?: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  old_price?: number | null;
  discount?: number | null;
  image?: string | null;
  images?: string[] | null;
  category?: string | null;
  category_id?: string | null;
  stock?: number | null;
  stock_quantity?: number | null;
  is_active?: boolean | null;
}

interface EnrichedProductRow {
  key: string;
  name: string;
  description: string;
  categoryName: string;
  imageUrl: string;
  currentPrice: number;
  beforePrice: number | null;
  discountPercent: number;
  soldCount: number;
  ordersAppearance: number;
  revenue: number;
  stockCount: number | null;
  inCatalog: boolean;
}

interface PairRow {
  key: string;
  pairLabel: string;
  itemA: string;
  itemB: string;
  ordersCount: number;
  bundlePrice: number;
  categoryHint: string;
}

const ANALYTICS_UNLOCK_CODE = '16605189';

const LENS_TABS: {
  id: TableLensTab;
  label: string;
  activeGradient: string;
}[] = [
  {
    id: 'all',
    label: 'All Products',
    activeGradient: 'from-blue-600 via-indigo-600 to-violet-600',
  },
  {
    id: 'top_selling',
    label: 'Top Selling',
    activeGradient: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'top_revenue',
    label: 'Top Revenue',
    activeGradient: 'from-violet-600 to-purple-600',
  },
  {
    id: 'low_demand',
    label: 'Low / Zero',
    activeGradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'discounted',
    label: 'Discounted',
    activeGradient: 'from-rose-600 to-red-600',
  },
  {
    id: 'bought_together',
    label: 'Bought Together',
    activeGradient: 'from-sky-600 to-blue-600',
  },
  {
    id: 'categories',
    label: 'Categories',
    activeGradient: 'from-fuchsia-600 to-violet-600',
  },
];
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
// ==================
// ==================

// ==================
// ==================
// ==================
// ==================
function extractImageUrl(raw: any, catalogProd?: CatalogProduct): string {
  const candidates = [
    raw?.image,
    Array.isArray(raw?.images) ? raw.images[0] : null,
    raw?.image_url,
    raw?.thumbnail,
    catalogProd?.image,
    Array.isArray(catalogProd?.images) ? catalogProd.images[0] : null,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      return c.trim();
    }
  }
  return '';
}

function computeDiscountInfo(
  currentPrice: number,
  rawBefore?: number | null,
  rawOld?: number | null,
  rawDiscount?: number | null,
): { beforePrice: number | null; discountPercent: number } {
  const validBefore =
    typeof rawBefore === 'number' && rawBefore > currentPrice
      ? rawBefore
      : typeof rawOld === 'number' && rawOld > currentPrice
        ? rawOld
        : null;

  if (validBefore && validBefore > 0) {
    const pct = Math.round(((validBefore - currentPrice) / validBefore) * 100);
    return {
      beforePrice: validBefore,
      discountPercent: Math.max(pct, Number(rawDiscount) || 0),
    };
  }

  if (typeof rawDiscount === 'number' && rawDiscount > 0 && currentPrice > 0) {
    const estimatedBefore = Math.round(
      currentPrice / (1 - Math.min(rawDiscount, 90) / 100),
    );
    return {
      beforePrice: estimatedBefore > currentPrice ? estimatedBefore : null,
      discountPercent: Math.round(rawDiscount),
    };
  }

  return { beforePrice: null, discountPercent: 0 };
}

export default function ProductsAnalyticsTab({
  deliveries,
  storeCurrency,
  supabase,
}: ProductsAnalyticsTabProps) {
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<CatalogCategory[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);

  // Filters, search, sort & inner table lens tab
  const [activeLens, setActiveLens] = useState<TableLensTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('sold');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);


const [analyticsCategoryModalOpen, setAnalyticsCategoryModalOpen] =
  useState(false);

  // Blur lock state for all 4 analytics boxes (unlocked via passcode 16605189)
  const [analyticsUnlocked, setAnalyticsUnlocked] = useState<boolean>(false);
  const [passcodeModalOpen, setPasscodeModalOpen] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  // Reset warning modal state
  const [resetWarningOpen, setResetWarningOpen] = useState<boolean>(false);
  // =======================
  // =======================
  const lockResetAgain = () => {
    setIsResetLocked(true);
    setResetPasswordInput('');
    setResetPasswordError('');
  };
  // =======================
  // =======================
  const [isResetLocked, setIsResetLocked] = useState(true);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  const [tablePage, setTablePage] = useState(1);
  const [tablePageAnimKey, setTablePageAnimKey] = useState(0);
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================
  const executeResetFilters = () => {
    // حط هنا نفس كود الـ Reset الأصلي اللي كان بيعمل ريست للفلاتر
    setResetWarningOpen(true);
  };

  const handleResetButtonClick = () => {
    if (!isResetLocked) {
      executeResetFilters();
      return;
    }
    setResetPasswordInput('');
    setResetPasswordError('');
    setResetPasswordModalOpen(true);
  };
const RESET_LOCK_CODE = '16605189';
  const handleConfirmResetPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (resetPasswordInput.trim() === RESET_LOCK_CODE) {
      setIsResetLocked(false);
      setResetPasswordModalOpen(false);
      setResetPasswordInput('');
      setResetPasswordError('');
      executeResetFilters();
    } else {
      setResetPasswordError('الباسورد غير صحيح، حاول مرة أخرى.');
    }
  };
  // =======================
  // =======================
  // =======================
  // =======================
  // =======================

  // Table slider scroll container ref
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCatalog(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase
            .from('products')
            .select(
              'id, name, description, price, compare_at_price, old_price, discount, image, images, category, category_id, stock, stock_quantity, is_active',
            ),
          supabase.from('categories').select('id, name, slug'),
        ]);

        if (!active) return;
        if (!prodRes.error && Array.isArray(prodRes.data)) {
          setCatalogProducts(prodRes.data);
        }
        if (!catRes.error && Array.isArray(catRes.data)) {
          setCategoriesList(catRes.data);
        }
      } catch {
        // Fallback safely to order items data
      } finally {
        if (active) setLoadingCatalog(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const analytics = useMemo(() => {
    const categoryById = new Map<string, string>();
    categoriesList.forEach((cat) => {
      if (cat.id && cat.name) categoryById.set(cat.id, cat.name.trim());
    });

    const catalogByName = new Map<string, CatalogProduct>();
    const catalogById = new Map<string, CatalogProduct>();

    catalogProducts.forEach((prod) => {
      if (prod.id) catalogById.set(String(prod.id), prod);
      if (prod.name) {
        catalogByName.set(prod.name.trim().toLowerCase(), prod);
      }
    });

    const resolveCategory = (
      rawItem: any,
      catProd?: CatalogProduct,
    ): string => {
      const direct =
        rawItem?.category_name ||
        rawItem?.category ||
        catProd?.category ||
        (catProd?.category_id ? categoryById.get(catProd.category_id) : '') ||
        (rawItem?.category_id ? categoryById.get(rawItem.category_id) : '');

      if (typeof direct === 'string' && direct.trim()) {
        return direct.trim();
      }
      return 'Uncategorized';
    };

    interface AccProduct {
      key: string;
      name: string;
      description: string;
      categoryName: string;
      imageUrl: string;
      currentPrice: number;
      beforePrice: number | null;
      discountPercent: number;
      soldCount: number;
      ordersAppearance: number;
      revenue: number;
      stockCount: number | null;
      inCatalog: boolean;
    }

    const productMap = new Map<string, AccProduct>();
    const pairMap = new Map<
      string,
      {
        pairLabel: string;
        itemA: string;
        itemB: string;
        ordersCount: number;
        bundlePrice: number;
        categoryHint: string;
      }
    >();

    catalogProducts.forEach((prod) => {
      const cleanName = (prod.name || 'Untitled Product').trim();
      const key = cleanName.toLowerCase();
      const catName = resolveCategory(null, prod);
      const currentP = Number(prod.price ?? 0);
      const { beforePrice, discountPercent } = computeDiscountInfo(
        currentP,
        prod.compare_at_price != null ? Number(prod.compare_at_price) : null,
        prod.old_price != null ? Number(prod.old_price) : null,
        prod.discount != null ? Number(prod.discount) : null,
      );
      const stockVal =
        typeof prod.stock_quantity === 'number'
          ? prod.stock_quantity
          : typeof prod.stock === 'number'
            ? prod.stock
            : null;

      productMap.set(key, {
        key,
        name: cleanName,
        description:
          (prod.description || '').trim() ||
          'No description provided for this product.',
        categoryName: catName,
        imageUrl: extractImageUrl(null, prod),
        currentPrice: currentP,
        beforePrice,
        discountPercent,
        soldCount: 0,
        ordersAppearance: 0,
        revenue: 0,
        stockCount: stockVal,
        inCatalog: true,
      });
    });

    (deliveries || []).forEach((del) => {
      const ord = del?.orders;
      if (!ord) return;
      const items = Array.isArray(ord.items) ? ord.items : [];
      const seenInOrder = new Map<
        string,
        { name: string; price: number; category: string }
      >();

      items.forEach((rawItem: any) => {
        const cleanName = (rawItem?.name || rawItem?.title || 'Unnamed Item')
          .toString()
          .trim();
        const key = cleanName.toLowerCase();
        const matchedCatProd =
          (rawItem?.product_id
            ? catalogById.get(String(rawItem.product_id))
            : undefined) || catalogByName.get(key);

        const qty = Math.max(Number(rawItem?.quantity ?? rawItem?.qty ?? 1), 1);
        const unitPrice = Number(rawItem?.price ?? matchedCatProd?.price ?? 0);
        const lineRevenue = unitPrice * qty;
        const catName = resolveCategory(rawItem, matchedCatProd);
        const imgUrl = extractImageUrl(rawItem, matchedCatProd);
        const descText =
          (rawItem?.description || matchedCatProd?.description || '').trim() ||
          'No description provided for this product.';

        const { beforePrice, discountPercent } = computeDiscountInfo(
          unitPrice,
          rawItem?.compare_at_price != null
            ? Number(rawItem.compare_at_price)
            : matchedCatProd?.compare_at_price != null
              ? Number(matchedCatProd.compare_at_price)
              : null,
          rawItem?.old_price != null
            ? Number(rawItem.old_price)
            : matchedCatProd?.old_price != null
              ? Number(matchedCatProd.old_price)
              : null,
          rawItem?.discount != null
            ? Number(rawItem.discount)
            : matchedCatProd?.discount != null
              ? Number(matchedCatProd.discount)
              : null,
        );

        const existing = productMap.get(key);
        if (existing) {
          existing.soldCount += qty;
          existing.ordersAppearance += 1;
          existing.revenue += lineRevenue;
          if (unitPrice > 0) existing.currentPrice = unitPrice;
          if (!existing.imageUrl && imgUrl) existing.imageUrl = imgUrl;
          if (
            existing.description ===
              'No description provided for this product.' &&
            descText !== 'No description provided for this product.'
          ) {
            existing.description = descText;
          }
          if (
            existing.categoryName === 'Uncategorized' &&
            catName !== 'Uncategorized'
          ) {
            existing.categoryName = catName;
          }
          if (!existing.beforePrice && beforePrice) {
            existing.beforePrice = beforePrice;
            existing.discountPercent = discountPercent;
          }
        } else {
          const stockVal =
            typeof matchedCatProd?.stock_quantity === 'number'
              ? matchedCatProd.stock_quantity
              : typeof matchedCatProd?.stock === 'number'
                ? matchedCatProd.stock
                : null;

          productMap.set(key, {
            key,
            name: cleanName,
            description: descText,
            categoryName: catName,
            imageUrl: imgUrl,
            currentPrice: unitPrice,
            beforePrice,
            discountPercent,
            soldCount: qty,
            ordersAppearance: 1,
            revenue: lineRevenue,
            stockCount: stockVal,
            inCatalog: Boolean(matchedCatProd),
          });
        }

        if (!seenInOrder.has(key)) {
          seenInOrder.set(key, {
            name: cleanName,
            price: unitPrice,
            category: catName,
          });
        }
      });

      const orderUnique = Array.from(seenInOrder.entries()).sort((a, b) =>
        a[0].localeCompare(b[0]),
      );

      if (orderUnique.length >= 2) {
        for (let i = 0; i < orderUnique.length; i++) {
          for (let j = i + 1; j < orderUnique.length; j++) {
            const [, first] = orderUnique[i];
            const [, second] = orderUnique[j];
            const pairKey = `${first.name} || ${second.name}`;
            const prevPair = pairMap.get(pairKey);
            if (prevPair) {
              prevPair.ordersCount += 1;
            } else {
              pairMap.set(pairKey, {
                pairLabel: `${first.name}  +  ${second.name}`,
                itemA: first.name,
                itemB: second.name,
                ordersCount: 1,
                bundlePrice: first.price + second.price,
                categoryHint:
                  first.category === second.category
                    ? first.category
                    : `${first.category} / ${second.category}`,
              });
            }
          }
        }
      }
    });

    const allRows: EnrichedProductRow[] = Array.from(productMap.values());

    const categoryStatsMap = new Map<
      string,
      {
        name: string;
        productsCount: number;
        unitsSold: number;
        revenue: number;
        discountedCount: number;
      }
    >();

    allRows.forEach((row) => {
      const cat = categoryStatsMap.get(row.categoryName);
      if (cat) {
        cat.productsCount += 1;
        cat.unitsSold += row.soldCount;
        cat.revenue += row.revenue;
        if (row.discountPercent > 0) cat.discountedCount += 1;
      } else {
        categoryStatsMap.set(row.categoryName, {
          name: row.categoryName,
          productsCount: 1,
          unitsSold: row.soldCount,
          revenue: row.revenue,
          discountedCount: row.discountPercent > 0 ? 1 : 0,
        });
      }
    });

    const categoryBreakdown = Array.from(categoryStatsMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    const availableCategories = Array.from(
      new Set([
        ...categoriesList.map((c) => c.name?.trim()).filter(Boolean),
        ...categoryBreakdown.map((c) => c.name),
      ]),
    );

    const q = searchTerm.trim().toLowerCase();
    const filteredRows = allRows.filter((row) => {
      const matchesCat =
        selectedCategory === 'all' || row.categoryName === selectedCategory;
      if (!matchesCat) return false;

      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.categoryName.toLowerCase().includes(q) ||
        String(row.currentPrice).includes(q) ||
        String(row.revenue).includes(q)
      );
    });

    let tableRows = [...filteredRows];
    if (activeLens === 'low_demand') {
      tableRows = tableRows.filter((r) => r.soldCount <= 2);
    } else if (activeLens === 'discounted') {
      tableRows = tableRows.filter(
        (r) =>
          r.discountPercent > 0 ||
          (r.beforePrice && r.beforePrice > r.currentPrice),
      );
    }

    const effectiveSortField: SortField =
      activeLens === 'top_revenue'
        ? 'revenue'
        : activeLens === 'discounted'
          ? 'discount'
          : activeLens === 'low_demand'
            ? 'sold'
            : sortField;

    const effectiveDirection: 'asc' | 'desc' =
      activeLens === 'low_demand' ? 'asc' : sortDirection;

    tableRows.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (effectiveSortField === 'sold') {
        valA = a.soldCount;
        valB = b.soldCount;
      } else if (effectiveSortField === 'revenue') {
        valA = a.revenue;
        valB = b.revenue;
      } else if (effectiveSortField === 'price') {
        valA = a.currentPrice;
        valB = b.currentPrice;
      } else if (effectiveSortField === 'discount') {
        valA = a.discountPercent;
        valB = b.discountPercent;
      }
      return effectiveDirection === 'desc' ? valB - valA : valA - valB;
    });

    const pairsRows: PairRow[] = Array.from(pairMap.entries())
      .map(([key, val]) => ({ key, ...val }))
      .filter((p) => {
        if (!q) return true;
        return (
          p.pairLabel.toLowerCase().includes(q) ||
          p.categoryHint.toLowerCase().includes(q) ||
          String(p.bundlePrice).includes(q)
        );
      })
      .sort((a, b) =>
        sortDirection === 'desc'
          ? b.ordersCount - a.ordersCount
          : a.ordersCount - b.ordersCount,
      );

    const totalUnitsSold = filteredRows.reduce(
      (sum, r) => sum + r.soldCount,
      0,
    );
    const totalProductsRevenue = filteredRows.reduce(
      (sum, r) => sum + r.revenue,
      0,
    );
    const topSeller =
      [...allRows].sort((a, b) => b.soldCount - a.soldCount)[0] || null;
    const discountedItemsCount = allRows.filter(
      (r) => r.discountPercent > 0,
    ).length;

    return {
      allRows,
      tableRows,
      pairsRows,
      categoryBreakdown,
      availableCategories,
      totalUnitsSold,
      totalProductsRevenue,
      topSeller,
      discountedItemsCount,
    };
  }, [
    deliveries,
    catalogProducts,
    categoriesList,
    selectedCategory,
    searchTerm,
    activeLens,
    sortField,
    sortDirection,
  ]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const executeResetAllFilters = () => {
    setActiveLens('all');
    setSelectedCategory('all');
    setSearchTerm('');
    setSortField('sold');
    setSortDirection('desc');
    setExpandedRowKey(null);
    setResetWarningOpen(false);
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleUnlockTrigger = () => {
    if (analyticsUnlocked) {
      setAnalyticsUnlocked(false);
      return;
    }
    setPasscodeInput('');
    setPasscodeError('');
    setPasscodeModalOpen(true);
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === ANALYTICS_UNLOCK_CODE) {
      setAnalyticsUnlocked(true);
      setPasscodeModalOpen(false);
      setPasscodeInput('');
      setPasscodeError('');
    } else {
      setPasscodeError('Incorrect admin passcode. Please try again.');
    }
  };

  const scrollTableVertical = (dir: 'up' | 'down') => {
    if (!tableScrollRef.current) return;
    const delta = dir === 'down' ? 240 : -240;
    tableScrollRef.current.scrollBy({ top: delta, behavior: 'smooth' });
  };

  const blurValueClass = analyticsUnlocked
    ? 'transition-all duration-300'
    : 'blur-md select-none pointer-events-none transition-all duration-300';
// ================================
// ================================
// ================================
// ================================
useEffect(() => {
    if (!resetWarningOpen) {
      setIsResetLocked(true);
    }
  }, [resetWarningOpen]);

    // باقي JSX بتاع ProductsAnalyticsTab
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
const TABLE_ROWS_PER_PAGE = 10;
const totalTablePages = Math.max(
  1,
  Math.ceil((analytics?.tableRows?.length || 0) / TABLE_ROWS_PER_PAGE),
);
const safeTablePage = Math.min(tablePage, totalTablePages);
const tableStartIndex = (safeTablePage - 1) * TABLE_ROWS_PER_PAGE;
const tableEndIndex = Math.min(
  tableStartIndex + TABLE_ROWS_PER_PAGE,
  analytics?.tableRows?.length || 0,
);
const paginatedTableRows = (analytics?.tableRows || []).slice(
  tableStartIndex,
  tableEndIndex,
);

const handleTablePageChange = (nextPage: number) => {
  const clamped = Math.max(1, Math.min(nextPage, totalTablePages));
  if (clamped === safeTablePage) return;
  setTablePage(clamped);
  setTablePageAnimKey((k) => k + 1);
  setExpandedRowKey(null);
};
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
  return (
    <div className='px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-4 text-slate-100 max-w-[1600px] mx-auto'>
      {/* 1. Header & 4 Protected Analytics Boxes (Balanced Mid-Tone Palette) */}
      <div className='rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800/95 to-indigo-950/70 border border-slate-700/80 p-3.5 sm:p-5 shadow-lg transition-all duration-300'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='space-y-0.5'>
            <div className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/35 text-indigo-200 text-[11px] font-bold'>
              <BarChart2 size={13} className='text-amber-300' />
              <span>Product & Category Intelligence</span>
              {loadingCatalog && (
                <span className='text-[10px] text-sky-300 animate-pulse'>
                  • Syncing catalog...
                </span>
              )}
            </div>
            <h2 className='text-base sm:text-lg font-black text-white tracking-tight'>
              Products Performance, Pricing & Categories
            </h2>
            <p className='text-[11px] sm:text-xs text-slate-300'>
              Track units sold, revenue, before/after prices, category share,
              and product bundles.
            </p>
          </div>

          <div className='flex items-center gap-2 self-start sm:self-auto'>
            <button
              type='button'
              onClick={handleUnlockTrigger}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all duration-200 active:scale-95 cursor-pointer ${
                analyticsUnlocked
                  ? 'bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-200 border-emerald-400/40'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
              }`}
              title='Admin passcode required to reveal analytics metrics'
            >
              {analyticsUnlocked ? (
                <>
                  <Unlock size={13} className='text-emerald-300' />
                  <span>Hide Metrics</span>
                </>
              ) : (
                <>
                  <Lock size={13} className='text-amber-300' />
                  <span>Unlock Metrics</span>
                </>
              )}
            </button>

            <button
              type='button'
              onClick={handleResetButtonClick}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/75 hover:bg-rose-950/60 border border-slate-600/80 hover:border-rose-400/50 text-xs font-bold text-slate-200 hover:text-rose-200 transition-all duration-200 active:scale-95 cursor-pointer'
            >
              <RotateCcw size={13} className='text-rose-400' />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* 4 Analytics Cards with Blur Protection & Small Key Trigger */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4'>
          {/* Card 1: Total Units Sold (Blue / Sky) */}
          <div className='rounded-xl bg-slate-900/80 border border-blue-500/30 hover:border-blue-400/60 p-3 transition-all duration-200 hover:-translate-y-0.5'>
            <div className='flex items-center justify-between gap-1 text-[11px] text-slate-300'>
              <span className='font-bold truncate'>Total Units Sold</span>
              <div className='flex items-center gap-1 shrink-0'>
                <button
                  type='button'
                  onClick={handleUnlockTrigger}
                  className='p-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 transition-colors cursor-pointer'
                  title={analyticsUnlocked ? 'Lock metrics' : 'Enter passcode'}
                >
                  {analyticsUnlocked ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <span className='w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300'>
                  <ShoppingBag size={13} />
                </span>
              </div>
            </div>
            <p
              className={`text-base sm:text-xl font-black text-white mt-1.5 font-mono ${blurValueClass}`}
            >
              {analytics.totalUnitsSold.toLocaleString()}{' '}
              <span className='text-[11px] font-sans font-semibold text-blue-300'>
                pcs
              </span>
            </p>
          </div>

          {/* Card 2: Total Products Revenue (Green / Emerald) */}
          <div className='rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400/60 p-3 transition-all duration-200 hover:-translate-y-0.5'>
            <div className='flex items-center justify-between gap-1 text-[11px] text-slate-300'>
              <span className='font-bold text-[10px] sm:text-[11px] leading-tight'>
                Products Revenue
              </span>
              <div className='flex items-center gap-1 shrink-0'>
                <button
                  type='button'
                  onClick={handleUnlockTrigger}
                  className='p-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 transition-colors cursor-pointer'
                  title={analyticsUnlocked ? 'Lock metrics' : 'Enter passcode'}
                >
                  {analyticsUnlocked ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <span className='w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300'>
                  <TrendingUp size={13} />
                </span>
              </div>
            </div>
            <p
              className={`text-base sm:text-xl font-black text-emerald-300 mt-1.5 font-mono truncate ${blurValueClass}`}
            >
              {analytics.totalProductsRevenue.toLocaleString()}{' '}
              <span className='text-[11px] font-sans font-bold text-slate-200'>
                {storeCurrency}
              </span>
            </p>
          </div>

          {/* Card 3: Top Selling Product (Yellow / Amber) */}
          <div className='rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400/60 p-3 transition-all duration-200 hover:-translate-y-0.5'>
            <div className='flex items-center justify-between gap-1 text-[11px] text-slate-300'>
              <span className='font-bold truncate'>Top Seller</span>
              <div className='flex items-center gap-1 shrink-0'>
                <button
                  type='button'
                  onClick={handleUnlockTrigger}
                  className='p-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 transition-colors cursor-pointer'
                  title={analyticsUnlocked ? 'Lock metrics' : 'Enter passcode'}
                >
                  {analyticsUnlocked ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <span className='w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300'>
                  <Package size={13} />
                </span>
              </div>
            </div>
            <div className={`mt-1.5 ${blurValueClass}`}>
              <p className='text-xs sm:text-sm font-black text-white truncate'>
                {analytics.topSeller ? analytics.topSeller.name : 'No data yet'}
              </p>
              {analytics.topSeller && (
                <p className='text-[10px] text-amber-300 font-bold font-mono'>
                  {analytics.topSeller.soldCount} sold
                </p>
              )}
            </div>
          </div>

          {/* Card 4: Discounted Products (Red / Rose + Purple accent) */}
          <div className='rounded-xl bg-slate-900/80 border border-rose-500/30 hover:border-rose-400/60 p-3 transition-all duration-200 hover:-translate-y-0.5'>
            <div className='flex items-center justify-between gap-1 text-[11px] text-slate-300'>
              <span className='font-bold truncate'>Discounted Items</span>
              <div className='flex items-center gap-1 shrink-0'>
                <button
                  type='button'
                  onClick={handleUnlockTrigger}
                  className='p-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition-colors cursor-pointer'
                  title={analyticsUnlocked ? 'Lock metrics' : 'Enter passcode'}
                >
                  {analyticsUnlocked ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <span className='w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300'>
                  <Percent size={13} />
                </span>
              </div>
            </div>
            <p
              className={`text-base sm:text-xl font-black text-rose-300 mt-1.5 font-mono ${blurValueClass}`}
            >
              {analytics.discountedItemsCount}{' '}
              <span className='text-[11px] font-sans font-semibold text-violet-200'>
                items
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Search Bar, Category Filter & Sort Buttons */}
      <div className='rounded-2xl bg-slate-800/90 border border-slate-700/80 p-3 shadow-md'>
        <div className='grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center'>
          {/* Search Bar */}
          <div className='md:col-span-5 relative'>
            <Search
              size={15}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
            />
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search name, category, description, or price...'
              className='w-full rounded-xl bg-slate-900/90 border border-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all duration-200'
            />
          </div>

          <div className='md:col-span-3'>
            <button
              type='button'
              onClick={() => setAnalyticsCategoryModalOpen(true)}
              className='w-full flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-[#141d33] via-slate-900 to-[#111c36] hover:from-red-600/20 hover:to-blue-600/25 border border-violet-500/35 hover:border-blue-400/50 px-3 py-2 text-xs text-white transition-all duration-200 cursor-pointer shadow-sm'
            >
              <span className='flex items-center gap-1.5 min-w-0'>
                <Tag size={14} className='text-violet-300 shrink-0' />
                <span className='font-bold truncate'>
                  {selectedCategory === 'all'
                    ? `All Categories (${analytics.availableCategories.length})`
                    : selectedCategory}
                </span>
              </span>
              <span className='text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30 shrink-0'>
                Select
              </span>
            </button>

            {analyticsCategoryModalOpen && (
              <div
                onClick={() => setAnalyticsCategoryModalOpen(false)}
                className='fixed inset-0 z-50 pt-20 pb-4 px-3 sm:px-4 bg-black/75 backdrop-blur-sm flex items-center justify-center overflow-y-auto animate-fadeIn'
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='w-full max-w-sm max-h-[calc(100vh-6.5rem)] my-auto rounded-2xl bg-[#0c1424] border border-blue-500/35 shadow-2xl flex flex-col overflow-hidden transition-all duration-200'
                >
                  <div className='px-4 py-3 bg-gradient-to-r from-red-600/25 via-violet-600/20 to-blue-600/25 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <span className='w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 via-fuchsia-500 to-blue-500 animate-pulse shrink-0' />
                      <h4 className='text-xs sm:text-sm font-black text-white truncate'>
                        Filter by Category (
                        {analytics.availableCategories.length})
                      </h4>
                    </div>
                    <button
                      type='button'
                      onClick={() => setAnalyticsCategoryModalOpen(false)}
                      aria-label='Close category modal'
                      className='p-1 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700/80 transition cursor-pointer shrink-0'
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className='p-3 space-y-1.5 max-h-[240px] sm:max-h-[270px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-900/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-red-500/70 [&::-webkit-scrollbar-thumb]:to-blue-500/70'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedCategory('all');
                        setAnalyticsCategoryModalOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white border-blue-300/40 shadow-md'
                          : 'bg-[#121c30] text-slate-200 border-slate-800 hover:border-blue-500/40 hover:bg-[#17233b]'
                      }`}
                    >
                      <span>All Categories</span>
                      <span className='px-2 py-0.5 rounded-full font-mono text-[10px] bg-black/30 text-blue-200'>
                        {analytics.availableCategories.length}
                      </span>
                    </button>

                    {analytics.availableCategories.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type='button'
                          onClick={() => {
                            setSelectedCategory(cat);
                            setAnalyticsCategoryModalOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-red-600 via-fuchsia-600 to-blue-600 text-white border-blue-300/40 shadow-md'
                              : 'bg-[#121c30] text-slate-200 border-slate-800 hover:border-violet-500/40 hover:bg-[#17233b]'
                          }`}
                        >
                          <span className='truncate'>{cat}</span>
                          {isSelected && (
                            <span className='text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0'>
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* ======================= */}
          {/* ======================= */}
          {/* ======================= */}

          {/* Sort Buttons */}
          <div className='md:col-span-4 flex flex-wrap items-center justify-start md:justify-end gap-1.5'>
            {(
              [
                { id: 'sold', label: 'Sold' },
                { id: 'revenue', label: 'Revenue' },
                { id: 'price', label: 'Price' },
                { id: 'discount', label: 'Discount' },
              ] as { id: SortField; label: string }[]
            ).map((btn) => {
              const active = sortField === btn.id;
              const isAsc = active && sortDirection === 'asc';

              const activeDirectionCls = isAsc
                ? 'bg-rose-500/15 border-rose-400/50 text-rose-200 shadow-sm shadow-rose-950/30'
                : 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200 shadow-sm shadow-emerald-950/30';

              return (
                <button
                  key={btn.id}
                  type='button'
                  onClick={() => handleToggleSort(btn.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all duration-200 cursor-pointer ${
                    active
                      ? activeDirectionCls
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <span>{btn.label}</span>
                  <ArrowUpDown
                    size={11}
                    className={`transition-transform duration-200 ${
                      isAsc ? 'rotate-180 text-rose-300' : 'text-emerald-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {/* ======================= */}
          {/* ======================= */}
          {/* ======================= */}
        </div>
      </div>

      {/* 3. Table Container with Inner Sub-Tabs & Slider Scroll */}
      <div className='rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-xl overflow-hidden transition-all duration-300'>
        {/* Sub-Tabs Bar + Table Slider Controls */}
        <div className='px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5'>
          <div className='flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0'>
            {LENS_TABS.map((tab) => {
              const isSelected = activeLens === tab.id;
              return (
                <button
                  key={tab.id}
                  type='button'
                  onClick={() => {
                    setActiveLens(tab.id);
                    if (tableScrollRef.current) {
                      tableScrollRef.current.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-r ${tab.activeGradient} text-white shadow`
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className='flex items-center justify-between lg:justify-end gap-2.5 text-[11px]'>
            <span className='text-slate-300 font-bold'>
              {activeLens === 'bought_together' ? (
                <>
                  Bundles:{' '}
                  <strong className='text-sky-300 font-mono'>
                    {analytics.pairsRows.length}
                  </strong>
                </>
              ) : activeLens === 'categories' ? (
                <>
                  Categories:{' '}
                  <strong className='text-fuchsia-300 font-mono'>
                    {analytics.categoryBreakdown.length}
                  </strong>
                </>
              ) : (
                <>
                  Showing:{' '}
                  <strong className='text-emerald-300 font-mono'>
                    {analytics.tableRows.length}
                  </strong>
                </>
              )}
            </span>

            {/* Vertical Table Slider Buttons */}
            <div className='flex items-center gap-1'>
              <button
                type='button'
                onClick={() => scrollTableVertical('up')}
                className='p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/80 text-slate-200 transition-colors cursor-pointer'
                title='Scroll table up'
              >
                <ChevronUp size={14} />
              </button>
              <button
                type='button'
                onClick={() => scrollTableVertical('down')}
                className='p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/80 text-slate-200 transition-colors cursor-pointer'
                title='Scroll table down'
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* شريط الـ Pagination ثابت فوق منطقة السكرول الخاصة بالتيبول */}
        {activeLens !== 'categories' &&
          activeLens !== 'bought_together' &&
          analytics.tableRows.length > TABLE_ROWS_PER_PAGE && (
            <div
              dir='ltr'
              className='mb-2.5 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700/80 text-xs shrink-0'
            >
              {/* عداد الصفوف والصفحات */}
              <div className='flex items-center gap-2 text-slate-400'>
                <span className='w-2 h-2 rounded-full bg-blue-400 animate-pulse' />
                <span>
                  Showing{' '}
                  <strong className='text-white font-mono'>
                    {tableStartIndex + 1}–{tableEndIndex}
                  </strong>{' '}
                  of{' '}
                  <strong className='text-blue-300 font-mono'>
                    {analytics.tableRows.length}
                  </strong>
                </span>
                <span className='text-slate-600'>•</span>
                <span className='px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 font-mono text-[11px] font-bold'>
                  Page {safeTablePage} / {totalTablePages}
                </span>
              </div>

              {/* أزرار السابق والتالي وأرقام الصفحات */}
              <div
                key={`table-page-bar-${tablePageAnimKey}`}
                className='flex items-center gap-1 flex-wrap'
              >
                <button
                  type='button'
                  onClick={() => handleTablePageChange(safeTablePage - 1)}
                  disabled={safeTablePage === 1}
                  className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700/90 text-slate-300 font-bold hover:border-blue-500/50 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer'
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalTablePages }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === safeTablePage;

                  return (
                    <button
                      key={`table-page-${pageNum}`}
                      type='button'
                      onClick={() => handleTablePageChange(pageNum)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`min-w-[28px] h-[28px] px-2 rounded-lg font-mono text-xs font-black transition cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white border border-blue-300/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type='button'
                  onClick={() => handleTablePageChange(safeTablePage + 1)}
                  disabled={safeTablePage === totalTablePages}
                  className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700/90 text-slate-300 font-bold hover:border-blue-500/50 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer'
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

        {/* Scrollable Slider Area (prevents endless page scrolling) */}
        <div
          ref={tableScrollRef}
          className='max-h-[430px] sm:max-h-[470px] overflow-y-auto overflow-x-auto scroll-smooth'
        >
          {activeLens === 'categories' ? (
            <table className='w-full text-left border-collapse min-w-[640px]'>
              <thead className='sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 text-[11px] font-extrabold text-slate-300'>
                <tr>
                  <th className='py-2.5 px-3.5'>Category</th>
                  <th className='py-2.5 px-3.5'>Products</th>
                  <th className='py-2.5 px-3.5'>Units Sold</th>
                  <th className='py-2.5 px-3.5'>Discounted</th>
                  <th className='py-2.5 px-3.5'>Revenue</th>
                  <th className='py-2.5 px-3.5'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-700/60 text-xs'>
                {analytics.categoryBreakdown.map((cat, idx) => (
                  <tr
                    key={cat.name}
                    className='hover:bg-slate-700/40 transition-colors duration-150'
                  >
                    <td className='py-2.5 px-3.5 font-black text-white'>
                      <div className='flex items-center gap-2'>
                        <span className='px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-200 border border-violet-400/30 text-[10px] font-mono'>
                          #{idx + 1}
                        </span>
                        <FolderKanban size={14} className='text-fuchsia-300' />
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className='py-2.5 px-3.5 font-mono text-slate-200'>
                      {cat.productsCount}
                    </td>
                    <td className='py-2.5 px-3.5 font-mono font-bold text-blue-300'>
                      {cat.unitsSold} pcs
                    </td>
                    <td className='py-2.5 px-3.5 font-mono text-rose-300'>
                      {cat.discountedCount}
                    </td>
                    <td className='py-2.5 px-3.5 font-mono font-black text-emerald-300'>
                      {cat.revenue.toLocaleString()} {storeCurrency}
                    </td>
                    <td className='py-2.5 px-3.5'>
                      <button
                        type='button'
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setActiveLens('all');
                        }}
                        className='px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/35 text-blue-200 border border-blue-400/30 text-[11px] font-bold transition-colors cursor-pointer'
                      >
                        Filter Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeLens === 'bought_together' ? (
            <table className='w-full text-left border-collapse min-w-[620px]'>
              <thead className='sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 text-[11px] font-extrabold text-slate-300'>
                <tr>
                  <th className='py-2.5 px-3.5'>#</th>
                  <th className='py-2.5 px-3.5'>Frequently Bought Together</th>
                  <th className='py-2.5 px-3.5'>Category</th>
                  <th className='py-2.5 px-3.5'>Orders</th>
                  <th className='py-2.5 px-3.5'>Bundle Total</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-700/60 text-xs'>
                {analytics.pairsRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='py-8 text-center text-slate-400 text-xs'
                    >
                      No multi-item combinations match the current filter.
                    </td>
                  </tr>
                ) : (
                  analytics.pairsRows.map((pair, idx) => (
                    <tr
                      key={pair.key}
                      className='hover:bg-slate-700/40 transition-colors duration-150'
                    >
                      <td className='py-2.5 px-3.5 font-mono font-bold text-sky-300'>
                        #{idx + 1}
                      </td>
                      <td className='py-2.5 px-3.5 font-black text-white'>
                        <div className='flex items-center gap-2'>
                          <Layers size={14} className='text-sky-300 shrink-0' />
                          <span>{pair.pairLabel}</span>
                        </div>
                      </td>
                      <td className='py-2.5 px-3.5'>
                        <span className='px-2 py-0.5 rounded-lg bg-slate-700/80 text-slate-200 text-[11px] font-semibold'>
                          {pair.categoryHint}
                        </span>
                      </td>
                      <td className='py-2.5 px-3.5 font-mono font-black text-amber-300'>
                        {pair.ordersCount} orders
                      </td>
                      <td className='py-2.5 px-3.5 font-mono font-black text-emerald-300'>
                        {pair.bundlePrice.toLocaleString()} {storeCurrency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className='w-full text-left border-collapse min-w-[700px]'>
              <thead className='sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 text-[11px] font-extrabold text-slate-300'>
                <tr>
                  <th className='py-2.5 px-3.5'>Product & Description</th>
                  <th className='py-2.5 px-3.5'>Category</th>
                  <th className='py-2.5 px-3.5'>Price (Before / Now)</th>
                  <th className='py-2.5 px-3.5'>Sold</th>
                  <th className='py-2.5 px-3.5'>Revenue</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-700/60 text-xs'>
                {analytics.tableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='py-8 text-center text-slate-400 text-xs'
                    >
                      No products match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedTableRows.map((row, idx) => {
                    const displayRowNumber = tableStartIndex + idx + 1;
                    const isExpanded = expandedRowKey === row.key;
                    return (
                      <tr
                        key={row.key}
                        onClick={() =>
                          setExpandedRowKey(isExpanded ? null : row.key)
                        }
                        className='hover:bg-slate-700/40 transition-all duration-150 cursor-pointer group'
                      >
                        {/* Image + Title + Description */}
                        <td className='py-2.5 px-3.5 max-w-sm'>
                          <div className='flex items-start gap-2.5'>
                            <div className='relative shrink-0'>
                              <span className='absolute -top-1 -left-1 z-10 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-600 text-[9px] font-mono font-black text-amber-300'>
                                #{displayRowNumber}
                              </span>
                              {row.imageUrl ? (
                                <Image
                                  src={row.imageUrl}
                                  alt={row.name || 'Item'}
                                  width={112}
                                  height={112}
                                  loading='lazy'
                                  sizes='(max-width: 640px) 48px, 56px'
                                  className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-600 bg-slate-900 transition-transform duration-200 group-hover:scale-105'
                                />
                              ) : (
                                <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-slate-400 text-[9px] gap-0.5'>
                                  <ImageOff size={13} />
                                  <span>No Img</span>
                                </div>
                              )}
                            </div>

                            <div className='min-w-0 flex-1 space-y-0.5'>
                              <div className='flex items-center gap-1.5 flex-wrap'>
                                <h4 className='font-black text-white text-xs group-hover:text-blue-200 transition-colors'>
                                  {row.name}
                                </h4>
                                {row.discountPercent > 0 && (
                                  <span className='px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/35 text-[10px] font-black'>
                                    -{row.discountPercent}%
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-[11px] text-slate-300/90 leading-snug ${
                                  isExpanded ? '' : 'line-clamp-1'
                                }`}
                              >
                                {row.description}
                              </p>
                              {row.stockCount !== null && (
                                <span className='inline-block text-[10px] font-mono text-violet-300'>
                                  Stock: {row.stockCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className='py-2.5 px-3.5 whitespace-nowrap'>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(row.categoryName);
                            }}
                            className='inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 border border-violet-400/30 text-[11px] font-bold transition-colors cursor-pointer'
                          >
                            <Tag size={11} />
                            <span>{row.categoryName}</span>
                          </button>
                        </td>

                        {/* Price Before & After */}
                        <td className='py-2.5 px-3.5 whitespace-nowrap font-mono'>
                          <div className='flex flex-col'>
                            <span className='font-black text-white text-xs'>
                              {row.currentPrice.toLocaleString()}{' '}
                              <span className='text-[10px] font-sans text-blue-300'>
                                {storeCurrency}
                              </span>
                            </span>
                            {row.beforePrice &&
                            row.beforePrice > row.currentPrice ? (
                              <span className='text-[10px] line-through text-rose-300/85'>
                                Was: {row.beforePrice.toLocaleString()}{' '}
                                {storeCurrency}
                              </span>
                            ) : (
                              <span className='text-[10px] text-slate-400 font-sans'>
                                Regular price
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Sold Count */}
                        <td className='py-2.5 px-3.5 whitespace-nowrap font-mono'>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black border ${
                              row.soldCount === 0
                                ? 'bg-slate-700/60 text-slate-300 border-slate-600'
                                : row.soldCount <= 2
                                  ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                                  : 'bg-blue-500/15 text-blue-200 border-blue-400/30'
                            }`}
                          >
                            {row.soldCount} pcs
                          </span>
                        </td>

                        {/* Revenue */}
                        <td className='py-2.5 px-3.5 whitespace-nowrap font-mono'>
                          <span className='font-black text-emerald-300 text-xs'>
                            {row.revenue.toLocaleString()}{' '}
                            <span className='text-[10px] font-sans text-slate-300'>
                              {storeCurrency}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. Admin Passcode Modal for Analytics Boxes */}
      {passcodeModalOpen && (
        <div
          className='fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4'
          onClick={() => setPasscodeModalOpen(false)}
        >
          <form
            onSubmit={handlePasscodeSubmit}
            onClick={(e) => e.stopPropagation()}
            className='w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-600 p-4 sm:p-5 shadow-2xl space-y-3.5'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-amber-300'>
                  <Lock size={16} />
                </span>
                <div>
                  <h3 className='text-sm font-black text-white'>
                    Admin Metrics Lock
                  </h3>
                  <p className='text-[11px] text-slate-300'>
                    Enter passcode to reveal analytics boxes
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setPasscodeModalOpen(false)}
                className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer'
              >
                <X size={16} />
              </button>
            </div>

            <input
              type='password'
              autoFocus
              value={passcodeInput}
              onChange={(e) => {
                setPasscodeInput(e.target.value);
                setPasscodeError('');
              }}
              placeholder='Enter admin passcode...'
              className='w-full rounded-xl bg-slate-900 border border-slate-600 focus:border-amber-400 px-3 py-2 text-xs text-white font-mono outline-none'
            />

            {passcodeError && (
              <p className='text-[11px] font-bold text-rose-300'>
                {passcodeError}
              </p>
            )}

            <div className='flex items-center justify-end gap-2 pt-1'>
              <button
                type='button'
                onClick={() => setPasscodeModalOpen(false)}
                className='px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-black text-white cursor-pointer'
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Reset Filters Warning Modal */}
      {resetWarningOpen && (
        <div
          className='fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4'
          onClick={() => setResetWarningOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='w-full max-w-sm rounded-2xl bg-slate-800 border border-amber-500/40 p-4 sm:p-5 shadow-2xl space-y-3.5'
          >
            <div className='flex items-start gap-2.5'>
              <span className='w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0'>
                <AlertTriangle size={18} />
              </span>
              <div dir='rtl' className='text-right'>
                <h3 className='text-base sm:text-lg font-black text-white'>
                  إعادة ضبط جميع الفلاتر؟
                </h3>
                <p className='text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed'>
                  سيؤدي هذا إلى مسح نص البحث، وإعادة تعيين القسم وتبويب العدسة،
                  واستعادة الترتيب الافتراضي.
                </p>
              </div>
            </div>

            <div className='flex items-center justify-end gap-2 pt-1'>
              <button
                type='button'
                onClick={() => {
                  setResetWarningOpen(false);
                  lockResetAgain();
                }}
                className='px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 cursor-pointer'
              >
               Cancel
              </button>
              <button
                type='button'
                className='px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white cursor-pointer'
                onClick={() => {
                  executeResetAllFilters();
                  lockResetAgain();
                }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {resetPasswordModalOpen && (
        <div
          dir='ltr'
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4'
        >
          <form
            onSubmit={handleConfirmResetPassword}
            className='w-full max-w-xs rounded-2xl bg-[#0b1324] border border-rose-500/35 p-4 shadow-2xl space-y-3'
          >
            <div className='flex items-center justify-between border-b border-slate-800 pb-2'>
              <span className='text-xs font-black text-rose-300 uppercase tracking-wide'>
                Reset Filters Lock
              </span>
              <button
                type='button'
                onClick={() => setResetPasswordModalOpen(false)}
                className='text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer'
              >
                ✕
              </button>
            </div>

            <p className='text-[11px] text-slate-400'>
              Enter passcode to unlock{' '}
              <strong className='text-slate-200'>Reset Filters</strong>.
            </p>

            <input
              type='password'
              inputMode='numeric'
              autoFocus
              value={resetPasswordInput}
              onChange={(e) => {
                setResetPasswordInput(e.target.value);
                if (resetPasswordError) setResetPasswordError('');
              }}
              placeholder='••••••'
              className='w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/90 focus:border-rose-500/70 outline-none text-xs font-mono text-white tracking-widest'
            />

            {resetPasswordError && (
              <p className='text-[11px] font-semibold text-rose-400'>
                {resetPasswordError}
              </p>
            )}

            <div className='flex items-center justify-end gap-2 pt-1'>
              <button
                type='button'
                onClick={() => setResetPasswordModalOpen(false)}
                className='px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white text-xs font-black shadow-sm cursor-pointer'
              >
                Unlock & Reset
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
      {/* ======================== */}
    </div>
  );
  // =======================================
  // =======================================
  // =======================================
  // =======================================

  // =======================================
  // =======================================
}
