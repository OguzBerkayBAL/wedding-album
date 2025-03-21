import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlbumsModule } from './albums/albums.module';
import { PhotosModule } from './photos/photos.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/wedding-album',
        useNewUrlParser: true,
        useUnifiedTopology: true,
        socketTimeoutMS: 60000, // 60 saniye
        keepAlive: true,
        keepAliveInitialDelay: 300000, // 5 dakika
        connectTimeoutMS: 60000, // 60 saniye
        serverSelectionTimeoutMS: 60000, // 60 saniye
        maxPoolSize: 10, // Bağlantı havuzu boyutu
        minPoolSize: 1, // Minimum havuz boyutu
        maxIdleTimeMS: 30000, // 30 saniye
        waitQueueTimeoutMS: 60000, // 60 saniye
        maxConnecting: 5, // Aynı anda maksimum bağlantı girişimi
        // Büyük dosyalar için BSON belge boyut limitini artır
        maxBsonObjectSize: 100 * 1024 * 1024, // 100MB (MongoDB'nin desteklediği maksimum boyut 16MB, ancak bu bazı driver'larda yükseltilir)
      }),
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    AlbumsModule,
    PhotosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
