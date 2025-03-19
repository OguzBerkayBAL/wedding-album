import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AlbumsService } from './albums/albums.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const albumsService = app.get(AlbumsService);

    // Seed test verisi oluşturma
    // Örnek veri 1
    await albumsService.create({
        title: 'Seda & Ömer Düğün Albümü',
        date: '1 Nisan 2025',
        couple: {
            name1: 'Seda',
            name2: 'Ömer',
        },
        description: 'Seda ve Ömer\'in düğün günündeki özel anıları. Güzel anılarınızı bizimle paylaşmak için fotoğraf yükleyebilirsiniz.',
    });

    // Örnek veri 2
    await albumsService.create({
        title: 'Ayşe & Mehmet Düğün Töreni',
        date: '15 Haziran 2024',
        couple: {
            name1: 'Ayşe',
            name2: 'Mehmet',
        },
        description: 'Ayşe ve Mehmet\'in muhteşem düğün töreninden kareler. Sizin çektiğiniz fotoğrafları da görmek isteriz!',
    });

    console.log('Örnek veriler başarıyla eklendi!');
    await app.close();
}

bootstrap(); 