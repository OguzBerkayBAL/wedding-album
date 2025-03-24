import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlbumsModule } from './albums/albums.module';
import { PhotosModule } from './photos/photos.module';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryProvider } from './config/cloudinary.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        const logger = new Logger('MongooseModule');

        if (!uri) {
          logger.error('MongoDB URI bulunamadı! .env dosyasını kontrol edin.');
        } else {
          logger.log('MongoDB bağlantısı yapılandırılıyor...');
        }

        return {
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    AlbumsModule,
    PhotosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CloudinaryProvider,
    {
      provide: 'APP_LOGGER',
      useFactory: () => {
        return new Logger('AppModule');
      }
    }
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    const logger = new Logger('AppModule');
    logger.log('Application initialized');

    // Kritik çevre değişkenlerini kontrol et
    const cloudinaryName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const cloudinaryKey = this.configService.get('CLOUDINARY_API_KEY');
    const cloudinarySecret = this.configService.get('CLOUDINARY_API_SECRET');
    const cloudinaryUrl = this.configService.get('CLOUDINARY_URL');

    // Cloudinary bilgilerini kontrol et
    if (!cloudinaryUrl && (!cloudinaryName || !cloudinaryKey || !cloudinarySecret)) {
      logger.error('Cloudinary yapılandırması eksik! Fotoğraf yüklemeleri çalışmayabilir.');
    } else {
      logger.log('Cloudinary yapılandırması tamam.');
    }
  }
}
