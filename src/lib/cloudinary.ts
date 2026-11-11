// دالة لتوليد رابط صورة محسّن تلقائياً من Cloudinary
export function getOptimizedImageUrl(publicIdOrUrl: string, width = 600) {
  if (!publicIdOrUrl) return '/placeholder.png';

  // لو الرابط كامل من كلاوديناري، بنعدله أو نتركه، ولو Public ID بنبني الرابط
  if (publicIdOrUrl.startsWith('http')) {
    // إدراج تحسينات f_auto,q_auto في الرابط مباشرة
    return publicIdOrUrl.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},f_auto,q_auto/${publicIdOrUrl}`;
}
