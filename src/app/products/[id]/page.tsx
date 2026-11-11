'use client';

import { useState, useEffect } from 'react';

import { useParams } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Check,
  Maximize2,
  X,
  Star,
  Heart,
  Loader2,
  Package,
} from 'lucide-react';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';




// ============================
// ============================
// ============================
// ============================
// ============================
// ============================



// ============================
// ============================
// ============================
// ============================













export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id;

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

  // Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductData(id as string);
      fetchStoreSettings();
      updateCartCount();
      checkWishlistStatus(id as string);
    }
  }, [id]);

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
      wishlist = wishlist.filter((item: any) => item.id === product.id);
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

  const fetchProductData = async (productId: string) => {
    setLoading(true);

    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !productData) {
      setLoading(false);
      return;
    }

    setProduct(productData);

    // Fetch Related Products
    if (productData.category_id || productData.category) {
      const catField = productData.category_id ? 'category_id' : 'category';
      const catValue = productData.category_id || productData.category;

      const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .eq(catField, catValue)
        .neq('id', productId)
        .limit(4);

      if (relatedData) {
        setRelatedProducts(relatedData);
      }
    }

    fetchReviews(productId);
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

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !comment) {
      alert('Please enter your name and comment.');
      return;
    }

    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert([
      {
        product_id: product.id,
        reviewer_name: reviewerName,
        rating: rating,
        comment: comment,
      },
    ]);

    if (!error) {
      setComment('');
      setReviewerName('');
      fetchReviews(product.id);
      alert('Review added successfully!');
    } else {
      alert('Error adding review: ' + error.message);
    }
    setSubmittingReview(false);
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
      {/* Custom Neon Scrollbar Styles */}
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

      {/* Background Glow Orbs */}
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div className='fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4'>
          <button
            onClick={() => setIsZoomOpen(false)}
            className='absolute top-5 left-5 text-white bg-slate-800/80 hover:bg-slate-700 p-3 rounded-2xl transition cursor-pointer border border-slate-700'
          >
            <X size={20} />
          </button>
          <img
            src={mainImage}
            alt={product.name}
            className='max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-slate-800'
          />
        </div>
      )}

      {/* Navbar */}
      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between'>
          <Link
            href='/'
            className='text-base sm:text-lg font-black flex items-center gap-2.5 text-white'
          >
            <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center shadow-lg shadow-red-600/20'>
              <ShoppingBag className='w-5 h-5 text-white' />
            </div>
            <span>Online Store</span>
          </Link>

          <div className='flex items-center gap-3'>
            <Link
              href='/cart'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm relative'
            >
              <ShoppingCart size={16} />
              <span className='hidden sm:inline'>Cart</span>
              {cartCount > 0 && (
                <span className='bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center absolute -top-2 -right-2 shadow-md'>
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href='/'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <ArrowLeft size={16} />
              <span className='hidden sm:inline'>Storefront</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className='max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 space-y-10'>
        {/* Main Product Details Card */}
        <div className='bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center'>
          {/* Product Image & Wishlist/Zoom */}
          <div className='relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-[#141d2f]/50 group'>
            <img
              src={mainImage}
              alt={product.name}
              className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
            />

            {/* Wishlist Button */}
            <button
              onClick={toggleWishlist}
              className={`absolute top-3 right-3 p-3 rounded-2xl backdrop-blur-md transition shadow-lg cursor-pointer border ${
                isWishlisted
                  ? 'bg-rose-950/80 text-rose-500 border-rose-500/40'
                  : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title='Add to Wishlist'
            >
              <Heart
                size={18}
                className={isWishlisted ? 'fill-rose-500' : ''}
              />
            </button>

            {/* Zoom Button */}
            <button
              onClick={() => setIsZoomOpen(true)}
              className='absolute bottom-3 left-3 bg-slate-900/80 hover:bg-slate-900 text-slate-200 px-3.5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs font-bold border border-slate-700 cursor-pointer'
            >
              <Maximize2 size={15} /> Zoom Image
            </button>




          </div>

          {/* Product Info & Actions */}
          <div className='space-y-5'>
            <span className='text-[11px] font-bold px-3 py-1.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700'>
              {product.category || 'General Store'}
            </span>

            <h1 className='text-2xl sm:text-3xl font-black text-white tracking-tight'>
              {product.name}
            </h1>

            <div className='flex items-center gap-3'>
              <span className='text-2xl font-black text-white'>
                {product.price}{' '}
                <span className='text-xs text-slate-400 font-normal'>
                  {currency}
                </span>
              </span>
              {product.compare_at_price && (
                <span className='text-sm text-slate-500 line-through'>
                  {product.compare_at_price} {currency}
                </span>
              )}
            </div>

            <p className='text-xs sm:text-sm text-slate-400 leading-relaxed font-medium'>
              {product.description ||
                'High quality product designed specifically to meet your needs efficiently.'}
            </p>

            <div className='border-t border-b border-slate-800 py-4 space-y-2.5 text-xs text-slate-300 font-medium'>
              <div className='flex items-center gap-2.5'>
                <Truck size={16} className='text-blue-400' /> Fast delivery to
                all regions & cities
              </div>
              <div className='flex items-center gap-2.5'>
                <ShieldCheck size={16} className='text-emerald-400' /> Quality
                guarantee & easy return policy
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className='flex items-center gap-3.5 pt-2'>
              <div className='flex items-center bg-[#141d2f] border border-slate-700/80 rounded-xl overflow-hidden'>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className='px-3.5 py-3 font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer'
                >
                  -
                </button>
                <span className='px-4 text-xs font-bold text-white'>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className='px-3.5 py-3 font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer'
                >
                  +
                </button>
              </div>

              <button
                onClick={addToCart}
                className={`flex-1 py-3.5 px-6 rounded-xl text-xs font-bold transition duration-300 flex items-center justify-center gap-2.5 shadow-lg cursor-pointer ${
                  added
                    ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-red-950/50'
                }`}
              >
                {added ? (
                  <>
                    <Check size={16} /> Added to Cart Successfully
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className='space-y-6 pt-4'>
            <h2 className='text-xl font-black text-white tracking-tight'>
              Related Products You May Like
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
              {relatedProducts.map((item) => {
                const itemImg =
                  item.image ||
                  item.images?.[0] ||
                  'https://via.placeholder.com/300';
                return (
                  <Link
                    key={item.id}
                    href={`/products/${item.id}`}
                    className='bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition group flex flex-col justify-between'
                  >
                    <div className='aspect-square bg-slate-900 overflow-hidden relative border-b border-slate-800'>
                      <img
                        src={itemImg}
                        alt={item.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
                      />
                    </div>
                    <div className='p-5 space-y-1'>
                      <h3 className='font-bold text-sm text-slate-100 line-clamp-1'>
                        {item.name}
                      </h3>
                      <div className='text-sm font-black text-blue-400'>
                        {item.price}{' '}
                        <span className='text-xs text-slate-400 font-normal'>
                          {currency}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Reviews & Ratings Section */}
        <div className='bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-8 space-y-6'>
          <div className='flex items-center gap-3 border-b border-slate-800 pb-4'>
            <Star className='text-amber-400 fill-amber-400' size={22} />
            <h2 className='text-lg font-black text-white'>
              Customer Reviews & Ratings
            </h2>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Reviews List */}
            <div className='space-y-4 max-h-80 overflow-y-auto pr-2'>
              {reviews.length === 0 ? (
                <p className='text-xs text-slate-500 py-8 text-center font-medium'>
                  No reviews for this product yet. Be the first to review!
                </p>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className='p-4 bg-[#141d2f]/70 rounded-2xl border border-slate-800 space-y-1.5'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='font-bold text-xs text-slate-200'>
                        {rev.reviewer_name}
                      </span>
                      <div className='flex items-center text-amber-400'>
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={13} className='fill-amber-400' />
                        ))}
                      </div>
                    </div>
                    <p className='text-xs text-slate-400 leading-relaxed'>
                      {rev.comment}
                    </p>
                    <span className='text-[10px] text-slate-500 block'>
                      {new Date(rev.created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add Review Form */}
            <form
              onSubmit={handleAddReview}
              className='p-6 bg-[#141d2f]/60 rounded-2xl border border-slate-800 space-y-4'
            >
              <h3 className='font-bold text-sm text-white'>
                Write Your Review
              </h3>

              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Your Name *
                </label>
                <input
                  type='text'
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                  placeholder='e.g. John Doe'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Rating Stars *
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-amber-400 font-bold outline-none cursor-pointer'
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                  <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                  <option value={2}>⭐⭐ (2/5 Poor)</option>
                  <option value={1}>⭐ (1/5 Terrible)</option>
                </select>
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Your Comment *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                  placeholder='Share your experience with this product...'
                />
              </div>

              <button
                type='submit'
                disabled={submittingReview}
                className='w-full py-3.5 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition duration-300 cursor-pointer disabled:opacity-50'
              >
                {submittingReview ? 'Submitting Review...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
