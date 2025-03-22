import api from './api';
import { Album } from '../models/Album';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://wedding-album-dfzw.onrender.com';

const albumService = {
    // Albüm oluştur
    createAlbum: async (albumData: Partial<Album>): Promise<Album> => {
        const response = await api.post('/albums', albumData);
        return response.data;
    },

    // Tüm albümleri getir
    getAllAlbums: async (): Promise<Album[]> => {
        try {
            console.log('Tüm albümler alınıyor...');
            const response = await api.get('/albums');
            console.log('Albümler alındı:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Tüm albümleri getirme hatası:', error);
            if (error.response) {
                console.error('API Yanıt Hatası:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            }
            throw new Error('Albümler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    },

    // ID'ye göre albüm getir
    getAlbumById: async (albumId: string): Promise<Album> => {
        try {
            console.log(`Albüm alınıyor, ID: ${albumId}`);
            const response = await api.get(`/albums/${albumId}`);
            console.log('Albüm alındı:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Albüm getirme hatası (ID: ${albumId}):`, error);
            if (error.response) {
                console.error('API Yanıt Hatası:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });

                if (error.response.status === 404) {
                    throw new Error('Albüm bulunamadı. Lütfen geçerli bir albüm seçin.');
                }
            }
            throw new Error('Albüm bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    },

    // Albüm güncelle
    updateAlbum: async (albumId: string, albumData: Partial<Album>): Promise<Album> => {
        const response = await api.put(`/albums/${albumId}`, albumData);
        return response.data;
    },

    // Albüm sil
    deleteAlbum: async (albumId: string): Promise<void> => {
        await api.delete(`/albums/${albumId}`);
    }
};

export { albumService }; 