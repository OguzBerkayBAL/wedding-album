import React, { useState, useEffect, useRef } from 'react';
import { Photo } from '../models/Photo';

interface PhotoSliderProps {
    photos: Photo[];
    onSlideClick: (photo: Photo) => void;
}

const PhotoSlider: React.FC<PhotoSliderProps> = ({ photos, onSlideClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const slideRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToPhoto = (index: number) => {
        if (!slideRef.current) return;
        const slideWidth = slideRef.current.clientWidth;
        const newPosition = -(index * slideWidth);
        slideRef.current.style.transform = `translateX(${newPosition}px)`;
        setCurrentIndex(index);
    };

    // Handle auto-scrolling for the photo slider
    useEffect(() => {
        if (photos.length <= 1) return;

        const startAutoScroll = () => {
            autoScrollIntervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % photos.length;
                    scrollToPhoto(nextIndex);
                    return nextIndex;
                });
            }, 5000); // Scroll every 5 seconds
        };

        startAutoScroll();

        return () => {
            if (autoScrollIntervalRef.current) {
                clearInterval(autoScrollIntervalRef.current);
            }
        };
    }, [photos.length]);

    // Touch events for swiping the slider
    const handleTouchStart = (e: React.TouchEvent) => {
        if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
        }
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentIndex < photos.length - 1) {
            scrollToPhoto(currentIndex + 1);
        } else if (isRightSwipe && currentIndex > 0) {
            scrollToPhoto(currentIndex - 1);
        }

        // Restart auto scroll after user interaction
        if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
        }
        autoScrollIntervalRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % photos.length;
                scrollToPhoto(nextIndex);
                return nextIndex;
            });
        }, 5000);
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            scrollToPhoto(currentIndex);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [currentIndex]);

    if (photos.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-xl">
                <p className="text-gray-500">Henüz fotoğraf bulunmamaktadır.</p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-xl w-full h-64 md:h-96">
            <div
                ref={sliderRef}
                className="w-full h-full overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    ref={slideRef}
                    className="flex transition-transform duration-300 ease-out h-full"
                    style={{
                        width: `${photos.length * 100}%`,
                        transform: `translateX(-${currentIndex * (100 / photos.length)}%)`,
                    }}
                >
                    {photos.map((photo, index) => (
                        <div
                            key={photo._id}
                            className="flex-shrink-0"
                            style={{ width: `${100 / photos.length}%` }}
                            onClick={() => onSlideClick(photo)}
                        >
                            {photo.isVideo ? (
                                <video
                                    src={photo.imagePath}
                                    className="w-full h-full object-cover cursor-pointer"
                                    muted
                                    onClick={() => onSlideClick(photo)}
                                />
                            ) : (
                                <img
                                    src={photo.imagePath}
                                    alt={photo.title || "Slider image"}
                                    className="w-full h-full object-cover cursor-pointer"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                {photos.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollToPhoto(index)}
                        className={`w-2 h-2 rounded-full mx-1 transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default PhotoSlider; 