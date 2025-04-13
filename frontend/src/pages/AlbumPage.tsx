import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import PhotoGrid from '../components/PhotoGrid';
import PhotoUpload from '../components/PhotoUpload';
import { Album } from '../models/Album';
import { Photo } from '../models/Photo';
import { albumService } from '../services/albumService';
import { photoService } from '../services/photoService';
import PhotoModal from '../components/PhotoModal';

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const [videoLoading, setVideoLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldShowUpload = searchParams.get('upload') === 'true';
    setShowUploadForm(shouldShowUpload);
  }, [location.search]);

  useEffect(() => {
    const fetchAlbumAndPhotos = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [albumData, photosData] = await Promise.all([
          albumService.getAlbumById(id),
          photoService.getPhotosByAlbumId(id)
        ]);
        setAlbum(albumData);
        setPhotos(photosData);
      } catch (err) {
        console.error('Error fetching album and photos:', err);
        setError('Albüm ve fotoğraflar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumAndPhotos();
  }, [id]);

  const handleUploadSuccess = async () => {
    // Refresh photos after upload
    if (id) {
      try {
        const updatedPhotos = await photoService.getPhotosByAlbumId(id);
        setPhotos(updatedPhotos);
        setShowUploadForm(false);
      } catch (err) {
        console.error('Error refreshing photos after upload:', err);
      }
    }
  };

  const openPhotoModal = (photo: Photo) => {
    // Directly use the clicked photo object and update state
    setSelectedPhoto(photo);
    setShowPhotoModal(true);

    // Ensure we find the correct index
    const photoIndex = photos.findIndex(p => p._id === photo._id);
    if (photoIndex !== -1) {
      setSelectedPhotoIndex(photoIndex);
    } else {
      // If index not found for some reason, use 0 as default
      console.warn('Photo index not found:', photo._id);
      setSelectedPhotoIndex(0);
    }

    // Set video loading state if needed
    if (photo.isVideo) {
      setVideoLoading(true);
    }
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
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

  const handlePhotosUpdated = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Hata</h2>
          <p className="text-gray-600 mb-4">{error || 'Albüm bulunamadı.'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Düğün Albümü" showBackButton backTo="/" />

      <div className="container-custom px-4 py-6">
        {!showUploadForm && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">{album.title}</h1>
            <p className="text-lg text-gray-600 mb-1">{album.date}</p>
            <h2 className="text-2xl font-semibold text-primary mb-3">{album.couple.name1} & {album.couple.name2}</h2>
            {album.description && (
              <p className="text-gray-700 max-w-2xl mx-auto">{album.description}</p>
            )}
          </div>
        )}

        {!showUploadForm && (
          <div className="bg-gray-50 border-l-4 border-primary p-5 rounded-md shadow-sm mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Düğünümüze Hoş Geldiniz</h3>
            <p className="text-gray-600 leading-relaxed">
              Değerli misafirlerimiz, düğünümüzde çektiğiniz özel anları ve fotoğraflarınızı burada paylaşabilirsiniz.
              Sizin gözünüzden düğünümüzün nasıl göründüğünü görmek bizi çok mutlu edecek.
              Aşağıdaki "Fotoğraf Ekle" bölümünden fotoğraflarınızı kolayca yükleyebilirsiniz.
            </p>
          </div>
        )}

        {showUploadForm && (
          <PhotoUpload
            albumId={id || ''}
            onUploadSuccess={handleUploadSuccess}
          />
        )}

        {!showUploadForm && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 relative after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:transform after:-translate-x-1/2 after:w-16 after:h-1 after:bg-primary after:rounded-full">
              Albüm Fotoğrafları
            </h2>
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowUploadForm(true)}
                className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow hover:bg-primary-dark transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-xl">📷</span>
                Fotoğraf Ekle
              </button>
            </div>
            <PhotoGrid
              photos={photos}
              albumId={id || ''}
              onPhotoClick={openPhotoModal}
              onPhotosUpdated={handlePhotosUpdated}
            />
          </>
        )}
      </div>

      {showPhotoModal && selectedPhoto && (
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

export default AlbumPage; 