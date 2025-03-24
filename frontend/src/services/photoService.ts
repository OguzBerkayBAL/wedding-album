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
            const album = formData.get('album');
            console.log('album:', album);
            console.log('name:', formData.get('name'));
            console.log('title:', formData.get('title'));
            console.log('file name:', formData.get('photo') instanceof File ? (formData.get('photo') as File).name : 'dosya yok');

            if (!album) {
                throw new Error('Album ID gereklidir');
            }

            // Doğru endpoint'i kullan: /albums/:albumId/photos
            const response = await api.post(`/albums/${album}/photos`, formData, {
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
            return response.data;
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

            try {
                console.log('Endpoint çağrılıyor:', `/albums/${albumId}/photos`);
                const response = await api.get(`/albums/${albumId}/photos`);
                console.log('Endpoint başarılı:', response.data);
                return response.data;
            } catch (error) {
                console.error('İlk endpoint denemesi başarısız:', error);

                // Alternatif endpoint dene
                console.log('Alternatif endpoint deneniyor:', `/photos/album/${albumId}`);
                const response = await api.get(`/photos/album/${albumId}`);
                console.log('Alternatif endpoint başarılı:', response.data);
                return response.data;
            }
        } catch (error: any) {
            console.error(`Albüm fotoğrafları alınırken hata (ID: ${albumId}):`, error);
            if (error.response) {
                console.error('API Yanıt Hatası:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
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
            return response.data;
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