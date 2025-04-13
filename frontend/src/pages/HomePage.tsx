import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Album } from '../models/Album';
import { Photo } from '../models/Photo';
import { albumService } from '../services/albumService';
import { photoService } from '../services/photoService';
import FallingHearts from '../components/FallingHearts';
import PhotoModal from '../components/PhotoModal';
import PhotoGrid from '../components/PhotoGrid';
import WelcomeCard from '../components/WelcomeCard';
import HeroSlider from '../components/HeroSlider';
import AddPhotoButton from '../components/AddPhotoButton';

const HomePage: React.FC = () => {
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const [videoLoading, setVideoLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleAddPhotoClick = () => {
    if (currentAlbum && currentAlbum._id) {
      console.log("Yönlendirme yapılıyor, album ID:", currentAlbum._id);
      navigate(`/album/${currentAlbum._id}?upload=true`);
    } else {
      console.error("Album ID bulunamadı!");
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

  const goToNextPhoto = () => {
    if (selectedPhotoIndex < photos.length - 1) {
      const nextIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(nextIndex);
      setSelectedPhoto(photos[nextIndex]);
      if (photos[nextIndex].isVideo) {
        setVideoLoading(true);
      }
    }
  };

  const goToPreviousPhoto = () => {
    if (selectedPhotoIndex > 0) {
      const prevIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(prevIndex);
      setSelectedPhoto(photos[prevIndex]);
      if (photos[prevIndex].isVideo) {
        setVideoLoading(true);
      }
    }
  };

  const handleVideLoad = () => {
    setVideoLoading(false);
  };

  const handlePhotosUpdated = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos);
  };

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
        <HeroSlider
          sliderMedia={sliderMedia}
          albumNames={currentAlbum.couple}
          albumDate={currentAlbum.date}
        />

        {/* Photos Section */}
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
            <PhotoGrid
              photos={photos}
              albumId={currentAlbum._id || ''}
              onPhotoClick={openPhotoModal}
              onPhotosUpdated={handlePhotosUpdated}
            />
          )}
        </section>

        {/* Hoş Geldiniz Bilgi Kartı */}
        <section className="relative max-w-3xl mx-auto mb-20">
          <WelcomeCard />
        </section>
      </div>

      {/* Add Photo Button */}
      <AddPhotoButton onClick={handleAddPhotoClick} />

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          selectedPhoto={selectedPhoto}
          selectedPhotoIndex={selectedPhotoIndex}
          photos={photos}
          onClose={closePhotoModal}
          onNext={goToNextPhoto}
          onPrevious={goToPreviousPhoto}
        />
      )}
    </div>
  );
};

export default HomePage; 