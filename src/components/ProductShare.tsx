import { createClient } from '@supabase/supabase-js';
import ShareButton from './ShareButton';

// 1. الاتصال بـ Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. دالة جلب بيانات المنتج من قاعدة البيانات
async function getProduct(id: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

// 3. دالة السوشيال ميديا (تولد الميتا داتا والصورة من كلاودناري تلقائي)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const product = await getProduct(id);
  const fallbackImage = 'https://abdo-store.vercel.app/we3.jpg';

  const productName = product?.name || 'عرض مميز';
  const productPrice = product?.price ? `${product.price} EGP` : '';

  const title = `🔥 ${productName} - ${productPrice} | Abdo Store`;
  const description = `اطلبه دلوقتي من Abdo Store بأفضل جودة وأقل سعر مع خدمة التوصيل السريع!`;
  const imageUrl = product?.image || fallbackImage; // رابط Cloudinary القادم من Supabase

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `https://abdo-store.vercel.app/product/${id}`,
      siteName: 'Abdo Store',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: productName }],
      locale: 'ar_EG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

// 4. صفحة عرض المنتج الأساسية (Server Component)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const product = await getProduct(id);

  if (!product) {
    return <div className='min-h-screen bg-[#0a0f1d] text-white p-6 flex items-center justify-center'>المنتج غير موجود</div>;
  }

  return (
    <div className='min-h-screen bg-[#0a0f1d] text-white p-6 flex flex-col items-center justify-center'>
      <div className='max-w-xl w-full bg-slate-900/60 p-6 rounded-2xl border border-blue-500/30 shadow-xl'>

        {/* اسم المنتج */}
        <h1 className='text-3xl font-black bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent mb-2'>
          {product.name}
        </h1>

        {/* السعر */}
        <p className='text-xl text-slate-300 font-bold mb-4'>
          {product.price} EGP
        </p>

        {/* صورة المنتج القادمة من Cloudinary ومحفوظة في Supabase */}
        {product.image && (
          <div className='w-full h-64 rounded-xl overflow-hidden border border-blue-500/20 mb-6'>
            <img src={product.image} alt={product.name} className='w-full h-full object-cover' />
          </div>
        )}

        {/* زرار المشاركة الجاهز */}
        <div className='flex justify-end'>
          <ShareButton productId={product.id} productName={product.name} />
        </div>

      </div>
    </div>
  );
}
