import React, { useState } from 'react';
import { Photo } from '../models/Photo';
import { photoService } from '../services/photoService';
import { TrashIcon } from '@heroicons/react/24/outline';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoDeleted?: () => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoDeleted }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [confirmingPhotoId, setConfirmingPhotoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  const openModal = (photo: Photo) => {
    if (photo.isVideo) {
      setVideoLoading(true);
    }
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    setVideoLoading(false);
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
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
      setConfirmingPhotoId(null);

      // Silme başarılı olduğunda parent komponenti bilgilendir
      if (onPhotoDeleted) {
        onPhotoDeleted();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (photos.length === 0) {
    return <p className="text-center text-gray-600 mt-8 text-lg">Henüz fotoğraf yok. İlk fotoğrafı yükleyen siz olun!</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {photos.map((photo) => (
          <div
            key={photo._id}
            className="relative bg-white rounded-lg overflow-hidden shadow-md hover:-translate-y-1 transition-transform duration-200 hover:shadow-lg h-full"
          >
            <div
              className="cursor-pointer"
              onClick={() => openModal(photo)}
            >
              {photo.isVideo ? (
                <div className="relative w-full h-40 bg-gray-100">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="bg-white/90 rounded-full p-1">
                      <div className="bg-pink-500 text-white rounded-full w-14 h-14 flex items-center justify-center">
                        <span className="text-2xl ml-1">▶</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={photo.imagePath}
                  alt={photo.title}
                  className="w-full h-40 object-cover"
                />
              )}
            </div>

            {confirmingPhotoId === photo._id ? (
              <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/90 px-2 py-1 rounded-md shadow-md">
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
                className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-all duration-200"
                aria-label="Fotoğrafı sil"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}

            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                {photo.isVideo && (
                  <span className="bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full font-medium">Video</span>
                )}
                <h3 className="text-sm font-medium text-gray-800 truncate">{photo.title}</h3>
              </div>
              {photo.caption && (
                <p className="text-xs text-gray-500 line-clamp-2">{photo.caption}</p>
              )}
              <p className="text-xs text-gray-400 italic mt-1">Yükleyen: {photo.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 bg-white/90 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center font-bold z-10 hover:bg-white transition-colors"
            >
              ×
            </button>

            <a
              href={selectedPhoto.imagePath}
              download={`${selectedPhoto.title}.${selectedPhoto.isVideo ? 'mp4' : 'jpg'}`}
              className="absolute top-3 left-3 bg-white/90 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center z-10 hover:bg-white transition-colors"
              title="İndir"
              onClick={e => e.stopPropagation()}
            >
              ⬇️
            </a>

            {videoLoading && selectedPhoto.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[5]">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="bg-white pt-2 pb-4 px-4 rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-800">{selectedPhoto.title}</h3>
              {selectedPhoto.isVideo && (
                <span className="bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1">
                  Video
                </span>
              )}
            </div>

            <div className="bg-black w-full">
              {selectedPhoto.isVideo ? (
                <video
                  src={selectedPhoto.imagePath}
                  className="max-w-full max-h-[70vh] mx-auto"
                  controls
                  autoPlay
                  onLoadedData={handleVideoLoad}
                  onError={() => setVideoLoading(false)}
                />
              ) : (
                <img
                  src={selectedPhoto.imagePath}
                  alt={selectedPhoto.title}
                  className="max-w-full max-h-[70vh] mx-auto object-contain"
                />
              )}
            </div>

            <div className="bg-white p-4 rounded-b-lg">
              {selectedPhoto.caption && (
                <p className="text-sm text-gray-600 mb-3">{selectedPhoto.caption}</p>
              )}
              <p className="text-xs text-gray-500 italic">Yükleyen: {selectedPhoto.name}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGrid; 