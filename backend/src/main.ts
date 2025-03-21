import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Uygulama başlatılıyor...');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Uploads klasörünün varlığını kontrol et ve yoksa oluştur
  // Mutlak yol kullanarak dosya yolu oluştur
  const uploadsDir = join(process.cwd(), 'uploads');
  logger.log(`Uploads klasörü yolu: ${uploadsDir}`);

  if (!fs.existsSync(uploadsDir)) {
    logger.log(`Uploads klasörü bulunamadı, oluşturuluyor: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
  } else {
    logger.log(`Uploads klasörü mevcut: ${uploadsDir}`);
    // İzinleri kontrol et
    try {
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      logger.log('Uploads klasörüne yazma izni var');
    } catch (err) {
      logger.error(`Uploads klasörüne yazma izni yok: ${err.message}`);
    }
  }

  // Dosya boyut limitini 60MB'a ayarla
  app.use(bodyParser.json({ limit: '60mb' }));
  app.use(bodyParser.urlencoded({ limit: '60mb', extended: true }));

  // CORS ayarları
  logger.log('CORS ayarları yapılandırılıyor...');
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3002',
      'https://frontend-iwc82e2ki-oguzberkays-projects.vercel.app',
      'https://wedding-album-frontend.vercel.app',
      'https://wedding-album.vercel.app',
      'https://wedding-album-frontend.onrender.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
    exposedHeaders: 'Content-Range,X-Total-Count',
    maxAge: 3600,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Statik dosyaları servis et
  logger.log(`Statik dosyalar şuradan servis ediliyor: ${uploadsDir}`);
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
  });

  // Environment değişkenlerini göster
  logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Mevcut çalışma dizini: ${process.cwd()}`);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`Uygulama şu portta çalışıyor: ${port}`);
  logger.log(`Uploads klasörünün mutlak yolu: ${path.resolve(uploadsDir)}`);
  logger.log(`Dosya boyut limiti: 60MB`);

  // Bellek kullanımını göster
  const memoryUsage = process.memoryUsage();
  logger.log('Bellek kullanımı:', {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
  });
}

process.on('unhandledRejection', (error: Error) => {
  console.error('İşlenmemiş Promise hatası:', error);
});

bootstrap().catch(err => {
  console.error('Uygulama başlatma hatası:', err);
});
