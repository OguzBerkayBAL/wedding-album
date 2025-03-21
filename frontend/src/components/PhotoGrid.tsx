import React, { useState } from 'react';
import { Photo } from '../models/Photo';
import PhotoModal from './PhotoModal';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoDeleted?: () => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoDeleted }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  // Fotoğrafı seç ve modalı aç
  const openPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  // Yükleme hatası olan görselleri işaretle
  const handleImageError = (photoId: string | undefined) => {
    if (!photoId) return;
    console.error(`Fotoğraf yükleme hatası: ${photoId}`);
    setErrorImages(prev => new Set(prev).add(photoId));
  };

  // Dosya türünü belirle
  const isVideo = (path: string): boolean => {
    if (!path) return false;

    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const lowercasePath = path.toLowerCase();

    return videoExtensions.some(ext => lowercasePath.endsWith(ext)) ||
      lowercasePath.includes('video');
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Henüz fotoğraf eklenmemiş.</p>
      </div>
    );
  }

  // Hatasız fotoğrafları filtrele
  const validPhotos = photos.filter(photo => !photo._id || !errorImages.has(photo._id));

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {validPhotos.map((photo) => {
          const isVideoFile = isVideo(photo.photoPath);
          return (
            <div
              key={photo._id || `photo-${Math.random()}`}
              className="relative overflow-hidden rounded-lg shadow-sm group hover:shadow-md transition-all cursor-pointer aspect-[3/4]"
              onClick={() => openPhoto(photo)}
            >
              {isVideoFile ? (
                <video
                  className="w-full h-full object-cover"
                  src={photo.photoPath}
                  onError={() => handleImageError(photo._id)}
                />
              ) : (
                <img
                  className="w-full h-full object-cover"
                  src={photo.photoPath}
                  alt={photo.title || 'Düğün fotoğrafı'}
                  onError={() => handleImageError(photo._id)}
                  loading="lazy"
                />
              )}

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>

              {/* Fotoğraf bilgileri */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                {photo.title && (
                  <p className="font-medium text-sm truncate">{photo.title}</p>
                )}
                {photo.name && (
                  <p className="text-xs opacity-80 truncate">Ekleyen: {photo.name}</p>
                )}
                {isVideoFile && (
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-sm">
                    Video
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resim sayısı göster */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Toplam {validPhotos.length} fotoğraf/video
      </div>

      {/* Foto Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={onPhotoDeleted}
        />
      )}
    </div>
  );
};

export default PhotoGrid; 