import api from './api';
import { Photo } from '../models/Photo';

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
        return response.data;
    },

    // Bir albümdeki tüm fotoğrafları getir
    getPhotosByAlbumId: async (albumId: string): Promise<Photo[]> => {
        const response = await api.get(`/albums/${albumId}/photos`);
        return response.data;
    },

    // Tek bir fotoğrafı getir
    getPhotoById: async (photoId: string): Promise<Photo> => {
        const response = await api.get(`/photos/${photoId}`);
        return response.data;
    },

    // Fotoğrafı sil
    deletePhoto: async (photoId: string): Promise<void> => {
        await api.delete(`/photos/${photoId}`);
    }
}; 