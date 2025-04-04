import React, { useEffect, useState, useCallback, useRef, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Album } from '../models/Album';
import { Photo } from '../models/Photo';
import { albumService } from '../services/albumService';
import { photoService } from '../services/photoService';
import { TrashIcon } from '@heroicons/react/24/outline';
import FallingHearts from '../components/FallingHearts';

const HomePage: React.FC = () => {
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [confirmingPhotoId, setConfirmingPhotoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const photosContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  // Fallback slider images if no photos are available
  const fallbackSliderImages = [
    '/seda1.jpg',
    '/seda2.jpg',
    '/seda3.jpg'
  ];

  // Ana slider için gelin damat fotoğraflarını kullan, düğün fotoğraflarını değil
  const sliderMedia = fallbackSliderImages.map((img, index) => ({
    _id: String(index),
    imagePath: img,
    title: `Düğün fotoğrafı ${index + 1}`,
    name: '',
    isVideo: false
  }));

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // İlk albümü getir (Seda & Ömer)
        const albums = await albumService.getAllAlbums();
        if (albums.length > 0) {
          const album = albums[0]; // İlk albümü al
          setCurrentAlbum(album);

          // Fotoğrafları getir
          if (album._id) {
            const albumPhotos = await photoService.getPhotosByAlbumId(album._id);
            setPhotos(albumPhotos);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Otomatik slider için
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, nextSlide]);

  const handleAddPhotoClick = () => {
    if (currentAlbum && currentAlbum._id) {
      console.log("Yönlendirme yapılıyor, album ID:", currentAlbum._id);
      navigate(`/album/${currentAlbum._id}?upload=true`);
    } else {
      console.error("Album ID bulunamadı!");
    }
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
      if (currentAlbum && currentAlbum._id) {
        const updatedPhotos = await photoService.getPhotosByAlbumId(currentAlbum._id);
        setPhotos(updatedPhotos);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(false);
      setConfirmingPhotoId(null);
    }
  };

  const openPhotoModal = (photo: Photo) => {
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

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setVideoLoading(false);
    setSelectedPhotoIndex(-1);
  };

  const goToNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedPhotoIndex < photos.length - 1) {
      // Sonraki fotoğraf için sağdan sola geçiş efekti
      setSwipeOffset(-5); // Sola doğru hafif bir başlangıç offseti

      setTimeout(() => {
        const nextIndex = selectedPhotoIndex + 1;
        setSelectedPhotoIndex(nextIndex);
        setSelectedPhoto(photos[nextIndex]);
        if (photos[nextIndex].isVideo) {
          setVideoLoading(true);
        }
        // Hemen sıfırla
        setSwipeOffset(0);
      }, 10);
    }
  };

  const goToPreviousPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedPhotoIndex > 0) {
      // Önceki fotoğraf için soldan sağa geçiş efekti
      setSwipeOffset(5); // Sağa doğru hafif bir başlangıç offseti

      setTimeout(() => {
        const prevIndex = selectedPhotoIndex - 1;
        setSelectedPhotoIndex(prevIndex);
        setSelectedPhoto(photos[prevIndex]);
        if (photos[prevIndex].isVideo) {
          setVideoLoading(true);
        }
        // Hemen sıfırla
        setSwipeOffset(0);
      }, 10);
    }
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  const scrollPhotos = (direction: 'left' | 'right') => {
    if (!photosContainerRef.current) return;

    const scrollAmount = 320; // Bir kart genişliği + margin
    const currentScroll = photosContainerRef.current.scrollLeft;

    photosContainerRef.current.scrollTo({
      left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  };

  // Dokunmatik kaydırma için gerekli fonksiyonlar
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e?: React.TouchEvent) => {
    if (e) e.stopPropagation();

    // Eğer fotoğraf kaydırma işleminde değilsek, normal slider dokunmatik işlemini yap
    if (!selectedPhoto) {
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
      return;
    }

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
      goToNextPhoto();
    }
    // Sağa kaydırma (touchStart < touchEnd) - önceki fotoğraf
    else if (swipeDistance < -5 && selectedPhotoIndex > 0) {
      goToPreviousPhoto();
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
      const photoContainer = document.querySelector('.photo-container') as HTMLElement;
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

  // Add another handleTouchStart, handleTouchMove, and handleTouchEnd specifically for the photo modal
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

  // Keyboard navigation for the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;

      if (e.key === 'ArrowRight' && selectedPhotoIndex < photos.length - 1) {
        // Sonraki fotoğraf
        goToNextPhoto();
      } else if (e.key === 'ArrowLeft' && selectedPhotoIndex > 0) {
        // Önceki fotoğraf
        goToPreviousPhoto();
      } else if (e.key === 'Escape') {
        closePhotoModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, selectedPhotoIndex, photos, closePhotoModal]);

  if (loading || !currentAlbum) {
    return (
      <div className="min-h-screen">
        <Header title="Düğün Albümü" />
        <div className="container-custom py-6">
          <p className="text-center text-gray-500 py-8 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Düğün Albümü" />
      <FallingHearts />

      <div className="container-custom px-4 py-6">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="relative mb-6">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-1 relative inline-block">
              {currentAlbum.couple.name1} & {currentAlbum.couple.name2}
              <span className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-pink-200 via-pink-500 to-pink-200 rounded-full"></span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-10 font-light italic">{currentAlbum.date}</p>

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

        {/* Photos Section - Yatay Carousel */}
        <section className="pt-6 mb-16">
          <h2 className="text-2xl font-serif font-bold text-center text-gray-800 mb-10 relative">
            <span className="relative inline-block">
              Düğün Fotoğrafları & Videolar
              <span className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></span>
            </span>
          </h2>

          {photos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-gray-600 text-lg font-light">
                Henüz fotoğraf yok.
              </p>
              <p className="text-gray-500 mt-2">
                İlk fotoğrafı yükleyen siz olun!
              </p>
              <button
                onClick={handleAddPhotoClick}
                className="mt-6 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-full text-sm shadow-sm hover:shadow transition-all duration-200"
              >
                Fotoğraf/Video Ekle
              </button>
            </div>
          ) : (
            <div className="relative max-w-6xl mx-auto">
              <div className="overflow-x-auto pb-6 hide-scrollbar" ref={photosContainerRef}>
                <div className="flex gap-5 px-2 snap-x snap-mandatory">
                  {photos.map((photo) => (
                    <div
                      key={photo._id}
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-1 transition-all duration-300 hover:shadow-lg relative flex-shrink-0 w-64 snap-start h-full border border-gray-100"
                    >
                      <div className="cursor-pointer" onClick={() => openPhotoModal(photo)}>
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
          )}
        </section>

        {/* Hoş Geldiniz Bilgi Kartı */}
        <section className="relative max-w-3xl mx-auto mb-20">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl p-10 md:p-12 shadow-lg relative overflow-hidden border border-pink-100">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 rounded-full opacity-70 transform translate-x-16 -translate-y-16 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-100 rounded-full opacity-70 transform -translate-x-16 translate-y-16 blur-xl"></div>

            {/* Kalp Süslemeleri */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              {[...Array(20)].map((_, index) => (
                <div
                  key={index}
                  className="absolute text-pink-500"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 16 + 10}px`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                >
                  ❤
                </div>
              ))}
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-6 relative z-10">
              Düğünümüze<br />
              <span className="text-pink-600">Hoş Geldiniz</span>
            </h2>

            <p className="text-gray-700 leading-relaxed mb-8 max-w-lg mx-auto relative z-10">
              Hayatımızın en özel gününde bizlerle olmanızdan mutluluk duyuyoruz. <br />
              Ömürlük birlikteliğimizin ilk çektiğiniz anılarınızı da burada paylaşabilirsiniz.
            </p>
          </div>
        </section>
      </div>

      {/* Add Photo Button */}
      <button
        onClick={handleAddPhotoClick}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-5 py-3 rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 transition-all duration-300 hover:-translate-y-1 z-40"
      >
        <span className="text-xl">📷</span>
        Fotoğraf/Video Ekle
      </button>

      {/* Fotoğraf Büyütme Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black flex justify-center items-center z-50"
          onClick={closePhotoModal}
        >
          <div
            className="relative w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleModalTouchStart}
            onTouchMove={handleModalTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={closePhotoModal}
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
      )}
    </div>
  );
};

export default HomePage; 