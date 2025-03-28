import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Swipe threshold - minimum distance required for a swipe
  const minSwipeDistance = 50;

  const openModal = (photo: Photo) => {
    // Doğrudan fotoğraf nesnesini kullan ve tıklanan fotoğraf için state'i güncelle
    setSelectedPhoto(photo);

    // İndeks kontrolü yap, ama ilk fotoğrafa tıklandığında açılmasını garanti et
    const photoIndex = photos.findIndex(p => p._id === photo._id);
    if (photoIndex !== -1) {
      setSelectedPhotoIndex(photoIndex);
    } else {
      // Eğer bir şekilde indeks bulunmazsa, varsayılan olarak 0 kullan
      console.warn('Fotoğraf indeksi bulunamadı:', photo._id);
      setSelectedPhotoIndex(0);
    }

    // Video yükleme durumunu ayarla
    if (photo.isVideo) {
      setVideoLoading(true);
    }
  };

  const closeModal = useCallback(() => {
    setSelectedPhoto(null);
    setVideoLoading(false);
    setSelectedPhotoIndex(-1);
  }, []);

  const goToNextPhoto = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedPhotoIndex < photos.length - 1) {
      const nextIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(nextIndex);
      setSelectedPhoto(photos[nextIndex]);
      if (photos[nextIndex].isVideo) {
        setVideoLoading(true);
      }
    }
  }, [selectedPhotoIndex, photos]);

  const goToPreviousPhoto = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedPhotoIndex > 0) {
      const prevIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(prevIndex);
      setSelectedPhoto(photos[prevIndex]);
      if (photos[prevIndex].isVideo) {
        setVideoLoading(true);
      }
    }
  }, [selectedPhotoIndex, photos]);

  const handleModalTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStart || !isSwiping) return;

    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    // Calculate how far we've swiped as a percentage of screen width
    const screenWidth = window.innerWidth;
    const dragOffset = currentTouch - touchStart;

    // Ekran genişliğinin başına ve sonuna göre offset hesapla
    // Bu sayede %100'ü tamamen doğal geçiş için ayırıyoruz
    let offsetPercentage = (dragOffset / screenWidth) * 100;

    // Sınırlar içinde kalmak için ayarla, ekran kenarları için direnç ekle
    if ((selectedPhotoIndex === 0 && offsetPercentage > 0) ||
      (selectedPhotoIndex === photos.length - 1 && offsetPercentage < 0)) {
      // İlk veya son fotoğrafta daha zor hareket ettir (direnç ekle)
      offsetPercentage = offsetPercentage / 3;
    }

    // Parmak pozisyonunu takip etmesi için offseti güncelle
    setSwipeOffset(offsetPercentage);
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();

    // Fotoğraf kaydırmada, eğer hiç hareket olmadıysa veya çok az olduysa
    if (!touchStart || !touchEnd) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }

    // Swipe yönünü ve miktarını belirle
    const currentSwipeOffset = swipeOffset;
    const swipeThreshold = 10; // Daha düşük bir eşik değeri kullan - bırakıldığında devam edecek
    const maxSwipeOffset = 40; // Maksimum swipe miktarı, bundan sonra otomatik tamamlansın

    // Sağa kaydırma - önceki fotoğraf
    if (currentSwipeOffset > 0) {
      if (selectedPhotoIndex > 0) {
        if (currentSwipeOffset > maxSwipeOffset) {
          // Otomatik olarak tamamla - önceki fotoğrafa geç
          console.log('Önceki fotoğrafa doğal geçiş yapılıyor');
          animateToNextPhotoNaturally(selectedPhotoIndex - 1, currentSwipeOffset);
        } else if (currentSwipeOffset > swipeThreshold) {
          // Eğer eşiği geçtiyse tamamla
          console.log('Önceki fotoğrafa geçiş tamamlanıyor');
          animateToNextPhotoNaturally(selectedPhotoIndex - 1, currentSwipeOffset);
        } else {
          // Eşiğin altındaysa geri dön
          animateReset();
        }
      } else {
        // İlk fotoğraftaysak geri dön
        animateReset();
      }
    }
    // Sola kaydırma - sonraki fotoğraf
    else if (currentSwipeOffset < 0) {
      if (selectedPhotoIndex < photos.length - 1) {
        if (Math.abs(currentSwipeOffset) > maxSwipeOffset) {
          // Otomatik olarak tamamla - sonraki fotoğrafa geç
          console.log('Sonraki fotoğrafa doğal geçiş yapılıyor');
          animateToNextPhotoNaturally(selectedPhotoIndex + 1, currentSwipeOffset);
        } else if (Math.abs(currentSwipeOffset) > swipeThreshold) {
          // Eğer eşiği geçtiyse tamamla
          console.log('Sonraki fotoğrafa geçiş tamamlanıyor');
          animateToNextPhotoNaturally(selectedPhotoIndex + 1, currentSwipeOffset);
        } else {
          // Eşiğin altındaysa geri dön
          animateReset();
        }
      } else {
        // Son fotoğraftaysak geri dön
        animateReset();
      }
    } else {
      // Hiç hareket yoksa sıfırla
      animateReset();
    }

    // Tüm touch ve swiping durumlarını sıfırla
    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
  };

  // Doğal geçiş animasyonu
  const animateToNextPhotoNaturally = (targetIndex: number, currentOffset: number) => {
    const isNext = targetIndex > selectedPhotoIndex;
    // Doğru animasyon yönünü ayarla: kaydırma yönü ile ters olmalı
    // Sağa kaydırma (pozitif offset) için sola doğru git (-100)
    // Sola kaydırma (negatif offset) için sağa doğru git (100)
    const targetOffset = currentOffset > 0 ? -100 : 100;
    const currentAbsOffset = Math.abs(currentOffset);

    // Kalan mesafeye göre animasyon süresini ayarla (zaten kaydırılan mesafe için süreyi kısalt)
    const progress = currentAbsOffset / 100; // Ne kadar ilerlediğimiz (0-1 arası)
    const baseDuration = 300; // Temel animasyon süresi (ms)
    const adjustedDuration = Math.round(baseDuration * (1 - progress)); // Kalan yol için süre

    console.log(`Doğal geçiş: ${currentOffset} -> ${targetOffset}, süre: ${adjustedDuration}ms`);

    // Animasyonu devam ettir
    requestAnimationFrame(() => {
      // Önce geçiş animasyonunu göster
      const transitionStyle = `transform ${adjustedDuration}ms ease-out`;
      const photoContainer = document.querySelector('.photo-grid-container') as HTMLElement;
      if (photoContainer) {
        photoContainer.style.transition = transitionStyle;
      }

      setSwipeOffset(targetOffset);

      // Animasyon bittikten sonra fotoğrafı değiştir
      setTimeout(() => {
        setSelectedPhotoIndex(targetIndex);
        setSelectedPhoto(photos[targetIndex]);

        if (photos[targetIndex].isVideo) {
          setVideoLoading(true);
        }

        // Konum sıfırla, ama animasyon gösterme
        requestAnimationFrame(() => {
          if (photoContainer) {
            photoContainer.style.transition = 'none';
          }
          setSwipeOffset(0);
        });
      }, adjustedDuration);
    });
  };

  const animateReset = () => {
    requestAnimationFrame(() => {
      setSwipeOffset(0);
    });
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedPhoto) return;

    if (e.key === 'ArrowRight' && selectedPhotoIndex < photos.length - 1) {
      // Sonraki fotoğraf
      const nextIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(nextIndex);
      setSelectedPhoto(photos[nextIndex]);
      if (photos[nextIndex].isVideo) {
        setVideoLoading(true);
      }
    } else if (e.key === 'ArrowLeft' && selectedPhotoIndex > 0) {
      // Önceki fotoğraf
      const prevIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(prevIndex);
      setSelectedPhoto(photos[prevIndex]);
      if (photos[prevIndex].isVideo) {
        setVideoLoading(true);
      }
    } else if (e.key === 'Escape') {
      closeModal();
    }
  }, [selectedPhoto, selectedPhotoIndex, photos, closeModal]);

  // Add and remove event listener for keyboard navigation
  useEffect(() => {
    if (selectedPhoto) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPhoto, selectedPhotoIndex, photos, handleKeyDown]);

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
          className="fixed inset-0 bg-black flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="relative w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleModalTouchStart}
            onTouchMove={handleModalTouchMove}
            onTouchEnd={handleModalTouchEnd}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-black/60 text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl font-bold z-10 hover:bg-black/80 transition-colors backdrop-blur-sm"
            >
              ×
            </button>

            <a
              href={selectedPhoto.imagePath}
              download={`${selectedPhoto.title}.${selectedPhoto.isVideo ? 'mp4' : 'jpg'}`}
              className="absolute top-4 left-4 bg-black/40 text-white w-10 h-10 rounded-full flex items-center justify-center z-10 hover:bg-black/60 transition-colors backdrop-blur-sm"
              title="İndir"
              onClick={(e) => e.stopPropagation()}
            >
              ⬇️
            </a>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white px-3 py-1 rounded-full z-10 text-sm font-medium backdrop-blur-sm">
              {selectedPhotoIndex + 1} / {photos.length}
            </div>

            {videoLoading && selectedPhoto.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-[5]">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent h-24 z-[1] pointer-events-none"></div>

            <div className="flex-grow flex items-center justify-center bg-black w-full overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-out w-full h-full photo-grid-container"
                style={{
                  transform: `translateX(calc(${swipeOffset}%))`,
                  width: '100%',
                  height: '100%',
                  willChange: 'transform',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none'
                }}
              >
                {/* Current Photo */}
                <div className="flex-shrink-0 w-full h-full flex items-center justify-center">
                  {selectedPhoto.isVideo ? (
                    <video
                      src={selectedPhoto.imagePath}
                      className="max-w-full max-h-screen mx-auto"
                      controls
                      autoPlay
                      onLoadedData={handleVideoLoad}
                      onError={() => setVideoLoading(false)}
                    />
                  ) : (
                    <img
                      src={selectedPhoto.imagePath}
                      alt={selectedPhoto.title}
                      className="max-w-full max-h-screen w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-24 z-[1]">
              <div className="absolute bottom-12 left-4 text-white max-w-[80%]">
                <h3 className="text-lg font-medium">
                  {selectedPhoto.isVideo && (
                    <span className="inline-block bg-pink-500 text-white text-xs font-semibold mr-2 px-2 py-0.5 rounded">
                      Video
                    </span>
                  )}
                  {selectedPhoto.title}
                </h3>
                {selectedPhoto.caption && (
                  <p className="text-sm text-white/90 mt-1 line-clamp-2">{selectedPhoto.caption}</p>
                )}
                <p className="text-sm text-white/70 mt-1">
                  Yükleyen: {selectedPhoto.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGrid; 