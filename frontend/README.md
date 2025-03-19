# Düğün Albümü Frontend

Bu proje, düğün albümüne fotoğraf ve video yüklemek için kullanılan bir React uygulamasıdır.

## Geliştirme Ortamında Çalıştırma

Projeyi geliştirme ortamında çalıştırmak için:

```bash
cd frontend
npm install
npm start
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Vercel ile Dağıtım

Bu proje Vercel ile dağıtım için hazırlandı. Dağıtım için şu adımları izleyin:

1. [Vercel](https://vercel.com) hesabınıza giriş yapın
2. "New Project" seçeneğine tıklayın
3. GitHub reponuzu importlayın
4. Root Directory kısmında `frontend` klasörünü seçin
5. "Environment Variables" kısmını geçin (api.ts dosyasında backend URL'ini zaten tanımladık)
6. "Deploy" butonuna tıklayın

Dağıtım birkaç dakika sürebilir. İşlem tamamlandığında projenizin URL'i görüntülenecektir.

## Not

Backend API projenin şu adresinde yayınlanmıştır: [https://backend-l33bui0im-oguzberkays-projects.vercel.app/api](https://backend-l33bui0im-oguzberkays-projects.vercel.app/api)
