import React, { useState, useCallback, useRef, TouchEvent, useEffect } from 'react';

interface SliderMedia {
    _id: string;
    imagePath: string;
    title: string;
    name: string;
    isVideo: boolean;
}

interface HeroSliderProps {
    sliderMedia: SliderMedia[];
    albumNames: { name1: string; name2: string };
    albumDate: string;
}

const HeroSlider: React.FC<HeroSliderProps> = ({
    sliderMedia,
    albumNames,
    albumDate
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) =>
            prev === sliderMedia.length - 1 ? 0 : prev + 1
        );
    }, [sliderMedia.length]);

    const prevSlide = () => {
        setCurrentSlide((prev) =>
            prev === 0 ? sliderMedia.length - 1 : prev - 1
        );
    };

    // Otomatik slider için
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [currentSlide, nextSlide]);

    // Dokunmatik kaydırma için gerekli fonksiyonlar
    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        setTouchStart(e.targetTouches[0].clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (!touchStart) return;
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) {
            setIsDragging(false);
            return;
        }

        const distance = touchStart - touchEnd;
        const minSwipeDistance = 50; // Minimum kaydırma mesafesi

        if (distance > minSwipeDistance) {
            // Sola kaydırma (sonraki)
            nextSlide();
        } else if (distance < -minSwipeDistance) {
            // Sağa kaydırma (önceki)
            prevSlide();
        }

        // Dokunma bilgilerini sıfırla
        setTouchStart(null);
        setTouchEnd(null);
        setIsDragging(false);
    };

    return (
        <section className="text-center mb-20">
            <div className="relative mb-6">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-1 relative inline-block">
                    {albumNames.name1} & {albumNames.name2}
                    <span className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-pink-200 via-pink-500 to-pink-200 rounded-full"></span>
                </h1>
            </div>
            <p className="text-xl text-gray-600 mb-10 font-light italic">{albumDate}</p>

            {/* Image Slider - Dokunmatik ve Kaydırmalı */}
            <div className="relative max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-xl bg-white border border-gray-100">
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-pink-100 rounded-full opacity-70 blur-xl z-0"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-100 rounded-full opacity-70 blur-xl z-0"></div>

                <div
                    ref={sliderRef}
                    className="flex h-full transition-transform duration-500 ease-in-out relative z-10"
                    style={{
                        transform: `translateX(-${currentSlide * 100}%)`,
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {sliderMedia.map((media, index) => (
                        <div
                            key={media._id}
                            className="w-full h-full flex-shrink-0 relative bg-white flex items-center justify-center p-4"
                        >
                            {typeof media === 'string' || !media.isVideo ? (
                                <img
                                    src={typeof media === 'string' ? media : media.imagePath}
                                    alt={typeof media === 'string' ? `Düğün fotoğrafı ${index + 1}` : media.title}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                                    draggable="false"
                                />
                            ) : (
                                <video
                                    src={media.imagePath}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                                    controls
                                    muted
                                    onClick={e => e.currentTarget.play()}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Slider Nokta Göstergeleri - Mobil İçin */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                    {sliderMedia.map((_, index) => (
                        <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${currentSlide === index
                                ? 'bg-pink-500 w-4 shadow-sm'
                                : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Fotoğraf ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Left/Right swipe indicators - hidden but still functional */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm text-gray-700 w-10 h-10 rounded-full flex items-center justify-center opacity-0 transition-opacity duration-300 cursor-pointer z-20 hidden" onClick={prevSlide}>
                    <span className="sr-only">Önceki</span>
                    <span className="text-xl">❮</span>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm text-gray-700 w-10 h-10 rounded-full flex items-center justify-center opacity-0 transition-opacity duration-300 cursor-pointer z-20 hidden" onClick={nextSlide}>
                    <span className="sr-only">Sonraki</span>
                    <span className="text-xl">❯</span>
                </div>
            </div>
        </section>
    );
};

export default HeroSlider; 