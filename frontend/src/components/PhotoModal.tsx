import React, { useState } from 'react';
import { Photo } from '../models/Photo';
import { photoService } from '../services/photoService';

interface PhotoModalProps {
    photo: Photo;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photo, isOpen, onClose, onDelete }) => {
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (!isOpen) return null;

    // Dosya türünü belirle
    const isVideo = (path: string): boolean => {
        if (!path) return false;

        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
        const lowercasePath = path.toLowerCase();

        return videoExtensions.some(ext => lowercasePath.endsWith(ext)) ||
            lowercasePath.includes('video');
    };

    const isVideoFile = isVideo(photo.photoPath);

    // Dosya indirme
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Video veya fotoğrafa bağlı olarak dosya adını belirle
        const fileName = photo.title || (isVideoFile ? 'video' : 'photo');
        const extension = isVideoFile ? '.mp4' : '.jpg';

        // Dosya indirme link'i oluştur
        const a = document.createElement('a');
        a.href = photo.photoPath;
        a.download = `${fileName}${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Silme işlemi
    const handleDelete = async () => {
        if (!photo._id) return;

        try {
            setIsDeleting(true);
            await photoService.deletePhoto(photo._id);

            // Silme başarılı olduğunda
            if (onDelete) {
                onDelete();
            }

            onClose();
        } catch (error) {
            console.error('Fotoğraf silinirken hata:', error);
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-6"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal başlık */}
                <div className="p-4 flex justify-between items-center border-b">
                    <h3 className="text-lg font-medium text-gray-800">
                        {photo.title || (isVideoFile ? 'Video' : 'Fotoğraf')}
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* İndirme butonu */}
                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                            title="İndir"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Kapat butonu */}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                            title="Kapat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Resim/Video içeriği */}
                <div className="bg-black flex items-center justify-center">
                    {isVideoFile ? (
                        <video
                            src={photo.photoPath}
                            controls
                            autoPlay
                            className="max-h-[60vh] max-w-full"
                            onLoadStart={() => setLoading(true)}
                            onLoadedData={() => setLoading(false)}
                            onError={() => setLoading(false)}
                        />
                    ) : (
                        <img
                            src={photo.photoPath}
                            alt={photo.title || 'Düğün fotoğrafı'}
                            className="max-h-[60vh] max-w-full object-contain"
                            onLoad={() => setLoading(false)}
                            onError={() => setLoading(false)}
                        />
                    )}

                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Fotoğraf detayları */}
                <div className="p-4">
                    {photo.name && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">Ekleyen:</span>
                            <span>{photo.name}</span>
                        </div>
                    )}

                    {/* Silme işlemi */}
                    {onDelete && (
                        <div className="mt-6 border-t pt-4">
                            {confirmDelete ? (
                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                    <p className="text-sm text-red-600 font-medium">Bu fotoğrafı silmek istediğinizden emin misiniz?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                            disabled={isDeleting}
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="px-4 py-2 bg-gray-100 text-red-600 rounded-md hover:bg-gray-200 w-full sm:w-auto"
                                >
                                    <span className="flex items-center justify-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                                        </svg>
                                        Bu fotoğrafı sil
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoModal; 