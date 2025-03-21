import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Album } from '../models/Album';
import { Photo } from '../models/Photo';
import { albumService } from '../services/albumService';
import { photoService } from '../services/photoService';
import Header from '../components/Header';
import PhotoGrid from '../components/PhotoGrid';
import PhotoUpload from '../components/PhotoUpload';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // URL parametrelerinden showUpload değerini alma
  useEffect(() => {
    try {
      const queryParams = new URLSearchParams(location.search);
      const showUpload = queryParams.get('showUpload');
      console.log('URL parametreleri:', {
        id: id,
        showUpload: showUpload,
        fullURL: location.pathname + location.search
      });

      if (showUpload === 'true') {
        setShowUploadForm(true);
      }
    } catch (err) {
      console.error('URL parametre hatası:', err);
    }
  }, [location]);

  // Album ve fotoğrafları yükleme
  const fetchAlbumAndPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!id) {
        console.error('Album ID bulunamadı');
        setError('Album bulunamadı. Lütfen anasayfaya dönün.');
        setLoading(false);
        return;
      }

      console.log(`Album ID: ${id} için veri yükleniyor...`);

      // Album bilgilerini al
      const albumData = await albumService.getAlbumById(id);
      setAlbum(albumData);
      console.log('Album yüklendi:', albumData.name);

      // Album fotoğraflarını al
      const photoData = await photoService.getPhotosByAlbumId(id);
      setPhotos(photoData);
      console.log(`${photoData.length} fotoğraf yüklendi`);

    } catch (err: any) {
      console.error('Album yükleme hatası:', err);
      setError('Album yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAlbumAndPhotos();
    }
  }, [id]);

  // Fotoğraf yükleme başarılı olduğunda
  const handleUploadSuccess = () => {
    console.log('Fotoğraf yükleme başarılı, albüm fotoğrafları yenileniyor');
    // Yükleme formunu gizle
    setShowUploadForm(false);

    // Fotoğrafları yeniden yükle
    if (id) {
      // URL'deki showUpload parametresini kaldır
      navigate(`/album/${id}`, { replace: true });
      // Fotoğrafları yenile
      fetchAlbumAndPhotos();
      // Başarılı bildirimi göster
      toast.success('Teşekkürler! Fotoğraflar başarıyla yüklendi.', {
        position: "top-center",
        autoClose: 3000
      });
    }
  };

  // Yükleme formunu göster/gizle
  const toggleUploadForm = () => {
    const newState = !showUploadForm;
    setShowUploadForm(newState);

    // URL'yi güncelle ama sayfayı yenileme
    const url = new URL(window.location.href);
    if (newState) {
      url.searchParams.set('showUpload', 'true');
    } else {
      url.searchParams.delete('showUpload');
    }
    window.history.pushState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <LoadingSpinner text="Albüm yükleniyor..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="text-center p-8 bg-red-50 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Hata</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Anasayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto py-6 px-4">
        {album && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{album.name}</h1>
            {album.description && (
              <p className="text-gray-600">{album.description}</p>
            )}
          </div>
        )}

        {/* Butonlar */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            ← Tüm Albümler
          </button>

          <button
            onClick={toggleUploadForm}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            {showUploadForm ? 'Fotoğrafları Göster' : 'Fotoğraf Ekle'}
          </button>
        </div>

        {/* Form veya Fotoğraf Gösterimi */}
        {showUploadForm ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Yeni Fotoğraf Ekle</h2>
            {id && <PhotoUpload albumId={id} onUploadSuccess={handleUploadSuccess} />}
          </div>
        ) : (
          <div>
            {photos.length === 0 ? (
              <div className="text-center p-8 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Bu albümde henüz fotoğraf yok</h2>
                <p className="text-gray-600 mb-4">İlk fotoğrafı eklemek için "Fotoğraf Ekle" butonuna tıklayın.</p>
                <button
                  onClick={toggleUploadForm}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  Fotoğraf Ekle
                </button>
              </div>
            ) : (
              <PhotoGrid photos={photos} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumPage; 