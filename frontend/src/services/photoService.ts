import api from './api';
import { Photo } from '../models/Photo';

// Backend URL - API bağlantısı için kullanılacak URL
const BACKEND_URL = 'https://wedding-album-dfzw.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

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
            if (photo.photoPath && photo.photoPath.includes('localhost')) {
                const newPath = photo.photoPath.replace('http://localhost:3001', BACKEND_URL);
                console.log('Upload path düzeltildi:', newPath);
                photo.photoPath = newPath;
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
        try {
            console.log(`Albüm fotoğrafları alınıyor, Albüm ID: ${albumId}`);

            // ÖNEMLİ: Backend API'de doğru endpoint formatını belirlemek için öncelikle
            // eski formatta çalışan endpoint ile deneyelim (hata loglarında eski formatın çalıştığı görülüyor)
            try {
                // İlk olarak eski endpoint formatını deneyelim
                console.log('Eski endpoint deneniyor:', `/albums/${albumId}/photos`);
                const response = await api.get(`/albums/${albumId}/photos`);
                console.log('Eski endpoint başarılı:', response.data);

                // Gelen fotoğrafların path'lerini düzelt
                return response.data.map((photo: Photo) => {
                    console.log('Fotoğraf işleniyor. Orijinal path:', photo.photoPath);

                    if (photo.photoPath && photo.photoPath.includes('localhost')) {
                        const newPath = photo.photoPath.replace('http://localhost:3001', BACKEND_URL);
                        console.log('Path düzeltildi:', newPath);
                        photo.photoPath = newPath;
                    }

                    return photo;
                });
            } catch (oldEndpointError: any) {
                console.warn('Eski endpoint başarısız, yeni format deneniyor:', oldEndpointError.message);

                // Eğer eski format başarısız olursa, yeni endpoint formatta deneyelim
                console.log('Yeni endpoint deneniyor:', `/photos/album/${albumId}`);
                const response = await api.get(`/photos/album/${albumId}`);
                console.log('Yeni endpoint başarılı:', response.data);

                // Gelen fotoğrafların path'lerini düzelt
                return response.data.map((photo: Photo) => {
                    console.log('Fotoğraf işleniyor. Orijinal path:', photo.photoPath);

                    if (photo.photoPath && photo.photoPath.includes('localhost')) {
                        const newPath = photo.photoPath.replace('http://localhost:3001', BACKEND_URL);
                        console.log('Path düzeltildi:', newPath);
                        photo.photoPath = newPath;
                    }

                    return photo;
                });
            }
        } catch (error: any) {
            console.error('Albüm fotoğraflarını getirme hatası:', error);

            // Hata detaylarını logla
            if (error.response) {
                console.error('API Yanıt Hatası:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers,
                    endpoint: `/albums/${albumId}/photos ve /photos/album/${albumId}`
                });
            }

            // Hata durumunda boş dizi döndür (UI'ın çökmemesi için)
            console.log('Albüm fotoğrafları getirilemedi, boş dizi döndürülüyor');
            return [];
        }
    },

    // Tek bir fotoğrafı getir
    getPhotoById: async (photoId: string): Promise<Photo> => {
        try {
            console.log(`Fotoğraf alınıyor, ID: ${photoId}`);
            const response = await api.get(`/photos/${photoId}`);
            const photo = response.data;

            // Path'i düzelt
            console.log('Fotoğraf detayı işleniyor. Orijinal path:', photo.photoPath);
            if (photo.photoPath && photo.photoPath.includes('localhost')) {
                const newPath = photo.photoPath.replace('http://localhost:3001', BACKEND_URL);
                console.log('Path düzeltildi:', newPath);
                photo.photoPath = newPath;
            }

            return photo;
        } catch (error: any) {
            console.error(`Fotoğraf getirme hatası (ID: ${photoId}):`, error);
            if (error.response) {
                console.error('API Yanıt Hatası:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            }
            throw new Error('Fotoğraf yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    },

    // Fotoğrafı sil
    deletePhoto: async (photoId: string): Promise<void> => {
        try {
            await api.delete(`/photos/${photoId}`);
        } catch (error: any) {
            console.error(`Fotoğraf silme hatası (ID: ${photoId}):`, error);
            throw new Error('Fotoğraf silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }
};

export { photoService };