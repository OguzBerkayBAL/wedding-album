import { api } from './api';
import { Photo } from '../models/Photo';

// Backend URL
const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://wedding-album-backend.onrender.com';

const photoService = {
    // Albüme fotoğraf yükle
    uploadPhoto: async (formData: FormData, onProgress?: (progress: number) => void): Promise<any> => {
        try {
            // Kontrolü geliştirmek için formData içeriğini logla
            console.log('FormData içeriği:');
            console.log('albumId:', formData.get('albumId'));
            console.log('name:', formData.get('name'));
            console.log('title:', formData.get('title'));
            console.log('file name:', formData.get('photo') instanceof File ? (formData.get('photo') as File).name : 'dosya yok');

            const response = await api.post('/photos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                },
            });

            console.log('Upload yanıtı:', response.data);

            // Gelen fotoğraf bilgisini işle
            let photo = response.data;

            // Eğer localhost referans eden bir path varsa, düzelt
            if (photo.photoPath && photo.photoPath.startsWith('http://localhost')) {
                photo.photoPath = photo.photoPath.replace('http://localhost:3001', BACKEND_URL);
            }

            return photo;
        } catch (error: any) {
            console.error('Fotoğraf yükleme hatası:', error);

            // Daha detaylı hata mesajı için
            if (error.response) {
                // Sunucudan dönen yanıt (hata kodu, veri, başlıklar)
                console.error('Sunucu hatası:', error.response.status, error.response.data);
                throw new Error(`Sunucu hatası: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                // İstek yapıldı ama yanıt alınamadı
                console.error('Yanıt alınamadı:', error.request);
                throw new Error('Sunucudan yanıt alınamadı. İnternet bağlantınızı kontrol edin.');
            } else {
                // İstek oluşturulurken bir hata oluştu
                console.error('İstek hatası:', error.message);
                throw new Error(`İstek hatası: ${error.message}`);
            }
        }
    },

    // Bir albümdeki tüm fotoğrafları getir
    getPhotosByAlbumId: async (albumId: string): Promise<Photo[]> => {
        const response = await api.get(`/photos/album/${albumId}`);

        // Gelen fotoğrafların path'lerini düzelt
        return response.data.map((photo: Photo) => {
            if (photo.photoPath && photo.photoPath.startsWith('http://localhost')) {
                photo.photoPath = photo.photoPath.replace('http://localhost:3001', BACKEND_URL);
            }
            return photo;
        });
    },

    // Tek bir fotoğrafı getir
    getPhotoById: async (photoId: string): Promise<Photo> => {
        const response = await api.get(`/photos/${photoId}`);
        const photo = response.data;

        // Path'i düzelt
        if (photo.photoPath && photo.photoPath.startsWith('http://localhost')) {
            photo.photoPath = photo.photoPath.replace('http://localhost:3001', BACKEND_URL);
        }

        return photo;
    },

    // Fotoğrafı sil
    deletePhoto: async (photoId: string): Promise<void> => {
        await api.delete(`/photos/${photoId}`);
    }
};

export { photoService }; 