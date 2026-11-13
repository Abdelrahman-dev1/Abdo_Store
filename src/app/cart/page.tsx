'use client';

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
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Package,
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
        const newQty = item.quantity + delta;
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
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Real Checkout Handler connected to Supabase DB
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('Your shopping cart is empty.');
      return;
    }

    if (!customerName || !customerPhone || !customerAddress) {
      alert('Please fill in all required shipping details.');
      return;
    }

    setLoading(true);

    try {
      // 🚀 Save Order to Supabase Database
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          city: city || 'Main City',
          items: JSON.stringify(cartItems),
          total_amount: subtotal,
          status: 'pending', // Starts pending so Admin Dashboard counts it live!
        },
      ]);

      if (error) {
        throw error;
      }

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

          <Link
            href='/'
            className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
          >
            <div className='flex items-center gap-1.5 cursor-pointer'>
              <ArrowLeft size={12} className='text-slate-400' />
              <span className='text-[7px] xs:text-[7px] sm:text-[9px] md:text-[10px] font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
                Continue Shopping
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className='max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10'>
        {/* Order Success Screen */}
        {orderSuccess ? (
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
                className='inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-950/50 transition'
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
              className='inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg transition'
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Active Cart & Checkout Grid */
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
            {/* Left: Shopping Cart Items List (Cols 7) */}
            <div className='lg:col-span-7 space-y-4'>
              <div className='flex items-center justify-between border-b border-slate-800 pb-4'>
                <h2 className='text-lg font-black text-white flex items-center gap-2'>
                  <Package className='w-5 h-5 text-blue-400' />
                  <span>Cart Items ({cartItems.length})</span>
                </h2>
                <button
                  onClick={clearCart}
                  className='text-xs text-red-400 hover:text-red-300 font-bold transition cursor-pointer'
                >
                  Clear Cart
                </button>
              </div>

              {cartItems.map((item) => {
                const itemImg = item.image || item.images?.[0];

                return (
                  <div
                    key={item.id}
                    className='bg-[#0e1626]/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-xl flex items-center gap-4 transition hover:border-slate-700'
                  >
                    <div className='w-20 h-20 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700 shadow-sm'>
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='flex items-center justify-center h-full text-[10px] text-slate-500'>
                          No Image
                        </div>
                      )}
                    </div>

                    <div className='flex-1 space-y-1'>
                      <h3 className='font-bold text-slate-100 text-sm'>
                        {item.name}
                      </h3>
                      <p className='text-xs font-black text-blue-400'>
                        {item.price} EGP
                      </p>

                      <div className='flex items-center gap-3 pt-2'>
                        {/* Quantity controls */}
                        <div className='flex items-center bg-[#141d2f] border border-slate-700/80 rounded-xl overflow-hidden'>
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className='p-1.5 hover:bg-slate-800 text-slate-300 transition cursor-pointer'
                          >
                            <Minus size={13} />
                          </button>
                          <span className='px-3 text-xs font-bold text-white'>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className='p-1.5 hover:bg-slate-800 text-slate-300 transition cursor-pointer'
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className='p-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-500/30 transition cursor-pointer'
                          title='Remove item'
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className='font-black text-sm text-white bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 flex-shrink-0'>
                      {item.price * item.quantity} EGP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Checkout & Shipping Details Form (Cols 5) */}
            <div className='lg:col-span-5 bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl h-fit space-y-6'>
              <div className='border-b border-slate-800 pb-4'>
                <h2 className='text-base font-black text-white flex items-center gap-2'>
                  <CreditCard className='w-5 h-5 text-emerald-400' />
                  <span>Order & Shipping Details</span>
                </h2>
                <p className='text-xs text-slate-400 mt-1'>
                  Complete your order with cash on delivery
                </p>
              </div>

              {/* زر/صندوق الانتقال لصفحة الـ Checkout */}
              <Link
                href='/checkout'
                className='block bg-[#141d2f]/90 hover:bg-[#1a263f] border border-slate-700/80 hover:border-blue-500/50 p-4 rounded-2xl shadow-lg transition duration-300 cursor-pointer space-y-2 group'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-200 group-hover:text-white transition leading-relaxed'>
                    Would you like to save your details and create an account to
                    track orders?
                  </span>
                  <span className='bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg shrink-0 ml-2'>
                    Sign In &rarr;
                  </span>
                </div>
                <p className='text-[11px] text-slate-400'>
                  Click here to go to checkout and sign up with Google or Email.
                </p>
              </Link>

              <form onSubmit={handleCheckout} className='space-y-4'>
                {/* Full Name */}
                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    Full Name *
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                      placeholder='e.g. Ahmed Mohamed'
                    />
                    <User className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    Phone Number *
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                      placeholder='01012345678'
                      dir='ltr'
                    />
                    <Phone className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    City
                  </label>
                  <input
                    type='text'
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='e.g. Cairo / Alexandria'
                  />
                </div>

                {/* Detailed Address */}
                <div>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                    Detailed Address *
                  </label>
                  <div className='relative'>
                    <textarea
                      rows={2}
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                      placeholder='Street name, building number, apartment...'
                    />
                    <MapPin className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                  </div>
                </div>

                {/* Order Summary Box */}
                <div className='bg-[#141d2f]/70 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs'>
                  <div className='flex justify-between text-slate-400'>
                    <span>Subtotal:</span>
                    <span className='font-bold text-white'>{subtotal} EGP</span>
                  </div>
                  <div className='flex justify-between text-slate-400'>
                    <span>Shipping:</span>
                    <span className='text-emerald-400 font-bold'>
                      Calculated on Delivery
                    </span>
                  </div>
                  <div className='border-t border-slate-800 pt-2 flex justify-between font-black text-sm text-white'>
                    <span>Total Amount:</span>
                    <span>{subtotal} EGP</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 transition duration-300 disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer'
                >
                  {loading ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin text-white' />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <span>Confirm & Place Order ({subtotal} EGP)</span>
                  )}
                </button>
              </form>

              <div className='flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium'>
                <ShieldCheck className='w-4 h-4 text-emerald-400' />
                <span>Cash on delivery guaranteed & secure</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
