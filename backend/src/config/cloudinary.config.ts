import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Logger } from '@nestjs/common';

const logger = new Logger('CloudinaryConfig');

// Cloudinary konfigürasyonunu kontrol et ve log tut
const checkCloudinaryConfig = () => {
    logger.log('Checking Cloudinary Configuration...');

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (cloudinaryUrl) {
        logger.log('Using CLOUDINARY_URL for configuration');
        return true;
    } else if (cloudName && apiKey && apiSecret) {
        logger.log('Using individual credentials for Cloudinary configuration');
        return true;
    } else {
        logger.error('Missing Cloudinary credentials! Check your .env file');
        logger.error(`CLOUDINARY_CLOUD_NAME: ${cloudName ? 'Set' : 'Missing'}`);
        logger.error(`CLOUDINARY_API_KEY: ${apiKey ? 'Set' : 'Missing'}`);
        logger.error(`CLOUDINARY_API_SECRET: ${apiSecret ? 'Set' : 'Missing'}`);
        logger.error(`CLOUDINARY_URL: ${cloudinaryUrl ? 'Set' : 'Missing'}`);
        return false;
    }
};

// Cloudinary yapılandırması
export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    useFactory: () => {
        // Konfigürasyonu kontrol et
        checkCloudinaryConfig();

        try {
            // Eğer CLOUDINARY_URL varsa, doğrudan bu bağlantı kullanılır
            // Yoksa tek tek kimlik bilgileri kullanılır
            if (process.env.CLOUDINARY_URL) {
                logger.log('Configuring Cloudinary with URL');
                return cloudinary.config({
                    url: process.env.CLOUDINARY_URL
                });
            } else {
                logger.log('Configuring Cloudinary with individual credentials');
                return cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });
            }
        } catch (error) {
            logger.error(`Cloudinary configuration error: ${error.message}`);
            throw error;
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
