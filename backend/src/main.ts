import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { join } from 'path';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Dosya yükleme limitini 60MB'a ayarla
  app.use(bodyParser.json({ limit: '60mb' }));
  app.use(bodyParser.urlencoded({ limit: '60mb', extended: true }));

  // CORS ayarları
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3002', 'https://frontend-iwc82e2ki-oguzberkays-projects.vercel.app', 'https://wedding-album-frontend.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
    exposedHeaders: 'Content-Range,X-Total-Count',
    maxAge: 3600,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Statik dosyaları servis et
  const uploadsDir = join(__dirname, '..', 'uploads');
  console.log('Static files are served from', uploadsDir);
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
  });

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
  console.log(`Static files are served from ${uploadsDir}`);
  console.log(`File upload limit set to 60MB`);
}
bootstrap();
