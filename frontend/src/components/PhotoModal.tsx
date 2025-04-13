import React, { useState, useEffect } from 'react';
import { Photo } from '../models/Photo';

interface PhotoModalProps {
    selectedPhoto: Photo | null;
    selectedPhotoIndex: number;
    photos: Photo[];
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({
    selectedPhoto,
    selectedPhotoIndex,
    photos,
    onClose,
    onNext,
    onPrevious
}) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [videoLoading, setVideoLoading] = useState(false);

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

    const handleTouchEnd = (e?: React.TouchEvent) => {
        if (e) e.stopPropagation();

        // Fotoğraf kaydırmada, eğer hiç hareket olmadıysa veya çok az olduysa
        if (!touchStart || !touchEnd) {
            setIsSwiping(false);
            setSwipeOffset(0);
            return;
        }

        // Kaydırma mesafesini hesapla (touchStart - touchEnd)
        const swipeDistance = touchStart - touchEnd;

        // Sola kaydırma (touchStart > touchEnd) - sonraki fotoğraf
        if (swipeDistance > 5 && selectedPhotoIndex < photos.length - 1) {
            onNext();
        }
        // Sağa kaydırma (touchStart < touchEnd) - önceki fotoğraf
        else if (swipeDistance < -5 && selectedPhotoIndex > 0) {
            onPrevious();
        }
        // Eğer yeterli mesafe kaydırılmadıysa veya sınırlardaysa sıfırla
        else {
            setSwipeOffset(0);
        }

        // Tüm touch ve swiping durumlarını sıfırla
        setTouchStart(null);
        setTouchEnd(null);
        setIsSwiping(false);
    };

    const handleVideoLoad = () => {
        setVideoLoading(false);
    };

    // Keyboard navigation for the modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPhoto) return;

            if (e.key === 'ArrowRight' && selectedPhotoIndex < photos.length - 1) {
                // Sonraki fotoğraf
                onNext();
            } else if (e.key === 'ArrowLeft' && selectedPhotoIndex > 0) {
                // Önceki fotoğraf
                onPrevious();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto, selectedPhotoIndex, photos, onClose, onNext, onPrevious]);

    if (!selectedPhoto) return null;

    return (
        <div
            className="fixed inset-0 bg-black flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div
                className="relative w-full h-full flex flex-col"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleModalTouchStart}
                onTouchMove={handleModalTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-black/60 text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl font-bold z-10 hover:bg-black/80 transition-colors backdrop-blur-sm"
                >
                    ×
                </button>

                <a
                    href={selectedPhoto.imagePath}
                    download={`${selectedPhoto.title}.${selectedPhoto.isVideo ? 'mp4' : 'jpg'}`}
                    className="absolute top-4 left-4 bg-black/40 text-white w-10 h-10 rounded-full flex items-center justify-center z-10 hover:bg-black/60 transition-colors backdrop-blur-sm"
                    title="İndir"
                    onClick={e => e.stopPropagation()}
                >
                    ⬇️
                </a>

                {/* Photo counter with dark theme */}
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
                        className="flex transition-transform duration-300 ease-out w-full h-full photo-container"
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
                    <div className="absolute bottom-12 left-4 text-white max-w-[80%] truncate">
                        <h3 className="text-lg font-medium">
                            {selectedPhoto.isVideo && (
                                <span className="inline-block bg-pink-500 text-white text-xs font-semibold mr-2 px-2 py-0.5 rounded">
                                    Video
                                </span>
                            )}
                            {selectedPhoto.title}
                        </h3>
                        <p className="text-sm text-white/70">
                            Yükleyen: {selectedPhoto.name}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoModal; 