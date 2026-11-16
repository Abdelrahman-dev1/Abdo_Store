'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Package,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Customer Checkout Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(items);
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const newQty = (item.quantity || 1) + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );

  // Real Checkout Handler connected to Supabase DB
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('Your shopping cart is empty.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: customerName || 'Guest User',
          customer_phone: customerPhone || 'N/A',
          customer_address: customerAddress || 'N/A',
          city: city || 'Main City',
          items: JSON.stringify(cartItems),
          total_amount: subtotal,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setLoading(false);
      setOrderSuccess(true);
      clearCart();
    } catch (err: any) {
      setLoading(false);
      alert('Error placing order: ' + err.message);
    }
  };

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

      {/* Store Navbar */}
      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between'>
          <Link
            href='/'
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

          <Link
            href='/'
            title='Continue Shopping'
            aria-label='Continue Shopping'
            className='inline-flex items-center justify-center gap-0 sm:gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 p-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm cursor-pointer shrink-0'
          >
            <ArrowLeft size={14} className='text-slate-400 shrink-0' />
            <span className='hidden sm:inline bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent tracking-wide'>
              Continue Shopping
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className='max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10'>
        {orderSuccess ? (
          /* Order Success Screen */
          <div className='bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl p-8 sm:p-14 text-center border border-slate-800 shadow-2xl max-w-xl mx-auto space-y-6'>
            <div className='w-20 h-20 bg-emerald-950/60 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/40 animate-bounce'>
              <CheckCircle2 size={40} />
            </div>
            <div className='space-y-2'>
              <h2 className='text-2xl sm:text-3xl font-black text-white'>
                Order Confirmed! 🎉
              </h2>
              <p className='text-xs sm:text-sm text-slate-400 font-medium leading-relaxed'>
                Thank you for your order. We have received your purchase details
                and our dispatch team will contact you shortly.
              </p>
            </div>
            <div className='pt-4'>
              <Link
                href='/'
                className='inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-950/50 transition cursor-pointer'
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart View */
          <div className='bg-[#0e1626]/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-slate-800 shadow-2xl max-w-md mx-auto space-y-5'>
            <div className='w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600'>
              <ShoppingBag size={32} />
            </div>
            <div>
              <h3 className='text-lg font-black text-white mb-1'>
                Your Shopping Cart is Empty
              </h3>
              <p className='text-xs text-slate-400'>
                Looks like you haven't added any products to your cart yet.
              </p>
            </div>
            <Link
              href='/'
              className='inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer'
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Active Cart & Checkout Grid */
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
            {/* Left: Shopping Cart Items List (Cols 7) */}

            {/* Left: Shopping Cart Items List (Cols 7) */}
            <div className='lg:col-span-7 space-y-4'>
              <div className='flex items-center justify-between border-b border-slate-800/80 pb-4'>
                <h2 className='text-base sm:text-lg font-black text-white flex items-center gap-2.5'>
                  <div className='p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400'>
                    <Package className='w-4 h-4' />
                  </div>
                  <span>Cart Items ({cartItems.length})</span>
                </h2>
                <button
                  onClick={clearCart}
                  className='text-xs font-bold px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer flex items-center gap-1.5'
                >
                  <Trash2 size={13} />
                  <span>Clear All</span>
                </button>
              </div>

              {/* 🟢 صندوق المنتجات مع سكرول داخلي وتصميم أنيق */}
              <div className='max-h-[390px] overflow-y-auto pr-2 space-y-4 custom-scrollbar'>
                {cartItems.map((item) => {
                  const itemImg =
                    item.image || item.images?.[0] || item.image_url;
                  const currentPrice = item.price || 0;
                  const oldPrice =
                    item.oldPrice || item.original_price || currentPrice + 200;
                  const itemDesc =
                    item.description ||
                    item.details ||
                    item.short_description ||
                    'High quality premium product';
                  const qty = item.quantity || 1;

                  return (
                    <div
                      key={item.id}
                      className='group relative bg-gradient-to-r from-[#141d2f]/90 via-[#0e1626] to-[#141d2f]/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:border-slate-700/80'
                    >
                      <div className='flex items-start sm:items-center gap-4 min-w-0 flex-1'>
                        {/* صورة المنتج مع استيكر Hot Deal */}
                        <div className='relative w-20 h-20 bg-slate-900 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-700/60 shadow-md'>
                          {itemImg ? (
                            <Image
                              src={itemImg}
                              alt={item.name || 'Store Item'}
                              width={600}
                              height={600}
                              className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
                            />
                          ) : (
                            <div className='flex items-center justify-center h-full text-[10px] text-slate-500'>
                              No Image
                            </div>
                          )}
                          <span className='absolute top-1 left-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md'>
                            Hot Deal
                          </span>
                        </div>

                        <div className='flex-1 space-y-1 min-w-0'>
                          <h3 className='font-black text-slate-100 text-xs sm:text-sm truncate tracking-tight'>
                            {item.name}
                          </h3>
                          <p className='text-[10px] text-slate-400 line-clamp-1'>
                            {itemDesc}
                          </p>

                          {/* الأسعار (الحالي + القديم مشطوب) */}
                          <div className='flex items-center gap-2 pt-1'>
                            <span className='text-xs font-black text-emerald-400'>
                              {currentPrice} EGP
                            </span>
                            {oldPrice > currentPrice && (
                              <span className='text-[10px] text-slate-500 line-through font-semibold'>
                                {oldPrice} EGP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* أزرار التحكم والأسعار الإجمالية */}
                      <div className='flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/60'>
                        {/* Quantity controls */}
                        <div className='flex items-center bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden p-0.5 shadow-inner'>
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className='w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs font-bold cursor-pointer'
                          >
                            <Minus size={13} />
                          </button>
                          <span className='w-8 text-center text-xs font-black text-white'>
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className='w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs font-bold cursor-pointer'
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* إجمالي سعر المنتج */}
                        <div className='text-right min-w-[70px]'>
                          <span className='text-xs sm:text-sm font-black text-white'>
                            {currentPrice * qty} EGP
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className='p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition cursor-pointer shadow-sm'
                          title='Remove item'
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Checkout & Order Summary (Cols 5) */}
            <div className='lg:col-span-5 bg-[#0e1626]/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl h-fit space-y-6 relative overflow-hidden'>
              <div className='absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none'></div>
              <div className='absolute -bottom-24 -left-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none'></div>

              <div className='border-b border-slate-800/80 pb-4 relative z-10'>
                <h2 className='text-base font-black text-white flex items-center gap-2.5'>
                  <div className='p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'>
                    <CreditCard className='w-4 h-4' />
                  </div>
                  <span>Order Summary & Checkout</span>
                </h2>
                <p className='text-xs text-slate-400 mt-1'>
                  Complete your order securely with Cash on Delivery
                </p>
              </div>

              {/* صندوق الانتقال لصفحة الـ Checkout الكاملة */}
              <Link
                href='/checkout'
                className='block bg-[#141d2f]/90 hover:bg-[#1a263f] border border-slate-700/80 hover:border-blue-500/50 p-4 rounded-2xl shadow-lg transition duration-300 cursor-pointer space-y-2 group relative z-10'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-200 group-hover:text-white transition leading-relaxed'>
                    Want to save your details & track orders?
                  </span>
                  <span className='bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg shrink-0 ml-2'>
                    Sign In &rarr;
                  </span>
                </div>
                <p className='text-[11px] text-slate-400'>
                  Click here to go to checkout and sign up with Google or Email.
                </p>
              </Link>

              {/* Order Calculations Box */}
              <div className='space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4 relative z-10'>
                <div className='flex justify-between items-center'>
                  <span className='text-slate-400'>Subtotal:</span>
                  <span className='font-bold text-white text-sm'>
                    {subtotal} EGP
                  </span>
                </div>

                <div className='flex items-center justify-between gap-1.5 sm:gap-2 min-w-0'>
                  <span className='text-[10px] sm:text-xs text-slate-400 font-medium shrink-0'>
                    Shipping Fee:
                  </span>
                  <span className='text-[8px] sm:text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1 py-[1px] sm:px-2 sm:py-0.5 rounded-[4px] sm:rounded-lg leading-none whitespace-nowrap'>
                    Calculated on Delivery
                  </span>
                </div>

                <div className='border-t border-slate-800/80 pt-3.5 flex justify-between items-center font-black text-base text-white'>
                  <span>Total Amount:</span>
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-blue-400 text-lg'>
                    {subtotal} EGP
                  </span>
                </div>
              </div>

              {/* زر الانتقال لصفحة الـ Checkout الرئيسية */}
              <Link
                href='/checkout'
                className='w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-red-950/50 transition duration-300 text-xs flex items-center justify-center gap-2 cursor-pointer relative z-10 group'
              >
                <span>Proceed to Checkout ({subtotal} EGP)</span>
                <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
              </Link>

              <div className='flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pt-1 relative z-10'>
                <ShieldCheck className='w-4 h-4 text-emerald-400' />
                <span>Secure Cash on Delivery & Fast Dispatch</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
