import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefik (örneğin, /api)
  app.setGlobalPrefix('api');

  // CORS ayarları - tüm kaynaklardan gelen isteklere izin ver
  app.enableCors({
    origin: true, // Tüm kaynaklar
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // JSON limit artırımı
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Validasyon pipe - try-catch ile sarmala
  try {
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // Bilinmeyen özelliklere izin ver
    }));
    console.log('ValidationPipe başarıyla yüklendi');
  } catch (error) {
    console.warn('ValidationPipe yüklenemedi, ancak uygulama çalışmaya devam edecek:', error.message);
  }

  // HTTP uyarıları loglama
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
