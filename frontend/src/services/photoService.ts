import api from './api';
import { Photo } from '../models/Photo';

// Backend URL
const BACKEND_URL = 'https://wedding-album-dfzw.onrender.com';

export const photoService = {
    // Albüme fotoğraf yükle
    uploadPhoto: async (formData: FormData, progressCallback?: (progress: number) => void): Promise<Photo> => {
        const albumId = formData.get('albumId') as string;
        if (!albumId) {
            throw new Error('Album ID is required');
        }

        const response = await api.post(`/albums/${albumId}/photos`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressCallback && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    progressCallback(percentCompleted);
                }
            }
        });

        // Gelen veride, görüntü yollarını düzeltme
        if (response.data) {
            // Eğer localhost bağlantısı varsa, gerçek backend URL'i ile değiştir
            if (response.data.imagePath && response.data.imagePath.includes('localhost')) {
                response.data.imagePath = response.data.imagePath.replace('http://localhost:3001', BACKEND_URL);
            }
            if (response.data.thumbnailPath && response.data.thumbnailPath.includes('localhost')) {
                response.data.thumbnailPath = response.data.thumbnailPath.replace('http://localhost:3001', BACKEND_URL);
            }
        }

        return response.data;
    },

    // Bir albümdeki tüm fotoğrafları getir
    getPhotosByAlbumId: async (albumId: string): Promise<Photo[]> => {
        const response = await api.get(`/albums/${albumId}/photos`);

        // Gelen her fotoğrafın URL'lerini düzeltme
        if (response.data && Array.isArray(response.data)) {
            response.data.forEach(photo => {
                if (photo.imagePath && photo.imagePath.includes('localhost')) {
                    photo.imagePath = photo.imagePath.replace('http://localhost:3001', BACKEND_URL);
                }
                if (photo.thumbnailPath && photo.thumbnailPath.includes('localhost')) {
                    photo.thumbnailPath = photo.thumbnailPath.replace('http://localhost:3001', BACKEND_URL);
                }
            });
        }

        return response.data;
    },

    // Tek bir fotoğrafı getir
    getPhotoById: async (photoId: string): Promise<Photo> => {
        const response = await api.get(`/photos/${photoId}`);

        // Fotoğraf URL'lerini düzelt
        if (response.data) {
            if (response.data.imagePath && response.data.imagePath.includes('localhost')) {
                response.data.imagePath = response.data.imagePath.replace('http://localhost:3001', BACKEND_URL);
            }
            if (response.data.thumbnailPath && response.data.thumbnailPath.includes('localhost')) {
                response.data.thumbnailPath = response.data.thumbnailPath.replace('http://localhost:3001', BACKEND_URL);
            }
        }

        return response.data;
    },

    // Fotoğrafı sil
    deletePhoto: async (photoId: string): Promise<void> => {
        await api.delete(`/photos/${photoId}`);
    }
}; 