import { NextResponse } from 'next/server';



import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    // استخراج الـ public_id من رابط Cloudinary بشكل صحيح
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex !== -1) {
      const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
      const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

      // حذف الملف الفعلي من سيرفرات كلاوديناري
      await cloudinary.uploader.destroy(publicId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting image from Cloudinary:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
