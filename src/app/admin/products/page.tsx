'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  Image as ImageIcon,
  Package,
  Boxes,
  LogOut,
  Loader2,
  Upload,
  X, // <-- أضف هذه الأيقونة هنا
  CheckCircle2,
  Star,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit & Delete Modal States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Add/Edit Product Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
const [images, setImages] = useState<string[]>([]);
  const [rating, setRating] = useState('5');

  // Section Display Assignment States (التحكم في ظهور المنتج في السكاشن الثلاثة)
  const [showInHero, setShowInHero] = useState(false);
  const [showInFlash, setShowInFlash] = useState(false);
  const [showInCatalog, setShowInCatalog] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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




  // Cloudinary Image Upload

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');
        formData.append('folder', 'store-products');

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          },
        );

        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      }

      // دمج الصور الجديدة مع الصور القديمة لو بتعدل
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error('Error uploading images:', err);
      alert('Failed to upload some images.');
    } finally {
      setUploading(false);
    }
  };



  // Save or Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price) {
      alert('Please enter product name and price at least.');
      return;
    }

    setSubmitting(true);


const productData = {
  name,
  description,
  price: parseFloat(price),
  compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
  stock_quantity: parseInt(stock),
  category_id: categoryId ? categoryId : null,
  images: images, // <-- هنا بتبعت المصفوفة اللي فيها كل الصور المرفوعة
  rating: parseInt(rating) || 5,
  is_active: true,
  show_in_hero: showInHero,
  show_in_flash: showInFlash,
  show_in_catalog: showInCatalog,
};


    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingId);

      setSubmitting(false);

      if (error) {
        alert('Error updating product: ' + error.message);
      } else {
        alert('Product updated successfully!');
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

      const { error } = await supabase
        .from('products')
        .insert([{ ...productData, slug }]);

      setSubmitting(false);

      if (error) {
        alert('Error adding product: ' + error.message);
      } else {
        alert('Product added successfully!');
        resetForm();
        fetchData();
      }
    }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.price ? product.price.toString() : '');
    setComparePrice(
      product.compare_at_price ? product.compare_at_price.toString() : '',
    );
    setStock(product.stock_quantity ? product.stock_quantity.toString() : '10');
    setCategoryId(product.category_id || '');
setImages(product.images || []);
    setRating(product.rating ? product.rating.toString() : '5');
    setShowInHero(product.show_in_hero || false);
    setShowInFlash(product.show_in_flash || false);
    setShowInCatalog(product.show_in_catalog ?? true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setComparePrice('');
    setStock('10');
    setCategoryId('');
setImages([]);
    setRating('5');
    setShowInHero(false);
    setShowInFlash(false);
    setShowInCatalog(true);
  };

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productToDelete);

    if (!error) {
      setProducts(products.filter((p) => p.id !== productToDelete));
    } else {
      alert('Failed to delete product: ' + error.message);
    }

    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #07090e;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ef4444, #3b82f6);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #dc2626, #2563eb);
        }
      `}</style>

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

          <div className='text-center'>
            <h1 className='text-sm sm:text-base font-black text-white tracking-tight'>
              Product Management
            </h1>
            <p className='text-[10px] sm:text-[11px] text-slate-400 font-medium'>
              Add, Edit & Sections Assignment Control
            </p>
          </div>

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
          {/* Form Column */}
          <div className='lg:col-span-5 bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/95 shadow-2xl h-fit space-y-6'>
            <div className='flex items-center justify-between border-b border-slate-800 pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20'>
                  {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className='text-base font-black text-white'>
                    {editingId ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className='text-xs text-slate-400'>
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
                  Product Name
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
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 text-white outline-none text-xs transition cursor-pointer'
                  >
                    <option value='5'>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value='4'>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value='3'>⭐⭐⭐ (3 Stars)</option>
                    <option value='2'>⭐⭐ (2 Stars)</option>
                    <option value='1'>⭐ (1 Star)</option>
                  </select>
                </div>
              </div>

              {/* Section Assignment Checkboxes (اختيار السكاشن الثلاثة للمنتج) */}
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

              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Product Image
                </label>

                <div className='relative border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-slate-500 transition bg-[#141d2f]/50'>
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleImagesUpload}
                    className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                  />
                  <div className='flex flex-col items-center justify-center space-y-2'>
                    <Upload className='w-6 h-6 text-slate-400' />
                    <span className='text-xs text-slate-300 font-medium'>
                      Click to upload multiple images or drag & drop
                    </span>
                  </div>
                </div>

                {/* معاينة الصور المرفوعة مع زر لحذف أي صورة مش عاجباك */}
                {images.length > 0 && (
                  <div className='grid grid-cols-4 gap-2 mt-3'>
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className='relative group aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900'
                      >
                        <img
                          src={img}
                          alt={`upload-${index}`}
                          className='w-full h-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={() =>
                            setImages(images.filter((_, i) => i !== index))
                          }
                          className='absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition'
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
                    <span>Uploading image...</span>
                  </div>
                )}

                {images.length > 0 && (
                  <div className='flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium'>
                    <CheckCircle2 className='w-4 h-4' />
                    <span>Images uploaded successfully! ({images.length})</span>
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

              <button
                type='submit'
                disabled={submitting || uploading}
                className='w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 transition duration-300 disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer'
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
            </form>
          </div>

          {/* Products List Table Column */}
          <div className='lg:col-span-7 bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/95 shadow-2xl space-y-6 h-fit'>
            <div className='flex items-center justify-between border-b border-slate-800 pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700'>
                  <Package size={20} />
                </div>
                <div>
                  <h2 className='text-base font-black text-white'>
                    Product Inventory
                  </h2>
                  <p className='text-xs text-slate-400'>
                    Total items: {products.length}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className='flex flex-col items-center justify-center py-20 text-slate-400 space-y-3'>
                <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
                <p className='text-xs font-medium'>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className='text-center py-20 text-slate-400 space-y-2'>
                <Boxes className='w-12 h-12 mx-auto text-slate-600 mb-2' />
                <p className='text-sm font-bold text-slate-300'>
                  No products added yet
                </p>
                <p className='text-xs'>
                  Add your first product using the form on the left.
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider'>
                      <th className='pb-3 pr-4'>Product</th>
                      <th className='pb-3 px-3'>Price</th>
                      <th className='pb-3 px-3'>Assigned Sections</th>
                      <th className='pb-3 pl-4 text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-800/80 text-xs'>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className='hover:bg-[#141d2f]/50 transition'
                      >
                        <td className='py-4 pr-4 flex items-center gap-3.5'>
                          <div className='relative w-12 h-12 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700 shadow-md'>
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <div className='flex items-center justify-center h-full text-slate-500'>
                                <ImageIcon size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className='font-bold text-slate-100 text-sm mb-0.5'>
                              {product.name}
                            </p>
                            <p className='text-[11px] text-slate-400'>
                              {product.stock_quantity} in stock
                            </p>
                          </div>
                        </td>

                        <td className='py-4 px-3'>
                          <div className='font-black text-slate-200'>
                            {product.price} EGP
                          </div>
                        </td>

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
                            {product.show_in_catalog !== false && (
                              <span className='px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-md border border-emerald-800/50'>
                                Catalog
                              </span>
                            )}
                          </div>
                        </td>

                        <td className='py-4 pl-4 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <button
                              onClick={() => handleEditClick(product)}
                              className='p-2.5 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 rounded-xl transition border border-blue-500/30 cursor-pointer shadow-sm'
                              title='Edit Product'
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => confirmDelete(product.id)}
                              className='p-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl transition border border-red-500/30 cursor-pointer shadow-sm'
                              title='Delete Product'
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

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
    </div>
  );
}
