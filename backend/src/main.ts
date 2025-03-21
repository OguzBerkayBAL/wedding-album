import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Uploads klasörünün varlığını kontrol et, yoksa oluştur
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads klasörü oluşturuldu:', uploadsDir);
  }

  // Çıktılar için tmp klasörü oluştur (genellikle video önizlemeleri için)
  const tmpDir = join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log('Tmp klasörü oluşturuldu:', tmpDir);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // NestJS'in varsayılan body parser'ını kapatıyoruz, büyük dosyalar için
  });

  app.useGlobalPipes(new ValidationPipe());

  // CORS ayarları - frontend uygulamanın adresini ekleyin
  app.enableCors({
    origin: [
      'https://wedding-album-frontend.vercel.app',
      'https://wedding-album-frontend.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Express dosya yükleme ve sunucu limitleri - çok büyük dosyalar için
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // MongoDB bağlantı nesnesi boyutu limiti
  process.env.NODE_OPTIONS = "--max-old-space-size=4096"; // 4GB bellek limiti
  // Not: Bu tam çözüm olmayabilir, MongoDB sürücüsü için ek ayarlar gerekebilir

  // Statik dosya servis ayarları
  app.use('/uploads', express.static(join(process.cwd(), 'uploads'), {
    maxAge: '365d',  // Tarayıcı önbellekleme süresi
    index: false,    // Dizin listemeyi engelle
    setHeaders: (res) => {
      res.set('Cache-Control', 'public, max-age=31536000');
      res.set('X-Content-Type-Options', 'nosniff');
    }
  }));

  // Uygulama öneki
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3001);
  console.log(`Uygulama şu portta çalışıyor: ${process.env.PORT || 3001}`);
  console.log(`Uploads klasörü: ${uploadsDir}`);
  console.log(`Dosya boyut limiti: 100MB`);
  console.log(`CORS izinleri ayarlandı`);

  // Bellek kullanımını göster
  const memoryUsage = process.memoryUsage();
  console.log('Bellek kullanımı:', {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
  });
}
bootstrap();
