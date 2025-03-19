import api from './api';
import { Album } from '../models/Album';

export const albumService = {
    // Albüm oluştur
    createAlbum: async (albumData: Partial<Album>): Promise<Album> => {
        const response = await api.post('/albums', albumData);
        return response.data;
    },

    // Tüm albümleri getir
    getAllAlbums: async (): Promise<Album[]> => {
        const response = await api.get('/albums');
        return response.data;
    },

    // ID'ye göre albüm getir
    getAlbumById: async (albumId: string): Promise<Album> => {
        const response = await api.get(`/albums/${albumId}`);
        return response.data;
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