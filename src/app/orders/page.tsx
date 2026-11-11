'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Package,
  ShoppingCart,
  ArrowLeft,
  ShoppingBag,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    checkUserAndFetchOrders();
    updateCartCount();
  }, []);

  const updateCartCount = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = existingCart.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );
    setCartCount(totalItems);
  };

  const checkUserAndFetchOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <p className='text-xs font-medium'>Loading your orders...</p>
      </div>
    );
  }

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

      {/* Main Content Area */}
      <main className='max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10'>
        <div className='mb-8'>
          <h1 className='text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3'>
            <Package className='w-7 h-7 text-blue-400' />
            <span>My Previous Orders</span>
          </h1>
          <p className='text-xs text-slate-400 mt-1'>
            Track your order statuses and purchase history
          </p>
        </div>

        {!user ? (
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-10 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4'>
            <p className='text-slate-300 text-xs font-medium'>
              You must be logged in to track and view your orders.
            </p>
            <Link
              href='/'
              className='inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg transition'
            >
              Return to Home
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-14 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4'>
            <Package className='w-14 h-14 mx-auto text-slate-600 mb-2' />
            <p className='text-slate-300 text-sm font-bold'>
              No orders recorded yet
            </p>
            <p className='text-xs text-slate-500'>
              You haven't placed any orders with this account.
            </p>
            <div className='pt-2'>
              <Link
                href='/'
                className='inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950/50 transition'
              >
                Start Shopping Now
              </Link>
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            {orders.map((order) => {
              let orderItems = [];
              try {
                orderItems =
                  typeof order.items === 'string'
                    ? JSON.parse(order.items)
                    : order.items || [];
              } catch (e) {
                orderItems = [];
              }

              return (
                <div
                  key={order.id}
                  className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 transition hover:border-slate-700'
                >
                  {/* Order Top Header */}
                  <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5'>
                    <div className='space-y-2'>
                      <div className='flex flex-wrap items-center gap-3'>
                        <span className='font-black text-xs text-slate-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700'>
                          ORDER #{order.id.slice(0, 8).toUpperCase()}
                        </span>

                        <span
                          className={`text-xs px-3 py-1 rounded-xl font-bold border ${
                            order.status === 'pending'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                              : order.status === 'shipping'
                                ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                                : order.status === 'delivered'
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                  : 'bg-red-950/40 text-red-300 border-red-500/40'
                          }`}
                        >
                          {order.status === 'pending'
                            ? '⏳ Pending Review'
                            : order.status === 'shipping'
                              ? '🚚 Shipping'
                              : order.status === 'delivered'
                                ? '✅ Delivered'
                                : '❌ Cancelled'}
                        </span>
                      </div>

                      <p className='text-xs text-slate-400 flex items-center gap-1.5 pt-1'>
                        <MapPin
                          size={14}
                          className='text-red-400 flex-shrink-0'
                        />
                        <span>
                          Address: {order.city ? `${order.city} - ` : ''}
                          {order.customer_address || 'N/A'}
                        </span>
                      </p>

                      <p className='text-[11px] text-slate-500 flex items-center gap-1.5'>
                        <Clock size={13} className='text-blue-400' />
                        <span>
                          Ordered on:{' '}
                          {new Date(order.created_at).toLocaleString('en-US')}
                        </span>
                      </p>
                    </div>

                    <div className='text-left bg-[#141d2f] p-4 rounded-2xl border border-slate-800 w-full sm:w-auto min-w-[180px]'>
                      <span className='text-[11px] text-slate-400 block uppercase font-semibold'>
                        Total Amount
                      </span>
                      <span className='font-black text-lg text-white'>
                        {order.total_amount}{' '}
                        <span className='text-xs text-slate-400 font-normal'>
                          EGP
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  {orderItems.length > 0 && (
                    <div className='space-y-3'>
                      <h4 className='text-xs font-bold text-slate-300 uppercase tracking-wider'>
                        Ordered Products ({orderItems.length}):
                      </h4>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        {orderItems.map((item: any, idx: number) => {
                          const itemImg =
                            item.image ||
                            item.images?.[0] ||
                            'https://via.placeholder.com/80';
                          return (
                            <div
                              key={idx}
                              className='flex items-center gap-3.5 bg-[#141d2f]/70 p-3 rounded-2xl border border-slate-800'
                            >
                              <img
                                src={itemImg}
                                alt={item.name || 'Product'}
                                className='w-12 h-12 object-cover rounded-xl border border-slate-700 shrink-0 bg-slate-900'
                              />
                              <div className='flex-1 min-w-0'>
                                <h5 className='font-bold text-xs text-slate-200 truncate mb-0.5'>
                                  {item.name}
                                </h5>
                                <p className='text-[11px] text-slate-400'>
                                  Qty:{' '}
                                  <strong className='text-white'>
                                    {item.quantity}
                                  </strong>{' '}
                                  × {item.price} EGP
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
