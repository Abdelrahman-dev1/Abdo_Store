import Link from 'next/link';

export default function NotFound() {
  return (
    <main className='min-h-screen flex flex-col items-center justify-center bg-[#07090e] text-slate-100 px-4 text-center'>
      <div className='space-y-6 max-w-md'>
        {/* رقم الخطأ بتصميم بارز */}
        <h1 className='text-7xl sm:text-8xl font-extrabold bg-gradient-to-r from-rose-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent'>
          404
        </h1>

        {/* عنوان رئيسي */}
        <h2 className='text-2xl sm:text-3xl font-bold text-slate-100'>
          الصفحة غير موجودة ❤️
        </h2>

        {/* وصف توضيحي */}
        <p className='text-slate-400 text-sm sm:text-base leading-relaxed'>
          عذراً، يبدو أن الرابط الذي تبحث عنه غير موجود، أو تم نقله، أو أنك كتبت
          العنوان بشكل خاطئ.
        </p>

        {/* زر العودة للرئيسية */}
        <div className='pt-2'>
          <Link
            href='/'
            className='inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500 text-white font-bold shadow-xl transition-all duration-500 hover:scale-105'
          >
            العودة إلى الرئيسية ⚡
          </Link>
        </div>
      </div>
    </main>
  );
}
