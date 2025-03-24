import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Cloudinary yapılandırması
export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    useFactory: () => {
        // Eğer CLOUDINARY_URL varsa, doğrudan bu bağlantı kullanılır
        // Yoksa tek tek kimlik bilgileri kullanılır
        if (process.env.CLOUDINARY_URL) {
            return cloudinary.config({
                url: process.env.CLOUDINARY_URL
            });
        } else {
            return cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });
        }
    },
};

// Fotoğraf ve video yüklemeleri için Cloudinary storage
export const photoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wedding_photos',
        allowedFormats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'webm'],
        resource_type: 'auto',
        transformation: [{ quality: 'auto' }],
    } as any,
});

// Video önizleme görüntüleri için ayrı bir yapılandırma
export const thumbnailStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wedding_thumbnails',
        format: 'jpg',
        resource_type: 'image',
    } as any,
});
