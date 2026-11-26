export default function SectionDivider() {
  return (
    <div
      aria-hidden='true'
      className='relative my-5 sm:my-7 flex items-center justify-center'
    >
      {/* توهج خلفي خفيف */}
      <div className='absolute h-[3px] w-3/4 rounded-full bg-gradient-to-r from-rose-500/30 via-purple-500/35 via-emerald-400/30 to-sky-400/30 blur-sm' />

      {/* الخط الأساسي */}
      <div className='h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-rose-500/80 via-purple-500/85 via-emerald-400/80 via-sky-400/80 to-transparent' />
    </div>
  );
}
