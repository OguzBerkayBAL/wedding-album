# Düğün Albümü Uygulaması

Bu uygulama, düğün fotoğraflarını paylaşmak ve misafirlerin kendi fotoğraflarını yüklemesine olanak sağlamak için geliştirilmiş bir web uygulamasıdır.

## Özellikler

- Düğün albümleri oluşturma ve görüntüleme
- Fotoğraf yükleme ve paylaşma
- Fotoğrafları görüntüleme ve filtreleme
- Responsive tasarım - mobil ve masaüstü uyumlu

## Teknolojiler

### Frontend
- React
- TypeScript
- React Router
- Styled Components
- Axios

### Backend
- NestJS
- TypeScript
- MongoDB
- Mongoose
- Multer (Dosya yükleme)

## Kurulum

### Ön Gereksinimler
- Node.js (v14 veya üstü)
- npm veya yarn
- MongoDB (yerel veya MongoDB Atlas)

### Backend Kurulumu

```bash
cd backend
npm install
```

### Frontend Kurulumu

```bash
cd frontend
npm install
```

## Çalıştırma

### MongoDB Bağlantısı
MongoDB bağlantı bilgilerinizi `backend/.env` dosyasında ayarlayın:

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/wedding-album
PORT=3001
```

### Örnek Veri Oluşturma
Örnek veri eklemek için aşağıdaki komutu çalıştırın:

```bash
cd backend
npm run seed
```

### Backend Başlatma

```bash
cd backend
npm run start:dev
```

### Frontend Başlatma

```bash
cd frontend
npm start
```

Uygulama varsayılan olarak http://localhost:3000 adresinde çalışacaktır.

## API Endpointleri

### Albümler
- `GET /api/albums` - Tüm albümleri listele
- `GET /api/albums/:id` - Belirli bir albümü getir
- `POST /api/albums` - Yeni albüm oluştur
- `PUT /api/albums/:id` - Albüm güncelle
- `DELETE /api/albums/:id` - Albüm sil

### Fotoğraflar
- `GET /api/albums/:albumId/photos` - Bir albümdeki tüm fotoğrafları getir
- `POST /api/albums/:albumId/photos` - Albüme fotoğraf yükle
- `GET /api/photos/:id` - Belirli bir fotoğrafı getir
- `DELETE /api/photos/:id` - Fotoğraf sil 