import React, { useRef, useState } from 'react';
import { Photo } from '../models/Photo';
import { TrashIcon } from '@heroicons/react/24/outline';
import { photoService } from '../services/photoService';

interface PhotoGridProps {
  photos: Photo[];
  albumId: string;
  onPhotoClick: (photo: Photo) => void;
  onPhotosUpdated: (updatedPhotos: Photo[]) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  albumId,
  onPhotoClick,
  onPhotosUpdated
}) => {
  const [confirmingPhotoId, setConfirmingPhotoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const photosContainerRef = useRef<HTMLDivElement>(null);

  const scrollPhotos = (direction: 'left' | 'right') => {
    if (!photosContainerRef.current) return;

    const scrollAmount = 320; // Bir kart genişliği + margin
    const currentScroll = photosContainerRef.current.scrollLeft;

    photosContainerRef.current.scrollTo({
      left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    setConfirmingPhotoId(photoId);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingPhotoId(null);
  };

  const confirmDelete = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (!photoId) return;

    try {
      setIsDeleting(true);
      await photoService.deletePhoto(photoId);

      // Silme başarılı olduğunda fotoğrafları güncelle
      if (albumId) {
        const updatedPhotos = await photoService.getPhotosByAlbumId(albumId);
        onPhotosUpdated(updatedPhotos);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(false);
      setConfirmingPhotoId(null);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="text-5xl mb-4">📷</div>
        <p className="text-gray-600 text-lg font-light">
          Henüz fotoğraf yok.
        </p>
        <p className="text-gray-500 mt-2">
          İlk fotoğrafı yükleyen siz olun!
        </p>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto">
      <div className="overflow-x-auto pb-6 hide-scrollbar" ref={photosContainerRef}>
        <div className="flex gap-5 px-2 snap-x snap-mandatory">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-1 transition-all duration-300 hover:shadow-lg relative flex-shrink-0 w-64 snap-start h-full border border-gray-100"
            >
              <div className="cursor-pointer" onClick={() => onPhotoClick(photo)}>
                {photo.isVideo ? (
                  <div className="relative w-full h-44 bg-gray-50 overflow-hidden">
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white rounded-full w-12 h-12 flex items-center justify-center">
                          <span className="text-xl ml-1">▶</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-0"></div>
                    <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-medium px-2 py-1 rounded-full z-10">
                      Video
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-44 overflow-hidden">
                    <img
                      src={photo.imagePath}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}
              </div>

              {confirmingPhotoId === photo._id ? (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md z-20">
                  <span className="text-xs text-gray-800">Emin misiniz?</span>
                  <button
                    onClick={(e) => confirmDelete(e, photo._id || '')}
                    disabled={isDeleting}
                    className="text-red-500 text-xs font-bold hover:text-red-700"
                  >
                    {isDeleting ? '...' : 'Evet'}
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={cancelDelete}
                    className="text-gray-600 text-xs font-bold hover:text-gray-800"
                  >
                    Hayır
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => handleDeleteClick(e, photo._id || '')}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-white hover:text-red-600 transition-all duration-200 z-10"
                  aria-label="Fotoğrafı sil"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}

              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-800 truncate">
                  {photo.title}
                </h3>
                <p className="text-gray-500 text-xs mt-1 flex items-center">
                  <span className="text-[10px] mr-1">👤</span>
                  {photo.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows with improved styling */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
        <button
          className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-md flex items-center justify-center border border-gray-100 hover:scale-110 transition-transform duration-200"
          onClick={() => scrollPhotos('left')}
          aria-label="Önceki fotoğraflar"
        >
          ❮
        </button>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block">
        <button
          className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-md flex items-center justify-center border border-gray-100 hover:scale-110 transition-transform duration-200"
          onClick={() => scrollPhotos('right')}
          aria-label="Sonraki fotoğraflar"
        >
          ❯
        </button>
      </div>
    </div>
  );
};

export default PhotoGrid; 