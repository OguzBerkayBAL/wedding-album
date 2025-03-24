import React, { useState, useEffect } from 'react';
import { photoService } from '../services/photoService';

interface PhotoUploadProps {
  albumId: string;
  onUploadSuccess: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ albumId, onUploadSuccess }) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string, isVideo: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // Dosya önizlemelerini oluştur
      const newPreviews = selectedFiles.map(file => {
        const isVideoFile = file.type.startsWith('video/');
        return {
          url: URL.createObjectURL(file),
          isVideo: isVideoFile
        };
      });

      // Eski URL'leri temizle
      previews.forEach(preview => URL.revokeObjectURL(preview.url));

      setPreviews(newPreviews);
    }
  };

  // Komponent kaldırıldığında URL'leri temizle
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      setErrorMessage('Lütfen en az bir fotoğraf veya video yükleyin');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Lütfen adınızı girin');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(0);

      // Tüm dosyaları sırayla yükle
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();

        // Adı ekle
        formData.append('name', name.trim());

        // Başlık ekle - boşsa dosya adını kullan
        const fileTitle = title.trim() || file.name.split('.')[0];
        formData.append('title', fileTitle);

        formData.append('photo', file);
        formData.append('albumId', albumId);

        console.log(`Dosya ${i + 1} yükleniyor:`, {
          name: name.trim(),
          title: fileTitle,
          fileName: file.name
        });

        // Cloudinary entegrasyonu ile yükleme
        await photoService.uploadPhoto(formData, (progress) => {
          // Her dosya için ilerleme yüzdesini güncelle
          // Toplam ilerleme = (tamamlanan dosyalar + şu anki dosyanın yüzdesi / 100) / toplam dosya sayısı
          const totalProgress = Math.round(((i + (progress / 100)) / files.length) * 100);
          setUploadProgress(totalProgress);
        });
      }

      // Başarı mesajı göster
      setSuccessMessage(`${files.length} dosya başarıyla yüklendi!`);

      // Yönlendirme durumunu aktif et
      setIsRedirecting(true);

      // Formu sıfırla
      setName('');
      setTitle('');
      setFiles([]);
      setPreviews([]);

      // Albüm sayfasını güncelle
      onUploadSuccess();

      // 2 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        // Sayfayı yenileyerek ana sayfaya dön
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Error uploading media:', error);
      setErrorMessage('Dosyalar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg shadow-sm">
      {isRedirecting && (
        <div className="mb-4 p-4 bg-pink-100 border border-pink-300 text-pink-700 rounded-md text-center font-medium animate-pulse">
          <span className="inline-block mr-2">🚀</span>
          Albüm sayfasına yönlendiriliyorsunuz...
        </div>
      )}

      {successMessage && !isRedirecting && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-center">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-center">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Adınız <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınızı girin"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Başlık (Boş bırakılırsa dosya adı kullanılır)
          </label>
          <input
            type="text"
            id="title"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tüm fotoğraflar/videolar için ortak başlık"
          />
        </div>

        <div className="p-3">
          <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
            Fotoğraf veya Video Yükle
          </label>
          <div
            className="relative h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <span className="text-3xl text-gray-400">📷 🎬</span>
            <p className="mt-2 text-sm text-gray-500 text-center">
              {files.length > 0
                ? `${files.length} dosya seçildi`
                : 'Fotoğraf veya video yüklemek için tıklayın veya sürükleyin'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              (Desteklenen formatlar: jpg, jpeg, png, gif, mp4, webm, mov)
            </p>
            <p className="text-xs text-gray-400">
              (Maksimum dosya boyutu: 60MB)
            </p>
            <input
              type="file"
              id="photo"
              accept="image/*,video/*"
              onChange={handleFileChange}
              required
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Önizlemeler */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative rounded-md overflow-hidden border border-gray-200">
                  {preview.isVideo ? (
                    <video
                      src={preview.url}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <img
                      src={preview.url}
                      alt={`Önizleme ${index + 1}`}
                      className="h-24 w-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                    {files[index].name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Yükleme ilerleme durumu */}
          {isUploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-pink-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-1">
                Yükleniyor... ({uploadProgress}%)
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={files.length === 0 || isUploading}
          className="w-full py-3 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 mt-4"
        >
          {isUploading ? 'Yükleniyor...' : 'Fotoğraf/Video Ekle'}
        </button>
      </form>
    </div>
  );
};

export default PhotoUpload; 