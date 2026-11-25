'use client';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  ArrowLeft,
  Image as ImageIcon,
  Package,
  Boxes,
  LogOut,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  CheckCircle2,
  Star,
  AlertTriangle,
  FolderPlus,
  Filter,
  Check,
  Eye,
  EyeOff,
  Clock,
  ChevronDown,
} from 'lucide-react';

import Link from 'next/link';
import { router } from 'next/client';
import { useRouter } from 'next/navigation';

export default function AdminProductsPage() {
  const router = useRouter(); // <--- هذا هو السطر الذي يمنع الخطأ

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // States الخاصة بإضافة وتعديل التصنيفات
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // فلترة جدول الأدمين
  const [adminFilter, setAdminFilter] = useState('all');

  // Edit & Delete Modal States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Delete Category Modal
  const [catDeleteModalOpen, setCatDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<any | null>(null);

  // Add/Edit Product Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [rating, setRating] = useState('5');

  // Section Display Assignment States
  const [showInHero, setShowInHero] = useState(false);
  const [showInFlash, setShowInFlash] = useState(false);
  const [showInCatalog, setShowInCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ======================================
  // ======================================
  const [priceRangeOpen, setPriceRangeOpen] = useState(false);
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  const filterScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollThumb, setScrollThumb] = useState({ width: 100, left: 0 });
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // State خاصة بالـ Modal المنبثق
  const [modalInfo, setModalInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  // دالة مساعدة لفتح المودال بأي رسالة وعنوان
  const showModal = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ) => {
    setModalInfo({ isOpen: true, title, message, type });
  };

  // دالة قفل المودال
  const closeModal = () => {
    setModalInfo((prev) => ({ ...prev, isOpen: false }));
  };
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================

  // 1. تعريف الـ State الخاصة بالتنبيهات
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };
  // ======================================
  // ======================================
  // ======================================
  // ======================================

  const updateFilterScrollState = useCallback(() => {
    const el = filterScrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);

    if (maxScroll <= 0 || scrollWidth <= 0) {
      setScrollThumb({ width: 100, left: 0 });
      return;
    }

    const thumbWidthPercent = Math.max(22, (clientWidth / scrollWidth) * 100);
    const maxThumbTravel = 100 - thumbWidthPercent;
    const currentLeftPercent = (scrollLeft / maxScroll) * maxThumbTravel;

    setScrollThumb({
      width: thumbWidthPercent,
      left: Math.min(maxThumbTravel, Math.max(0, currentLeftPercent)),
    });
  }, []);

  useEffect(() => {
    updateFilterScrollState();

    const el = filterScrollRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      updateFilterScrollState();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', updateFilterScrollState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFilterScrollState);
    };
  }, [updateFilterScrollState, categories.length]);

  const handleScrollFilters = (direction: 'prev' | 'next') => {
    const el = filterScrollRef.current;
    if (!el) return;

    const step = Math.max(180, Math.round(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  };
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================

  useEffect(() => {
    fetchData();
  }, []);

  // جلب البيانات من Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodError)
        console.error('Error fetching products:', prodError.message);
      else if (prodData) setProducts(prodData);

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*');

      if (!catError && catData) {
        setCategories(catData);
      }
    } catch (err) {
      console.error('Unexpected error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  // إضافة أو تعديل تصنيف
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9اء-ي]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: newCategoryName, slug })
          .eq('id', editingCategory.id);

        if (error) {
          showModal(
            'خطأ في التحديث ⚠️',
            'Error updating category: ' + error.message,
            'error',
          );
        } else {
          setCategories(
            categories.map((c) =>
              c.id === editingCategory.id ? { ...c, name: newCategoryName } : c,
            ),
          );
          setEditingCategory(null);
          setNewCategoryName('');
          showModal('Success 🎉', 'Category updated successfully!', 'success');
        }
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert([{ name: newCategoryName, slug }])
          .select();

        if (error)
          showModal(
            'Add Error ⚠️',
            'Error adding category: ' + error.message,
            'error',
          );
        else if (data) {
          setCategories((prev) => [...prev, data[0]]);
          setCategoryId(data[0].id);
          setNewCategoryName('');
          showModal('Success 🎉', 'Category added successfully!', 'success');
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // حذف تصنيف
  const executeDeleteCategory = async () => {
    if (!catToDelete) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', catToDelete.id);

    if (!error) {
      setCategories(categories.filter((c) => c.id !== catToDelete.id));
      if (categoryId === catToDelete.id) setCategoryId('');
    } else {
      showModal(
        'Deletion Error ⚠️',
        'Failed to delete category: ' + error.message,
        'error',
      );
    }

    setCatDeleteModalOpen(false);
    setCatToDelete(null);
  };

  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // الملفات الجديدة المنتظرة للرفع عند الحفظ فقط + روابط المعاينة المؤقتة
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  // اختيار الصور للمعاينة فقط (بدون رفع فوري لـ Cloudinary)
  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setPendingFiles((prev) => [...prev, ...files]);
    setPendingPreviews((prev) => [...prev, ...newPreviews]);

    // تفريغ قيمة الـ input للسماح بإعادة اختيار نفس الملف لو حبيت
    e.target.value = '';
  };

  // حذف صورة جاهزة/مرفوعة مسبقاً قبل الحفظ
  const handleRemoveExistingImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // حذف صورة جديدة (معاينة) قبل الحفظ وتنظيف الذاكرة
  const handleRemovePendingFile = (index: number) => {
    setPendingPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // دالة الرفع الفعلية لـ Cloudinary — تُستدعى فقط عند الضغط على زر الحفظ
  const uploadPendingImages = async (): Promise<string[]> => {
    if (pendingFiles.length === 0) {
      return images;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');
        formData.append('folder', 'store-products');

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: formData },
        );

        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          throw new Error(data.error?.message || 'Cloudinary upload failed');
        }
      }

      const finalImages = [...images, ...uploadedUrls];

      // تنظيف المعاينات وتصفير الملفات المؤقتة بعد نجاح الرفع
      pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPendingFiles([]);
      setPendingPreviews([]);
      setImages(finalImages);

      return finalImages;
    } catch (err) {
      console.error('Error uploading images:', err);
      showModal('Upload Error ⚠️', 'Failed to upload some images.', 'error');
      throw err;
    } finally {
      setUploading(false);
    }
  };
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // ==============تبع موديل التقييم ===============
  // =============================
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const ratingOptions = [
    { value: '5', label: '5.0 Stars', stars: 5 },
    { value: '4.5', label: '4.5 Stars', stars: 4.5 },
    { value: '4', label: '4.0 Stars', stars: 4 },
    { value: '3.5', label: '3.5 Stars', stars: 3.5 },
    { value: '3', label: '3.0 Stars', stars: 3 },
    { value: '2.5', label: '2.5 Stars', stars: 2.5 },
    { value: '2', label: '2.0 Stars', stars: 2 },
    { value: '1.5', label: '1.5 Stars', stars: 1.5 },
    { value: '1', label: '1.0 Star', stars: 1 },
  ];

  const selectedRatingOption =
    ratingOptions.find((opt) => opt.value === String(rating)) ||
    ratingOptions[0];

  const renderRatingStars = (val: number, size = 12) => (
    <div className='flex items-center gap-0.5' dir='ltr'>
      {[...Array(5)].map((_, i) => {
        const isFull = val >= i + 1;
        const isHalf = !isFull && val >= i + 0.5;

        return (
          <span
            key={i}
            className='relative inline-block flex-shrink-0'
            style={{ width: size, height: size }}
          >
            <Star size={size} className='text-slate-700 fill-slate-700' />
            {isFull && (
              <Star
                size={size}
                className='absolute inset-0 text-amber-400 fill-amber-400'
              />
            )}
            {isHalf && (
              <span className='absolute inset-y-0 left-0 w-1/2 overflow-hidden'>
                <Star size={size} className='text-amber-400 fill-amber-400' />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const selectedCategory = categories.find(
    (cat) => String(cat.id) === String(categoryId),
  );
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // زر التاريخ والوقت
  // =============================
  const [createdAtProduct, setCreatedAtProduct] = useState<any | null>(null);

  const formatCreatedAt12h = (dateStr?: string | null) => {
    if (!dateStr) return 'غير متوفر';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'غير متوفر';

    const datePart = d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timePart = d.toLocaleTimeString('ar-EG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${datePart} — ${timePart}`;
  };
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // زر الهايد للمنتجات
  // =============================
  const [togglingHideId, setTogglingHideId] = useState<string | number | null>(
    null,
  );

  const handleToggleHide = async (product: any) => {
    const nextHidden = !product.is_hidden;
    setTogglingHideId(product.id);

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_hidden: nextHidden })
        .eq('id', product.id);

      if (error) throw error;

      // تحديث الحالة محلياً في القائمة فوراً
      setProducts((prev: any[]) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, is_hidden: nextHidden } : item,
        ),
      );
    } catch (err) {
      console.error('Error toggling product visibility:', err);
    } finally {
      setTogglingHideId(null);
    }
  };
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // حفظ أو تحديث المنتج
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price) {
      showModal(
        'Validation Error ⚠️',
        'Please enter product name and price at least.',
        'error',
      );
      return;
    }

    setSubmitting(true);

    const parsedStock = Math.max(
      0,
      Number.isNaN(parseInt(stock, 10)) ? 0 : parseInt(stock, 10),
    );

    const productData = {
      name,
      description,
      price: parseFloat(price),
      compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
      stock_quantity: parsedStock,
      stock: parsedStock,
      category_id: categoryId ? categoryId : null,
      images: images,
      rating: parseFloat(rating) || 5,
      is_active: true,
      show_in_hero: showInHero,
      show_in_flash: showInFlash,
      show_in_catalog: showInCatalog,
    };

    if (editingId) {
const finalImages = await uploadPendingImages();

const { error } = await supabase
  .from('products')
  .update({ ...productData, images: finalImages })
  .eq('id', editingId);

      setSubmitting(false);

      if (error) {
        showModal(
          'Update Error ⚠️',
          'Error updating product: ' + error.message,
          'error',
        );
      } else {
        showModal('Success 🎉', 'Product updated successfully!', 'success');
        resetForm();
        fetchData();
      }
    } else {
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9اء-ي]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now();

const finalImages = await uploadPendingImages();

const { error } = await supabase
  .from('products')
  .insert([{ ...productData, images: finalImages, slug }]);

      setSubmitting(false);

      if (error) {
        showModal(
          'Add Error ⚠️',
          'Error adding product: ' + error.message,
          'error',
        );
      } else {
        showModal('Success 🎉', 'Product added successfully!', 'success');
        resetForm();
        fetchData();
      }
    }
  };
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  const handleEditClick = (product: any) => {
    pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingFiles([]);
    setPendingPreviews([]);

    setEditingId(product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.price ? product.price.toString() : '');
    setComparePrice(
      product.compare_at_price ? product.compare_at_price.toString() : '',
    );
    const currentStock = product.stock_quantity ?? product.stock ?? 0;
    setStock(currentStock.toString());
    setCategoryId(product.category_id || '');
    setImages(product.images || []);
    setRating(product.rating ? product.rating.toString() : '5');
    setShowInHero(product.show_in_hero || false);
    setShowInFlash(product.show_in_flash || false);

    // استبدل الـ || بـ ?? عشان تقبل القيمة لو false بجد وما تخمنش من عندها
    setShowInCatalog(product.show_in_catalog ?? false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================

  // States للتحديث السريع للستوك والتوست
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [stockToast, setStockToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showStockToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setStockToast({ message, type });
    setTimeout(() => {
      setStockToast(null);
    }, 3000);
  };

  const handleInlineStockSave = async (productId: string, newStock: number) => {
    const safeStock = Math.max(0, Number.isNaN(newStock) ? 0 : newStock);
    setSavingStockId(productId);

    const { error } = await supabase
      .from('products')
      .update({
        stock_quantity: safeStock,
        stock: safeStock,
      })
      .eq('id', productId);

    setSavingStockId(null);

    if (error) {
      showStockToast('Failed to update stock: ' + error.message, 'error');
    } else {
      showStockToast(`Stock updated to ${safeStock} ✓`, 'success');
      fetchData();
    }
  };
  // =============================
  // =============================
  // =============================
  // =============================
const [togglingFrontStockId, setTogglingFrontStockId] = useState<
  string | number | null
>(null);

const handleToggleFrontStock = async (product: any) => {
  if (togglingFrontStockId === product.id) return;

  const nextHidden = !Boolean(product.hide_stock_on_front);
  setTogglingFrontStockId(product.id);

  setProducts((prev: any[]) =>
    prev.map((item) =>
      item.id === product.id
        ? { ...item, hide_stock_on_front: nextHidden }
        : item,
    ),
  );

  const { error } = await supabase
    .from('products')
    .update({ hide_stock_on_front: nextHidden })
    .eq('id', product.id);

  setTogglingFrontStockId(null);

  if (error) {
    console.error('Failed to update hide_stock_on_front:', error.message);
    setProducts((prev: any[]) =>
      prev.map((item) =>
        item.id === product.id
          ? { ...item, hide_stock_on_front: !nextHidden }
          : item,
      ),
    );
  }
};
  // =============================
  // =============================
  // =============================
  // =============================
const [togglingAllFrontStock, setTogglingAllFrontStock] = useState(false);

const areAllFrontStocksHidden =
  products.length > 0 &&
  products.every((item: any) => Boolean(item.hide_stock_on_front));

const handleToggleAllFrontStock = async () => {
  if (togglingAllFrontStock || products.length === 0) return;

  const nextHidden = !areAllFrontStocksHidden;
  const previousProducts = products;
  setTogglingAllFrontStock(true);

  setProducts((prev: any[]) =>
    prev.map((item) => ({
      ...item,
      hide_stock_on_front: nextHidden,
    })),
  );

  const { error } = await supabase
    .from('products')
    .update({ hide_stock_on_front: nextHidden })
    .not('id', 'is', null);

  setTogglingAllFrontStock(false);

  if (error) {
    console.error('Failed to toggle all front stocks:', error.message);
    setProducts(previousProducts);
  }
};
  // =============================
  // =============================
  // =============================
  // =============================
  // =============================

  // =============================
  // =============================
  // =============================

  // تفريغ الفورم بالكامل (بما في ذلك الصور المؤقتة)
  const resetForm = () => {
    pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setComparePrice('');
    setStock('10');
    setCategoryId('');
    setImages([]);
    setPendingFiles([]);
    setPendingPreviews([]);
    setRating('5');
    setShowInHero(false);
    setShowInFlash(false);
    setShowInCatalog(false);
  };

  // =============================
  // =============================
  // =============================
  // =============================

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };
  // ==============================================
  // ==============================================
  // ==============================================
  // ==============================================
  const executeDelete = async () => {
    if (!productToDelete) return;

    try {
      // 1. جلب بيانات المنتج أولاً لمعرفة رابط الصورة قبل حذفه من قاعدة البيانات
      const { data: productData } = await supabase
        .from('products')
        .select('image, images')
        .eq('id', productToDelete)
        .single();

      const imageUrl =
        productData?.image ||
        (Array.isArray(productData?.images) ? productData.images[0] : null);

      // 2. إرسال طلب إلى السيرفر لحذف الصورة من Cloudinary إذا كانت موجودة
      if (imageUrl) {
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });
      }

      // 3. حذف المنتج من جدول products في سوبابيز
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);

      if (error) throw error;

      // 4. تحديث الواجهة وحذف المنتج من الـ state المحلي
      setProducts(products.filter((p) => p.id !== productToDelete));
    } catch (err: any) {
      showModal(
        'Deletion Error ⚠️',
        'Failed to delete product: ' + (err.message || 'Unknown error'),
        'error',
      );
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  // ==============================================
  // ==============================================
  // ==============================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // فلترة المنتجات المعروضة في جدول الأدمن بناءً على اختيار البوكسات
  // فلترة المنتجات المعروضة في جدول الأدمن بناءً على اختيار البوكسات
  // 1. فلترة البوكسات والأزرار باسم جديد وآمن
  const safeFilteredInventory = products.filter((p) => {
    if (adminFilter === 'all') return true;

    // فلتر الصور المتعددة الجديد
    if (adminFilter === 'multi-images') {
      return Array.isArray(p.images) && p.images.length > 1;
    }

    if (adminFilter === 'hidden') {
      return Boolean(p.is_hidden || p.hidden);
    }

    if (adminFilter === 'hero') return p.show_in_hero;
    if (adminFilter === 'flash') return p.show_in_flash;
    if (adminFilter === 'catalog') return p.show_in_catalog;
    return p.category_id === adminFilter;
  });

  // 2. فلترة البحث باسم جديد وآمن تماماً لمنع أي تكرار
  const finalInventoryList = safeFilteredInventory.filter((product) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const matchedCat = categories.find((c) => c.id === product.category_id);
    const nameMatch = (product.name || '').toLowerCase().includes(q);
    const catMatch = (matchedCat?.name || '').toLowerCase().includes(q);
    return nameMatch || catMatch;
  });

  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================

  // استخدمنا safeFilteredInventory بدل filteredInventory القديم
const hasActivePriceRange =
  minPriceFilter.trim() !== '' || maxPriceFilter.trim() !== '';

const displayedInventory = safeFilteredInventory.filter((product) => {
  const matchedCat = categories.find((c) => c.id === product.category_id);
  const categoryName = matchedCat?.name || '';

  const effectivePrice = Number(product.price) || 0;
  const comparePrice =
    product.compare_at_price !== null && product.compare_at_price !== undefined
      ? Number(product.compare_at_price)
      : null;

  // 1. فلترة رينج الأسعار (Min / Max) لو متفعل
  const minVal = minPriceFilter.trim() !== '' ? Number(minPriceFilter) : null;
  const maxVal = maxPriceFilter.trim() !== '' ? Number(maxPriceFilter) : null;

  if (minVal !== null && !Number.isNaN(minVal) && effectivePrice < minVal) {
    return false;
  }
  if (maxVal !== null && !Number.isNaN(maxVal) && effectivePrice > maxVal) {
    return false;
  }

  // 2. فلترة البحث (الاسم، الفئة، السعر المباشر، أو رينج مثل 100-500)
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;

  const rangeMatch = q.match(
    /^(\d+(?:\.\d+)?)\s*(?:-|:|to)\s*(\d+(?:\.\d+)?)$/,
  );
  if (rangeMatch) {
    const low = Math.min(Number(rangeMatch[1]), Number(rangeMatch[2]));
    const high = Math.max(Number(rangeMatch[1]), Number(rangeMatch[2]));
    const matchesCurrent = effectivePrice >= low && effectivePrice <= high;
    const matchesCompare =
      comparePrice !== null && comparePrice >= low && comparePrice <= high;
    return matchesCurrent || matchesCompare;
  }

  const nameMatch = String(product.name || '')
    .toLowerCase()
    .includes(q);
  const catMatch = categoryName.toLowerCase().includes(q);
  const priceMatch =
    String(effectivePrice).includes(q) ||
    effectivePrice.toString().includes(q) ||
    (comparePrice !== null && String(comparePrice).includes(q));

  return nameMatch || catMatch || priceMatch;
});
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageAnimKey, setInventoryPageAnimKey] = useState(0);
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  const INVENTORY_PER_PAGE = 10;
  const totalInventoryPages = Math.max(
    1,
    Math.ceil((displayedInventory?.length || 0) / INVENTORY_PER_PAGE),
  );
  const safeInventoryPage = Math.min(inventoryPage, totalInventoryPages);
  const inventoryStartIndex = (safeInventoryPage - 1) * INVENTORY_PER_PAGE;
  const inventoryEndIndex = Math.min(
    inventoryStartIndex + INVENTORY_PER_PAGE,
    displayedInventory?.length || 0,
  );
  const paginatedInventory = (displayedInventory || []).slice(
    inventoryStartIndex,
    inventoryEndIndex,
  );

  const handleInventoryPageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalInventoryPages));
    if (clamped === safeInventoryPage) return;
    setInventoryPage(clamped);
    setInventoryPageAnimKey((k) => k + 1);
  };
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  useEffect(() => {
    setInventoryPage(1);
  }, [displayedInventory?.length]);
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================
  // ======================================

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
      {/* 2. كود الشكل العائم للتنبيه */}
      {toast && (
        <div className='fixed top-6 right-6 z-50 animate-bounce duration-300'>
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-950'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* Admin Navbar */}
      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 grid grid-cols-3 items-center'>
          <div className='flex items-center justify-start'>
            <Link
              href='/admin'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <ArrowLeft size={16} />
              <span className='hidden sm:inline'>Back to Dashboard</span>
            </Link>
          </div>
          {/* ============================== */}
          {/* ============================== */}
          {/* ============================== */}
          <div className='min-w-0 flex-1 text-center px-1 sm:px-0'>
            <h1 className='text-[11px] sm:text-base lg:text-lg font-extrabold tracking-tight whitespace-normal break-words leading-snug bg-gradient-to-r from-rose-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent'>
              Product &amp; Category Management ⚡
            </h1>
            {/* <p className='text-[9px] sm:text-xs text-slate-300/80 font-medium whitespace-normal break-words leading-snug mt-0.5'>
              Abdo Store
            </p> */}
          </div>
          {/* ============================== */}
          {/* ============================== */}

          <div className='flex items-center justify-end gap-2'>
            <button
              onClick={handleLogout}
              className='flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-red-500/30 cursor-pointer shadow-sm'
            >
              <LogOut size={15} />
              <span className='hidden sm:inline'>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          {/* Form Column (إضافة وتعديل المنتجات + إدارة التصنيفات) */}
          <div className='lg:col-span-5 space-y-6'>
            {/* قسم إدارة وتعديل التصنيفات الحقيقية */}
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/95 shadow-xl space-y-4'>
              <h3 className='text-xs font-black uppercase text-slate-300 tracking-wider flex items-center justify-between'>
                <span>🏷️ Manage Store Categories</span>
                <span className='text-[10px] text-blue-400 font-semibold'>
                  {categories.length} Categories
                </span>
              </h3>

              {/* فورم إضافة/تعديل تصنيف */}
              <form onSubmit={handleSaveCategory} className='flex gap-2'>
                <input
                  type='text'
                  placeholder={
                    editingCategory
                      ? 'Edit category name...'
                      : 'Add new category...'
                  }
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className='flex-1 px-3 py-2.5 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none'
                />
                <button
                  type='submit'
                  className='px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md'
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
                {editingCategory && (
                  <button
                    type='button'
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategoryName('');
                    }}
                    className='px-3 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer'
                  >
                    Cancel
                  </button>
                )}
              </form>

              {/* قائمة عرض التصنيفات مع أزرار التعديل والحذف */}
              <div className='flex flex-wrap gap-2 pt-2 max-h-36 overflow-y-auto scrollbar-none'>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className='flex items-center gap-1.5 bg-[#141d2f] border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs text-slate-200'
                  >
                    <span>{cat.name}</span>
                    <button
                      type='button'
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewCategoryName(cat.name);
                      }}
                      className='text-blue-400 hover:text-blue-300 ml-1'
                      title='Edit'
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setCatToDelete(cat);
                        setCatDeleteModalOpen(true);
                      }}
                      className='text-red-400 hover:text-red-300'
                      title='Delete'
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* فورم إضافة وتعديل المنتج الأساسي */}
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/95 shadow-2xl space-y-6'>
              <div className='flex items-center justify-between border-b border-slate-800 pb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20'>
                    {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h2 className='text-base font-black text-white'>
                      {editingId ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <p className='text-xs text-slate-300'>
                      {editingId
                        ? 'Update product details'
                        : 'Fill in details to publish'}
                    </p>
                  </div>
                </div>

                {editingId && (
                  <button
                    onClick={resetForm}
                    className='text-xs text-slate-400 hover:text-white underline cursor-pointer'
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProduct} className='space-y-4'>
                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    Product Name *
                  </label>
                  <input
                    type='text'
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='e.g. Cyber Tech Gadget'
                  />
                </div>
                {/* اختيار التصنيف عبر مودال صغير قابل للسكرول */}
                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    Select Category *
                  </label>

                  <button
                    type='button'
                    onClick={() => setIsCategoryModalOpen(true)}
                    className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 hover:border-blue-500/70 rounded-xl text-white outline-none text-xs cursor-pointer flex items-center justify-between transition group'
                  >
                    <span
                      className={
                        selectedCategory
                          ? 'text-slate-100 font-bold'
                          : 'text-slate-400 group-hover:text-slate-300'
                      }
                    >
                      {selectedCategory
                        ? selectedCategory.name
                        : '-- Choose Category --'}
                    </span>
                    <ChevronDown
                      size={16}
                      className='text-slate-400 group-hover:text-blue-400 transition flex-shrink-0'
                    />
                  </button>

                  <input
                    type='text'
                    value={categoryId || ''}
                    onChange={() => {}}
                    required
                    tabIndex={-1}
                    aria-hidden='true'
                    className='sr-only'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                      Price (EGP) *
                    </label>
                    <input
                      type='number'
                      step='0.01'
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 text-white placeholder-slate-500 outline-none text-xs transition'
                      placeholder='200'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                      Compare Price (Before)
                    </label>
                    <input
                      type='number'
                      step='0.01'
                      value={comparePrice}
                      onChange={(e) => setComparePrice(e.target.value)}
                      className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 text-white placeholder-slate-500 outline-none text-xs transition'
                      placeholder='250'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                      Stock Quantity
                    </label>
                    <input
                      type='number'
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 text-white placeholder-slate-500 outline-none text-xs transition'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                      Rating (Stars)
                    </label>

                    <button
                      type='button'
                      onClick={() => setIsRatingModalOpen(true)}
                      className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 hover:border-amber-500/60 rounded-xl text-white outline-none text-xs cursor-pointer flex items-center justify-between transition group'
                    >
                      <div className='flex items-center gap-2.5'>
                        {renderRatingStars(selectedRatingOption.stars, 13)}
                        <span className='text-slate-100 font-bold'>
                          ({selectedRatingOption.label})
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className='text-slate-400 group-hover:text-amber-400 transition flex-shrink-0'
                      />
                    </button>
                  </div>
                </div>

                {/* Section Assignment Checkboxes */}
                <div className='bg-[#141d2f]/80 p-4 rounded-2xl border border-slate-800 space-y-3'>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider'>
                    Display Sections Assignment
                  </label>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5'>
                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs font-bold ${
                        showInHero
                          ? 'bg-blue-950/40 border-blue-500/50 text-blue-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={showInHero}
                        onChange={(e) => setShowInHero(e.target.checked)}
                        className='rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500'
                      />
                      <span>Hero Banner</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs font-bold ${
                        showInFlash
                          ? 'bg-red-950/40 border-red-500/50 text-red-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={showInFlash}
                        onChange={(e) => setShowInFlash(e.target.checked)}
                        className='rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500'
                      />
                      <span>Flash Deals</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs font-bold ${
                        showInCatalog
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={showInCatalog}
                        onChange={(e) => setShowInCatalog(e.target.checked)}
                        className='rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500'
                      />
                      <span>Catalog</span>
                    </label>
                  </div>
                </div>

                {/* Product Images Uploader & Grid Display */}
                {/* Product Images Uploader & Grid Display */}
                {/* Product Images Uploader & Grid Display */}
                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    Product Images
                  </label>

                  <div className='relative border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-slate-500 transition bg-[#141d2f]/50'>
                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      onChange={handleImagesSelect}
                      className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                    />
                    <div className='flex flex-col items-center justify-center space-y-2'>
                      <Upload className='w-6 h-6 text-slate-400' />
                      <span className='text-xs text-slate-300 font-medium'>
                        Click to upload multiple images or drag & drop
                      </span>
                      <span className='text-[10px] text-slate-400'>
                        Uploaded to Cloudinary when you click Save
                      </span>
                    </div>
                  </div>

                  {(images.length > 0 || pendingPreviews.length > 0) && (
                    <div className='grid grid-cols-4 gap-2 mt-3'>
                      {images.map((img, index) => (
                        <div
                          key={`existing-${index}`}
                          className='relative group aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md'
                        >
                          <Image
                            src={img}
                            alt={`upload-${index}`}
                            width={256}
                            height={256}
                            loading='lazy'
                            unoptimized={
                              typeof img === 'string' &&
                              (img.startsWith('blob:') ||
                                img.startsWith('data:'))
                            }
                            sizes='(max-width: 640px) 120px, 160px'
                            className='w-full h-full object-cover'
                          />
                          <button
                            type='button'
                            onClick={() => handleRemoveExistingImage(index)}
                            className='absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer'
                            title='Remove image'
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {pendingPreviews.map((previewUrl, index) => (
                        <div
                          key={`pending-${index}`}
                          className='relative group aspect-square rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 shadow-md'
                        >
                          <Image
                            src={previewUrl}
                            alt={`pending-${index}`}
                            width={256}
                            height={256}
                            loading='lazy'
                            unoptimized={
                              typeof previewUrl === 'string' &&
                              (previewUrl.startsWith('blob:') ||
                                previewUrl.startsWith('data:'))
                            }
                            sizes='(max-width: 640px) 33vw, 150px'
                            className='w-full h-full object-cover'
                          />
                          <span className='absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/90 text-slate-950'>
                            Pending
                          </span>
                          <button
                            type='button'
                            onClick={() => handleRemovePendingFile(index)}
                            className='absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer'
                            title='Remove image'
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploading && (
                    <div className='flex items-center gap-2 mt-2 text-xs text-blue-400 font-medium'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span>Uploading images...</span>
                    </div>
                  )}

                  {(images.length > 0 || pendingFiles.length > 0) &&
                    !uploading && (
                      <div className='flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium'>
                        <CheckCircle2 className='w-4 h-4' />
                        <span>
                          Selected images: {images.length + pendingFiles.length}
                          {pendingFiles.length > 0
                            ? ` (${pendingFiles.length} pending upload)`
                            : ''}
                        </span>
                      </div>
                    )}
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='Enter product description...'
                  />
                </div>
                {/* ======================================= */}
                {/* ======================================= */}
                {/* ======================================= */}

                <div className='flex items-center gap-3 pt-2'>
                  {/* زر الإلغاء والتفريغ */}
                  <button
                    type='button'
                    onClick={() => {
                      // لو عندك دالة اسمها resetForm أو عاوز تصفر البيانات، حطها هنا
                      if (typeof resetForm === 'function') resetForm();
                      // لو عاوز تقفل وضع التعديل لو موجود:
                      // if (typeof setEditingId === 'function') setEditingId(null);
                    }}
                    disabled={submitting || uploading}
                    className='w-1/3 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700 transition duration-300 disabled:opacity-50 text-xs flex items-center justify-center cursor-pointer shadow-md'
                  >
                    Cancel
                  </button>

                  {/* زر الحفظ الأساسي */}
                  <button
                    type='submit'
                    disabled={submitting || uploading}
                    className='w-2/3 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 transition duration-300 disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer'
                  >
                    {submitting ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>Saving Product...</span>
                      </>
                    ) : (
                      <span>
                        {editingId ? 'Update Product' : 'Save & Add Product'}
                      </span>
                    )}
                  </button>
                </div>
                {/* ======================================= */}
                {/* ======================================= */}
                {/* ======================================= */}
                {/* ======================================= */}
              </form>
            </div>
          </div>
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* Products List Table Column (جدول المنتجات والفلترة المتقدمة) */}
          <div className='lg:col-span-7 bg-[#0e1626]/90 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-slate-800/95 shadow-2xl space-y-5 h-fit'>
            <div className='flex items-center justify-between border-b border-slate-800 pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700'>
                  <Package size={20} />
                </div>
                <div>
                  <h2 className='text-base font-black text-white'>
                    Product Inventory ({displayedInventory.length})
                  </h2>
                  <p className='text-xs text-slate-400'>
                    Manage, filter and review store items
                  </p>
                </div>
              </div>
            </div>
            {/* ================================== */}
            {/* ================================== */}
            {/* ================================== */}

            {/* إنبوت البحث الفوري فوق بوكسات الفلترة */}
            <div className='relative'>
              <Search
                size={16}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
              />

              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search name, category, price, or 100-500...'
                className='w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#090f19]/85 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 border border-slate-800 focus:border-blue-500/60 focus:outline-none transition'
              />

              {/* مجموعة الأزرار الصغيرة يمين الإنبوت: زر رينج الأسعار + زر مسح البحث */}
              <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setPriceRangeOpen((prev) => !prev)}
                  title='Price Range Filter'
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    hasActivePriceRange || priceRangeOpen
                      ? 'bg-gradient-to-r from-red-600/25 to-blue-600/25 text-blue-200 border-blue-400/50'
                      : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {hasActivePriceRange
                    ? `${minPriceFilter || '0'}–${maxPriceFilter || '∞'}`
                    : 'Price'}
                </button>

                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    aria-label='Clear search'
                    className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer'
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* بوب أوفر صغير لتحديد رينج الأسعار */}
              {priceRangeOpen && (
                <div className='mt-2 p-3 rounded-xl bg-[#0c1424] border border-slate-700/90 shadow-xl space-y-2.5'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-[11px] font-bold text-slate-200'>
                      Price Range Filter
                    </span>
                    <button
                      type='button'
                      onClick={() => setPriceRangeOpen(false)}
                      className='p-0.5 rounded text-slate-400 hover:text-white cursor-pointer'
                      aria-label='Close price range'
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='block text-[10px] font-semibold text-slate-400 mb-1'>
                        Min Price
                      </label>
                      <input
                        type='number'
                        min='0'
                        value={minPriceFilter}
                        onChange={(e) => setMinPriceFilter(e.target.value)}
                        placeholder='0'
                        className='w-full px-2.5 py-1.5 rounded-lg bg-[#090f19] text-xs text-slate-100 placeholder:text-slate-600 border border-slate-800 focus:border-blue-500/60 focus:outline-none font-mono'
                      />
                    </div>
                    <div>
                      <label className='block text-[10px] font-semibold text-slate-400 mb-1'>
                        Max Price
                      </label>
                      <input
                        type='number'
                        min='0'
                        value={maxPriceFilter}
                        onChange={(e) => setMaxPriceFilter(e.target.value)}
                        placeholder='Any'
                        className='w-full px-2.5 py-1.5 rounded-lg bg-[#090f19] text-xs text-slate-100 placeholder:text-slate-600 border border-slate-800 focus:border-blue-500/60 focus:outline-none font-mono'
                      />
                    </div>
                  </div>

                  <div className='flex items-center justify-between gap-2 pt-0.5'>
                    <button
                      type='button'
                      onClick={() => {
                        setMinPriceFilter('');
                        setMaxPriceFilter('');
                      }}
                      className='px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-bold text-slate-300 transition cursor-pointer'
                    >
                      Clear
                    </button>

                    <button
                      type='button'
                      onClick={() => setPriceRangeOpen(false)}
                      className='px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-95 text-[11px] font-bold text-white transition cursor-pointer'
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================================== */}
            {/* ================================== */}
            {/* ================================== */}
            <div className='w-full space-y-2'>
              {/* شريط تحكم علوي صغير: مؤشر اسكرول رفيع + زرارين حركة */}
              <div className='flex items-center justify-between gap-2.5 px-0.5'>
                {/* شريط اسكرول صغير يوضح مكانك وهل في عناصر مستخبية */}
                <div
                  aria-hidden='true'
                  className='relative h-1.5 flex-1 max-w-[160px] sm:max-w-[220px] rounded-full bg-[#090f19] border border-slate-800/90 overflow-hidden'
                >
                  <span
                    className='block h-full rounded-full bg-gradient-to-r from-red-500 via-rose-500 to-blue-500 transition-all duration-150'
                    style={{
                      width: `${scrollThumb.width}%`,
                      transform: `translateX(${(scrollThumb.left / Math.max(scrollThumb.width, 1)) * 100}%)`,
                    }}
                  />
                </div>

                {/* زرارين تحريك صغيرين فوق البوكسات */}
                <div className='flex items-center gap-1.5 shrink-0'>
                  <button
                    type='button'
                    onClick={() => handleScrollFilters('prev')}
                    disabled={!canScrollLeft}
                    aria-label='Scroll filters left'
                    title='السابق'
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all duration-200 select-none ${
                      canScrollLeft
                        ? 'bg-[#141d2f] hover:bg-[#1b2740] border-slate-700/80 hover:border-sky-400/60 text-slate-200 hover:text-white cursor-pointer active:scale-95 shadow-sm'
                        : 'bg-[#0e1626]/60 border-slate-800/60 text-slate-600 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight size={15} strokeWidth={2.2} />
                  </button>

                  <button
                    type='button'
                    onClick={() => handleScrollFilters('next')}
                    disabled={!canScrollRight}
                    aria-label='Scroll filters right'
                    title='التالي'
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all duration-200 select-none ${
                      canScrollRight
                        ? 'bg-[#141d2f] hover:bg-[#1b2740] border-slate-700/80 hover:border-sky-400/60 text-slate-200 hover:text-white cursor-pointer active:scale-95 shadow-sm'
                        : 'bg-[#0e1626]/60 border-slate-800/60 text-slate-600 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft size={15} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* حاوية البوكسات مع اسكرول أفقي ناعم وشريط اسكرول رفيع */}
              {/* حاوية البوكسات مع اسكرول أفقي ناعم وشريط اسكرول رفيع */}
              <div className='relative'>
                <div
                  ref={filterScrollRef}
                  onScroll={updateFilterScrollState}
                  className='flex items-center gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x scroll-smooth pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#090f19]/90 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/80 hover:[&::-webkit-scrollbar-thumb]:bg-gradient-to-r hover:[&::-webkit-scrollbar-thumb]:from-red-500/80 hover:[&::-webkit-scrollbar-thumb]:to-blue-500/80'
                >
                  <button
                    type='button'
                    onClick={() => setAdminFilter('all')}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition border shrink-0 cursor-pointer whitespace-nowrap ${
                      adminFilter === 'all'
                        ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-transparent shadow-md'
                        : 'bg-[#141d2f] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    All ({products.length})
                  </button>

                  <button
                    type='button'
                    onClick={() => setAdminFilter('multi-images')}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition border shrink-0 cursor-pointer whitespace-nowrap ${
                      adminFilter === 'multi-images'
                        ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-transparent shadow-md'
                        : 'bg-[#141d2f] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Multi Images (
                    {
                      products.filter(
                        (p) => Array.isArray(p.images) && p.images.length > 1,
                      ).length
                    }
                    )
                  </button>

                  <button
                    type='button'
                    onClick={() => setAdminFilter('hero')}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition border shrink-0 cursor-pointer whitespace-nowrap ${
                      adminFilter === 'hero'
                        ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-transparent shadow-md'
                        : 'bg-[#141d2f] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Hero ({products.filter((p) => p.show_in_hero).length})
                  </button>

                  <button
                    type='button'
                    onClick={() => setAdminFilter('flash')}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition border shrink-0 cursor-pointer whitespace-nowrap ${
                      adminFilter === 'flash'
                        ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-transparent shadow-md'
                        : 'bg-[#141d2f] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Flash ({products.filter((p) => p.show_in_flash).length})
                  </button>

                  <button
                    type='button'
                    onClick={() => setAdminFilter('catalog')}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition border shrink-0 cursor-pointer whitespace-nowrap ${
                      adminFilter === 'catalog'
                        ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-transparent shadow-md'
                        : 'bg-[#141d2f] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Catalog ({products.filter((p) => p.show_in_catalog).length})
                  </button>

                  {/* بوكس Visibility لفلترة المنتجات المعمول لها Hide */}
                  <button
                    type='button'
                    onClick={() => setAdminFilter('hidden')}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition border shrink-0 cursor-pointer whitespace-nowrap ${
                      adminFilter === 'hidden'
                        ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-transparent shadow-md'
                        : 'bg-[#141d2f] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Visibility (
                    {
                      products.filter((p) => Boolean(p.is_hidden || p.hidden))
                        .length
                    }
                    )
                  </button>

                  {/* بوكس واحد يجمع كل التصنيفات ويعرض عددها الحقيقي */}
                  <button
                    type='button'
                    onClick={() => setCategoryModalOpen(true)}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition border shrink-0 cursor-pointer whitespace-nowrap inline-flex items-center ${
                      categories.some((c) => c.id === adminFilter) ||
                      categoryModalOpen
                        ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white border-blue-300/40 shadow-md'
                        : 'bg-gradient-to-r from-[#172036] to-[#111b2e] text-blue-200 border-blue-500/30 hover:border-blue-400/60 hover:text-white'
                    }`}
                  >
                    <span>Categories ({categories.length})</span>
                    {categories.find((c) => c.id === adminFilter) && (
                      <span className='ml-1.5 px-1.5 py-0.5 rounded-md bg-white/15 text-[10px] font-black text-white'>
                        {categories.find((c) => c.id === adminFilter)?.name}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* موديل صغير بأنيميشن وألوان جذابة لاختيار التصنيف */}
              {categoryModalOpen && (
                <div
                  onClick={() => setCategoryModalOpen(false)}
                  className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn'
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className='w-full max-w-sm rounded-2xl bg-[#0c1424] border border-blue-500/30 shadow-2xl overflow-hidden transition-all duration-200 scale-100'
                  >
                    {/* هيدر الموديل */}
                    <div className='flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600/20 via-slate-900 to-blue-600/25 border-b border-slate-800'>
                      <div className='flex items-center gap-2'>
                        <span className='w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-blue-500 animate-pulse' />
                        <h3 className='text-xs sm:text-sm font-black text-white'>
                          Select Category ({categories.length})
                        </h3>
                      </div>
                      <button
                        type='button'
                        onClick={() => setCategoryModalOpen(false)}
                        aria-label='Close categories modal'
                        className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer'
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* قائمة التصنيفات */}
                    <div className='p-3 max-h-[60vh] overflow-y-auto space-y-1.5'>
                      {categories.length === 0 ? (
                        <div className='py-6 text-center text-xs text-slate-400'>
                          No categories available.
                        </div>
                      ) : (
                        categories.map((cat) => {
                          const count = products.filter(
                            (p) => p.category_id === cat.id,
                          ).length;
                          const isSelected = adminFilter === cat.id;

                          return (
                            <button
                              key={`modal-cat-${cat.id}`}
                              type='button'
                              onClick={() => {
                                setAdminFilter(cat.id);
                                setCategoryModalOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-blue-300/40 shadow-sm'
                                  : 'bg-[#121c30] text-slate-200 border-slate-800 hover:border-blue-500/40 hover:bg-[#17233b]'
                              }`}
                            >
                              <span className='truncate'>{cat.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#090f19] text-blue-300 border border-slate-800'
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* ================================== */}
              {/* ================================== */}
              {/* ================================== */}
              {/* ================================== */}
            </div>
            {/* ================================== */}
            {/* ================================== */}
            {/* ================================== */}
            {/* ================================== */}
            {/* ================================== */}
            {/* ================================== */}

            {loading ? (
              <div className='flex flex-col items-center justify-center py-20 text-slate-400 space-y-3'>
                <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
                <p className='text-xs font-medium'>Loading products...</p>
              </div>
            ) : displayedInventory.length === 0 ? (
              <div className='text-center py-16 text-slate-400 space-y-2 rounded-2xl border border-slate-800/70 bg-[#090f19]/40'>
                <Boxes className='w-12 h-12 mx-auto text-slate-600 mb-2' />
                <p className='text-sm font-bold text-slate-300'>
                  No matching products found
                </p>
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer'
                  >
                    Reset search query
                  </button>
                )}
              </div>
            ) : (
              <>
                {displayedInventory.length > INVENTORY_PER_PAGE && (
                  <div
                    dir='ltr'
                    className='mb-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#0e1626]/95 border border-slate-800/90 text-xs'
                  >
                    <div className='flex items-center gap-2 text-slate-400'>
                      <span className='w-2 h-2 rounded-full bg-blue-400 animate-pulse' />
                      <span>
                        Showing{' '}
                        <strong className='text-white font-mono'>
                          {inventoryStartIndex + 1}–{inventoryEndIndex}
                        </strong>{' '}
                        of{' '}
                        <strong className='text-blue-300 font-mono'>
                          {displayedInventory.length}
                        </strong>
                      </span>
                      <span className='text-slate-600'>•</span>
                      <span className='px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 font-mono text-[11px] font-bold'>
                        Page {safeInventoryPage} / {totalInventoryPages}
                      </span>
                    </div>

                    <div
                      key={`inventory-page-bar-${inventoryPageAnimKey}`}
                      className='flex items-center gap-1 flex-wrap'
                    >
                      <button
                        type='button'
                        onClick={() =>
                          handleInventoryPageChange(safeInventoryPage - 1)
                        }
                        disabled={safeInventoryPage === 1}
                        className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#090f19] border border-slate-700/90 text-slate-300 font-bold hover:border-blue-500/50 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer'
                      >
                        <ChevronLeft size={13} />
                        <span>Prev</span>
                      </button>

                      {Array.from({ length: totalInventoryPages }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === safeInventoryPage;

                        return (
                          <button
                            key={`inventory-page-${pageNum}`}
                            type='button'
                            onClick={() => handleInventoryPageChange(pageNum)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`min-w-[28px] h-[28px] px-2 rounded-lg font-mono text-xs font-black transition cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white border border-blue-300/40 shadow-sm'
                                : 'bg-[#090f19] text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        type='button'
                        onClick={() =>
                          handleInventoryPageChange(safeInventoryPage + 1)
                        }
                        disabled={safeInventoryPage === totalInventoryPages}
                        className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#090f19] border border-slate-700/90 text-slate-300 font-bold hover:border-blue-500/50 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer'
                      >
                        <span>Next</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div className='max-h-[420px] sm:max-h-[540px] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#090f19]/45'>
                  <table className='w-full text-left border-collapse'>
                    <thead className='sticky top-0 z-10 bg-[#0e1626]/95 backdrop-blur-md'>
                      <tr className='border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider'>
                        <th className='py-3.5 px-4'>Product & Category</th>
                        <th className='py-3.5 px-3'>Price / Compare</th>
                        <th className='py-3.5 px-3'>Assigned Sections</th>
                        {/* ================== */}
                        {/* ================== */}
                        {/* ================== */}

                        <th className='py-3.5 px-3'>
                          <div className='inline-flex items-center gap-2.5'>
                            <span>Stock</span>
                            <button
                              type='button'
                              disabled={
                                togglingAllFrontStock || products.length === 0
                              }
                              onClick={handleToggleAllFrontStock}
                              title={
                                areAllFrontStocksHidden
                                  ? 'Show stock for all products on storefront'
                                  : 'Hide stock for all products on storefront'
                              }
                              aria-label={
                                areAllFrontStocksHidden
                                  ? 'Show stock for all products on storefront'
                                  : 'Hide stock for all products on storefront'
                              }
                              className={`p-1 rounded-md border transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center ${
                                areAllFrontStocksHidden
                                  ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-500/40'
                                  : 'bg-[#141d2f] hover:bg-slate-800 text-slate-400 hover:text-blue-300 border-slate-700/80'
                              }`}
                            >
                              {togglingAllFrontStock ? (
                                <Loader2
                                  size={12}
                                  className='animate-spin text-blue-300'
                                />
                              ) : areAllFrontStocksHidden ? (
                                <EyeOff size={12} />
                              ) : (
                                <Eye size={12} />
                              )}
                            </button>
                          </div>
                        </th>
                        {/* ================== */}
                        {/* ================== */}
                        {/* ================== */}
                        {/* ================== */}
                        {/* ================== */}
                        <th className='py-3.5 px-3 text-center'>
                          Visibility & Info
                        </th>
                        <th className='py-3.5 px-4 text-right'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-800/80 text-xs'>
                      {paginatedInventory.map((product) => {
                        const matchedCat = categories.find(
                          (c) => c.id === product.category_id,
                        );
                        const currentRowStock =
                          product.stock_quantity ?? product.stock ?? 0;

                        return (
                          <tr
                            key={product.id}
                            className='hover:bg-[#141d2f]/60 transition'
                          >
                            <td className='py-4 px-4 flex items-center gap-3.5'>
                              {/* ======================== */}
                              {/* ======================== */}
                              {/* ======================== */}
                              <div className='relative w-12 h-12 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700 shadow-md'>
                                {product.images?.[0] ? (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name || 'Product Image'}
                                    width={400}
                                    height={400}
                                    loading='lazy'
                                    sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                                    className='w-full h-full object-cover'
                                  />
                                ) : (
                                  <div className='flex items-center justify-center h-full text-slate-500'>
                                    <ImageIcon size={18} />
                                  </div>
                                )}

                                {/* استيكر يظهر فقط إذا كان المنتج يحتوي على صور متعددة (Multi Images) */}
                                {Array.isArray(product.images) &&
                                  product.images.length > 1 && (
                                    <span className='absolute bottom-0 right-0 bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-tl-lg shadow-md border-t border-l border-blue-400/40 z-10'>
                                      +{product.images.length}
                                    </span>
                                  )}
                              </div>
                              {/* ======================== */}
                              {/* ======================== */}
                              {/* ======================== */}

                              <div>
                                <p className='font-bold text-slate-100 text-sm mb-0.5'>
                                  {product.name}
                                </p>
                                <span className='text-[10px] text-blue-400 font-semibold bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20'>
                                  {matchedCat
                                    ? matchedCat.name
                                    : 'Uncategorized'}
                                </span>
                              </div>
                              {/* ======================== */}
                              {/* ======================== */}
                              {/* ======================== */}
                              {/* ======================== */}
                            </td>

                            <td className='py-4 px-3'>
                              <div className='font-black text-slate-200'>
                                {product.price} EGP
                              </div>
                              {product.compare_at_price && (
                                <div className='text-[10px] text-slate-400 line-through'>
                                  {product.compare_at_price} EGP
                                </div>
                              )}
                            </td>
                            {/* ======================== */}
                            {/* ======================== */}

                            <td className='py-4 px-3'>
                              <div className='flex items-center gap-1 text-[10px] font-bold flex-wrap'>
                                {product.show_in_hero && (
                                  <span className='px-2 py-0.5 bg-blue-950 text-blue-400 rounded-md border border-blue-800/50'>
                                    Hero
                                  </span>
                                )}
                                {product.show_in_flash && (
                                  <span className='px-2 py-0.5 bg-red-950 text-red-400 rounded-md border border-red-800/50'>
                                    Flash
                                  </span>
                                )}
                                {product.show_in_catalog && (
                                  <span className='px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-md border border-emerald-800/50'>
                                    Catalog
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* ======================== */}
                            {/* ======================== */}

                            {/* خانة تعديل الستوك السريعة + زر صح (دبل كليك / دبل تاتش) + زر إخفاء الستوك من الفرونت */}
                            <td className='py-4 px-3'>
                              <div className='flex items-center gap-1'>
                                <input
                                  key={`${product.id}-${currentRowStock}`}
                                  type='number'
                                  min='0'
                                  readOnly
                                  defaultValue={currentRowStock}
                                  id={`stock-input-${product.id}`}
                                  aria-label={`Stock for ${product.name}`}
                                  onDoubleClick={(e) => {
                                    const el = e.currentTarget;
                                    el.readOnly = false;
                                    el.focus();
                                    el.select();
                                  }}
                                  onTouchEnd={(e) => {
                                    const el = e.currentTarget;
                                    const now = Date.now();
                                    const lastTap = Number(
                                      el.dataset.lastTap || '0',
                                    );
                                    if (now - lastTap < 320) {
                                      e.preventDefault();
                                      el.readOnly = false;
                                      el.focus();
                                      el.select();
                                    }
                                    el.dataset.lastTap = String(now);
                                  }}
                                  onBlur={(e) => {
                                    e.currentTarget.readOnly = true;
                                  }}
                                  title='Double click or double tap to edit'
                                  className='w-12 px-1.5 py-1 bg-[#141d2f] border border-slate-700/80 read-only:border-slate-800 read-only:text-slate-300 focus:border-emerald-500 focus:text-white rounded-lg text-xs font-bold outline-none text-center transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                />

                                <button
                                  type='button'
                                  disabled={savingStockId === product.id}
                                  onClick={() => {
                                    const inputEl = document.getElementById(
                                      `stock-input-${product.id}`,
                                    ) as HTMLInputElement | null;
                                    const rawVal = inputEl
                                      ? parseInt(inputEl.value, 10)
                                      : currentRowStock;
                                    handleInlineStockSave(
                                      product.id,
                                      Number.isNaN(rawVal) ? 0 : rawVal,
                                    );
                                    if (inputEl) inputEl.readOnly = true;
                                  }}
                                  title='Save Stock'
                                  className='p-1.5 bg-emerald-950/50 hover:bg-emerald-800/50 text-emerald-400 rounded-lg border border-emerald-500/30 transition cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0'
                                >
                                  {savingStockId === product.id ? (
                                    <Loader2
                                      size={13}
                                      className='animate-spin'
                                    />
                                  ) : (
                                    <Check size={13} />
                                  )}
                                </button>

                                <button
                                  type='button'
                                  onClick={() =>
                                    handleToggleFrontStock(product)
                                  }
                                  title={
                                    product.hide_stock_on_front
                                      ? 'Stock hidden on storefront (Click to show)'
                                      : 'Hide stock on storefront'
                                  }
                                  aria-label={
                                    product.hide_stock_on_front
                                      ? 'Show stock on storefront'
                                      : 'Hide stock on storefront'
                                  }
                                  className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center shrink-0 ${
                                    product.hide_stock_on_front
                                      ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-500/40'
                                      : 'bg-[#141d2f] hover:bg-slate-800 text-slate-400 hover:text-blue-300 border-slate-700/80'
                                  }`}
                                >
                                  {product.hide_stock_on_front ? (
                                    <EyeOff size={13} />
                                  ) : (
                                    <Eye size={13} />
                                  )}
                                </button>
                              </div>
                            </td>
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}

                            {/* عمود الإخفاء وتاريخ الإنشاء */}
                            <td className='py-4 px-3'>
                              <div className='flex items-center justify-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() => setCreatedAtProduct(product)}
                                  className='p-2.5 bg-violet-950/40 hover:bg-violet-900/40 text-violet-300 rounded-xl transition border border-violet-500/30 cursor-pointer shadow-sm'
                                  title='تاريخ ووقت الإنشاء'
                                >
                                  <Clock size={16} />
                                </button>

                                <button
                                  type='button'
                                  disabled={togglingHideId === product.id}
                                  onClick={() => handleToggleHide(product)}
                                  className={`p-2.5 rounded-xl transition border cursor-pointer shadow-sm disabled:opacity-50 ${
                                    product.is_hidden
                                      ? 'bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border-amber-500/40'
                                      : 'bg-slate-900/70 hover:bg-slate-800/70 text-slate-300 border-slate-700/60'
                                  }`}
                                  title={
                                    product.is_hidden
                                      ? 'Show Product in Store'
                                      : 'Hide Product from Store'
                                  }
                                >
                                  {togglingHideId === product.id ? (
                                    <Loader2
                                      size={16}
                                      className='animate-spin'
                                    />
                                  ) : product.is_hidden ? (
                                    <EyeOff size={16} />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* عمود التعديل والحذف الأساسي */}
                            <td className='py-4 px-4 text-right'>
                              <div className='flex items-center justify-end gap-2'>
                                <button
                                  type='button'
                                  onClick={() => handleEditClick(product)}
                                  className='p-2.5 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 rounded-xl transition border border-blue-500/30 cursor-pointer shadow-sm'
                                  title='Edit Product'
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type='button'
                                  onClick={() => confirmDelete(product.id)}
                                  className='p-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl transition border border-red-500/30 cursor-pointer shadow-sm'
                                  title='Delete Product'
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                            {/* ======================== */}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
              // =====================
              // =====================
              // =====================
              // =====================
            )}
          </div>
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
          {/* ======================================= */}
        </div>
      </main>

      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* نافذة المودال المنبثقة الاحترافية */}
      {/* ========================================= */}
      {/* Vibrant Multi-Color Professional Modal */}
      {modalInfo.isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in'>
          {/* Colorful Gradient Border Wrapper */}
          <div className='p-[2px] rounded-3xl bg-gradient-to-br from-rose-500 via-amber-400 via-emerald-400 to-blue-500 max-w-sm w-full shadow-[0_25px_60px_-15px_rgba(99,102,241,0.45)] transform transition-all animate-in zoom-in-95 duration-300'>
            {/* Deep Colorful Glass Card (No Black/White/Gray inside) */}
            <div className='bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 rounded-[22px] p-7 w-full text-center relative overflow-hidden ring-1 ring-inset ring-amber-200/15'>
              {/* Multi-Color Ambient Glows Inside Card */}
              <div className='absolute -top-14 -left-14 w-36 h-36 bg-rose-500/25 rounded-full blur-2xl pointer-events-none'></div>
              <div className='absolute -top-14 -right-14 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none'></div>
              <div className='absolute -bottom-14 -left-14 w-36 h-36 bg-blue-500/25 rounded-full blur-2xl pointer-events-none'></div>
              <div className='absolute -bottom-14 -right-14 w-36 h-36 bg-emerald-500/25 rounded-full blur-2xl pointer-events-none'></div>

              {/* Dynamic Icon Container with Layered Glow */}
              <div
                className={`relative w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl transition-transform hover:scale-105 duration-200 ${
                  modalInfo.type === 'success'
                    ? 'bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-amber-300/20 text-emerald-300 border border-emerald-400/60 shadow-emerald-500/30'
                    : modalInfo.type === 'error'
                      ? 'bg-gradient-to-tr from-rose-500/30 via-pink-500/20 to-amber-400/20 text-rose-300 border border-rose-400/60 shadow-rose-500/30'
                      : 'bg-gradient-to-tr from-blue-500/30 via-indigo-400/20 to-emerald-400/20 text-sky-300 border border-sky-400/60 shadow-blue-500/30'
                }`}
              >
                {modalInfo.type === 'success'
                  ? '✓'
                  : modalInfo.type === 'error'
                    ? '✕'
                    : 'i'}
              </div>

              {/* Title (Rich Warm-to-Cool Gradient Text) */}
              <h3 className='relative bg-gradient-to-r from-amber-200 via-rose-200 to-sky-200 bg-clip-text text-transparent font-extrabold text-xl mb-2.5 tracking-wide drop-shadow-sm'>
                {modalInfo.title}
              </h3>

              {/* Message (Soft Luminous Sky-Indigo) */}
              <p className='relative text-indigo-200/95 text-xs mb-7 leading-relaxed font-medium px-1'>
                {modalInfo.message}
              </p>

              {/* Action Button with Multi-tone Gradient & Shimmer */}
              <button
                type='button'
                onClick={closeModal}
                className={`relative w-full py-3.5 rounded-2xl font-extrabold text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                  modalInfo.type === 'success'
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-emerald-950 shadow-emerald-500/35'
                    : modalInfo.type === 'error'
                      ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-rose-950 shadow-rose-500/35'
                      : 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-indigo-950 shadow-blue-500/35'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================= */}
      {/* ========================================= */}

      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200'>
          <div className='bg-[#0e1626] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl'>
            <div className='w-14 h-14 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center justify-center mx-auto text-red-400'>
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className='text-lg font-black text-white mb-1'>
                Delete Product
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Are you sure you want to delete this product? This action cannot
                be undone.
              </p>
            </div>
            <div className='flex gap-3 pt-2'>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className='flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className='flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-red-950/50'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {catDeleteModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200'>
          <div className='bg-[#0e1626] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl'>
            <div className='w-14 h-14 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center justify-center mx-auto text-red-400'>
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className='text-lg font-black text-white mb-1'>
                Delete Category
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Are you sure you want to delete category "{catToDelete?.name}"?
              </p>
            </div>
            <div className='flex gap-3 pt-2'>
              <button
                onClick={() => setCatDeleteModalOpen(false)}
                className='flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteCategory}
                className='flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-red-950/50'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {isCategoryModalOpen && (
        <div
          onClick={() => setIsCategoryModalOpen(false)}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='relative w-full max-w-xs rounded-2xl bg-gradient-to-b from-[#131d33] to-[#0b1120] border border-slate-700/70 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150'
          >
            {/* لمسة إضاءة خفيفة في الأعلى */}
            <div className='pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-20 bg-blue-500/15 blur-2xl rounded-full' />

            {/* رأس المودال + عدد التصنيفات */}
            <div className='relative flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-[#141e35]/80'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-extrabold text-slate-100 tracking-wide'>
                  Select Category
                </span>
                <span className='px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30'>
                  {categories.length}
                </span>
              </div>

              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(false)}
                aria-label='Close category modal'
                className='w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/90 text-xs transition cursor-pointer'
              >
                ✕
              </button>
            </div>

            {/* قائمة التصنيفات بسكرول مدمج لا يملأ الشاشة */}
            <div className='relative max-h-56 overflow-y-auto p-2 space-y-1 custom-scrollbar'>
              {categories.length === 0 ? (
                <p className='text-center text-xs text-slate-400 py-8'>
                  No categories available
                </p>
              ) : (
                categories.map((cat) => {
                  const isSelected = String(cat.id) === String(categoryId);
                  return (
                    <button
                      key={cat.id}
                      type='button'
                      onClick={() => {
                        setCategoryId(cat.id);
                        setIsCategoryModalOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-blue-200 border border-blue-400/40 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className='truncate'>{cat.name}</span>
                      {isSelected && (
                        <span className='w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0 ml-2'>
                          <Check size={12} className='text-blue-300' />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {isCategoryModalOpen && (
        <div
          onClick={() => setIsCategoryModalOpen(false)}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='relative w-full max-w-xs rounded-2xl bg-gradient-to-b from-[#131d33] to-[#0b1120] border border-slate-700/70 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150'
          >
            {/* لمسة إضاءة خفيفة في الأعلى */}
            <div className='pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-20 bg-blue-500/15 blur-2xl rounded-full' />

            {/* رأس المودال + عدد التصنيفات */}
            <div className='relative flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-[#141e35]/80'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-extrabold text-slate-100 tracking-wide'>
                  Select Category
                </span>
                <span className='px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30'>
                  {categories.length}
                </span>
              </div>

              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(false)}
                aria-label='Close category modal'
                className='w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/90 text-xs transition cursor-pointer'
              >
                ✕
              </button>
            </div>

            {/* قائمة التصنيفات بسكرول مدمج لا يملأ الشاشة */}
            <div className='relative max-h-56 overflow-y-auto p-2 space-y-1 custom-scrollbar'>
              {categories.length === 0 ? (
                <p className='text-center text-xs text-slate-400 py-8'>
                  No categories available
                </p>
              ) : (
                categories.map((cat) => {
                  const isSelected = String(cat.id) === String(categoryId);
                  return (
                    <button
                      key={cat.id}
                      type='button'
                      onClick={() => {
                        setCategoryId(cat.id);
                        setIsCategoryModalOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-blue-200 border border-blue-400/40 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className='truncate'>{cat.name}</span>
                      {isSelected && (
                        <span className='w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0 ml-2'>
                          <Check size={12} className='text-blue-300' />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* =============مودل التقييمات ========= */}
      {isRatingModalOpen && (
        <div
          onClick={() => setIsRatingModalOpen(false)}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='relative w-full max-w-xs rounded-2xl bg-gradient-to-b from-[#131d33] to-[#0b1120] border border-slate-700/70 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150'
          >
            {/* لمسة إضاءة دافئة في الأعلى */}
            <div className='pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-20 bg-amber-400/15 blur-2xl rounded-full' />

            {/* رأس المودال + عدد الخيارات */}
            <div className='relative flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-[#141e35]/80'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-extrabold text-slate-100 tracking-wide'>
                  Select Rating
                </span>
                <span className='px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30'>
                  {ratingOptions.length}
                </span>
              </div>

              <button
                type='button'
                onClick={() => setIsRatingModalOpen(false)}
                aria-label='Close rating modal'
                className='w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/90 text-xs transition cursor-pointer'
              >
                ✕
              </button>
            </div>

            {/* قائمة التقييمات بسكرول مدمج لا يملأ الشاشة */}
            <div className='relative max-h-56 overflow-y-auto p-2 space-y-1'>
              {ratingOptions.map((opt) => {
                const isSelected = opt.value === String(rating);
                return (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => {
                      setRating(opt.value);
                      setIsRatingModalOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-200 border border-amber-400/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className='flex items-center gap-2.5'>
                      {renderRatingStars(opt.stars, 13)}
                      <span className='font-bold'>({opt.label})</span>
                    </div>

                    {isSelected && (
                      <span className='w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center flex-shrink-0'>
                        <Check size={12} className='text-amber-300' />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* مودل اختيار التنصيفات  */}
      {/* ====================== */}
      {isCategoryModalOpen && (
        <div
          onClick={() => setIsCategoryModalOpen(false)}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='relative w-full max-w-xs rounded-2xl bg-gradient-to-b from-[#131d33] to-[#0b1120] border border-slate-700/70 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150'
          >
            {/* لمسة إضاءة خفيفة في الأعلى */}
            <div className='pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-20 bg-blue-500/15 blur-2xl rounded-full' />

            {/* رأس المودال + عدد التصنيفات */}
            <div className='relative flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-[#141e35]/80'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-extrabold text-slate-100 tracking-wide'>
                  Select Category
                </span>
                <span className='px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30'>
                  {categories.length}
                </span>
              </div>

              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(false)}
                aria-label='Close category modal'
                className='w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/90 text-xs transition cursor-pointer'
              >
                ✕
              </button>
            </div>

            {/* قائمة التصنيفات بسكرول مدمج لا يملأ الشاشة */}
            <div className='relative max-h-56 overflow-y-auto p-2 space-y-1 custom-scrollbar'>
              {categories.length === 0 ? (
                <p className='text-center text-xs text-slate-400 py-8'>
                  No categories available
                </p>
              ) : (
                categories.map((cat) => {
                  const isSelected = String(cat.id) === String(categoryId);
                  return (
                    <button
                      key={cat.id}
                      type='button'
                      onClick={() => {
                        setCategoryId(cat.id);
                        setIsCategoryModalOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-blue-200 border border-blue-400/40 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className='truncate'>{cat.name}</span>
                      {isSelected && (
                        <span className='w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0 ml-2'>
                          <Check size={12} className='text-blue-300' />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/*مودل التاريخ الوقت */}
      {/* ====================== */}

      {createdAtProduct && (
        <div
          onClick={() => setCreatedAtProduct(null)}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir='rtl'
            className='w-full max-w-sm rounded-2xl bg-[#0e1626] border border-slate-700/80 p-5 shadow-2xl text-right space-y-4'
          >
            <div className='flex items-center justify-between border-b border-slate-800 pb-3'>
              <div className='flex items-center gap-2 text-violet-300 font-bold text-sm'>
                <Clock size={17} />
                <span>تاريخ إنشاء المنتج</span>
              </div>
              <button
                type='button'
                onClick={() => setCreatedAtProduct(null)}
                className='text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer'
              >
                ✕
              </button>
            </div>

            <div className='space-y-1.5'>
              <p className='text-xs text-slate-400'>المنتج:</p>
              <p className='text-sm font-bold text-slate-100'>
                {createdAtProduct.name}
              </p>
            </div>

            <div className='rounded-xl bg-[#141d2f] border border-slate-800 p-3.5 space-y-1'>
              <p className='text-[11px] text-slate-400'>
                تاريخ ووقت الإضافة (12 ساعة):
              </p>
              <p className='text-xs sm:text-sm font-extrabold text-emerald-300'>
                {formatCreatedAt12h(createdAtProduct.created_at)}
              </p>
            </div>

            <button
              type='button'
              onClick={() => setCreatedAtProduct(null)}
              className='w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer'
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* توست صغير لتأكيد تحديث الستوك */}
      {stockToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border flex items-center gap-2 transition ${
            stockToast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/40'
              : 'bg-red-950/95 text-red-300 border-red-500/40'
          }`}
        >
          <span>{stockToast.message}</span>
        </div>
      )}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
      {/* ====================== */}
    </div>
  );
}
